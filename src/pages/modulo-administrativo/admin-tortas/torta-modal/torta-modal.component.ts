import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { TortaDetalleDTO, ModalInputData } from '../../../../models/torta-dto';
import { CategoriaTortaListadoDTO } from '../../../../models/torta-dto';
import { TortaService } from '../../../../services/torta.service';
import { CategoriaTortaService } from '../../../../services/categoria-torta.service';

@Component({
  selector: 'app-torta-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './torta-modal.component.html',
  styleUrls: ['./torta-modal.component.css'],
})
export class TortaModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) inputData!: ModalInputData;
  @Output() cerrar   = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  // ── Estado ─────────────────────────────────────────────────────────────────
  cargandoInicial = signal<boolean>(false);
  guardando       = signal<boolean>(false);
  errorApi        = signal<string | null>(null);

  /** Combo de categorías para el <select> */
  categorias = signal<CategoriaTortaListadoDTO[]>([]);

  /** Detalle original en modo editar */
  private detalleOriginal: TortaDetalleDTO | null = null;

  // ── Estado de imagen ───────────────────────────────────────────────────────
  /** Archivo seleccionado por el usuario */
  imagenSeleccionada = signal<File | null>(null);
  /** Preview en base64 de la nueva imagen seleccionada */
  imagenPreview      = signal<string | null>(null);
  /** URL de imagen existente (en modo editar) */
  imagenExistente    = signal<string | null>(null);
  /** Si el usuario pidió quitar la imagen existente */
  quitarImagen       = signal<boolean>(false);

  // ── Formulario ─────────────────────────────────────────────────────────────
  formulario!: FormGroup;

  // ── Getters ────────────────────────────────────────────────────────────────
  get nombre():           AbstractControl { return this.formulario.get('nombre')!; }
  get idCategoriaTorta(): AbstractControl { return this.formulario.get('idCategoriaTorta')!; }
  get descripcion():      AbstractControl { return this.formulario.get('descripcion')!; }
  get cantidades():       AbstractControl { return this.formulario.get('cantidades')!; }
  get precioVenta():      AbstractControl { return this.formulario.get('precioVenta')!; }
  get esPersonalizable(): AbstractControl { return this.formulario.get('esPersonalizable')!; }

  get esEditar():    boolean { return this.inputData.mode === 'editar'; }
  get tituloModal(): string  { return this.esEditar ? 'Editar Torta' : 'Nueva Torta'; }

  /** Determina si hay imagen para mostrar en preview (nueva o existente) */
  get hayImagenPreview(): boolean {
    return !!this.imagenPreview() || (!!this.imagenExistente() && !this.quitarImagen());
  }

  /** URL de preview: prioriza la nueva seleccionada, si no usa la existente */
  get urlPreview(): string | null {
    return this.imagenPreview() ?? (this.quitarImagen() ? null : this.imagenExistente());
  }

  private destroy$ = new Subject<void>();

  constructor(
    private fb:                   FormBuilder,
    private tortaService:         TortaService,
    private categoriaTortaService: CategoriaTortaService,
  ) {}

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (!this.guardando()) this.onCerrar(); }

  // ── Formulario ─────────────────────────────────────────────────────────────

  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nombre: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(150), Validators.pattern(/\S+/)],
      ],
      idCategoriaTorta: [
        null,
        [Validators.required, Validators.min(1)],
      ],
      descripcion: [
        '',
        [Validators.maxLength(500)],
      ],
      cantidades: [
        '',
        [Validators.maxLength(200)],
      ],
      precioVenta: [
        null,
        [Validators.required, Validators.min(0)],
      ],
      esPersonalizable: [false],
    });
  }

  // ── Carga de datos iniciales ───────────────────────────────────────────────

  private cargarDatosIniciales(): void {
    this.cargandoInicial.set(true);
    this.formulario.disable();

    if (this.esEditar && this.inputData.id) {

      forkJoin({
        categorias: this.categoriaTortaService.obtenerListado(),
        detalle:    this.tortaService.obtenerPorId(this.inputData.id),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoInicial.set(false);
          this.formulario.enable();
        })
      )
      .subscribe({
        next: ({ categorias, detalle }) => {
          this.categorias.set(categorias);
          this.detalleOriginal = detalle;

          // Si tiene imagen, cargarla en el estado
          if (detalle.imagenUrl) {
            this.imagenExistente.set(detalle.imagenUrl);
          }

          this.formulario.patchValue({
            nombre:           detalle.nombre,
            idCategoriaTorta: detalle.idCategoriaTorta,
            descripcion:      detalle.descripcion ?? '',
            cantidades:       detalle.cantidades ?? '',
            precioVenta:      detalle.precioVenta,
            esPersonalizable: detalle.esPersonalizable ?? false,
          });
        },
        error: (err: Error) => {
          this.errorApi.set(`Error al cargar los datos: ${err.message}`);
        },
      });

    } else {

      this.categoriaTortaService.obtenerListado()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.cargandoInicial.set(false);
            this.formulario.enable();
          })
        )
        .subscribe({
          next: categorias => this.categorias.set(categorias),
          error: (err: Error) => this.errorApi.set(err.message),
        });
    }
  }

  // ── Manejo de imagen ───────────────────────────────────────────────────────

  onArchivoSeleccionado(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    // Validaciones básicas en cliente
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.errorApi.set('Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
      input.value = '';
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.errorApi.set('La imagen no debe superar los 5 MB.');
      input.value = '';
      return;
    }

    this.errorApi.set(null);
    this.imagenSeleccionada.set(archivo);
    this.quitarImagen.set(false);

    // Generar preview con FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagenPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(archivo);
  }

  quitarImagenSeleccionada(): void {
    this.imagenSeleccionada.set(null);
    this.imagenPreview.set(null);
    // Resetear el input file buscándolo por id
    const inputFile = document.getElementById('imagen') as HTMLInputElement;
    if (inputFile) inputFile.value = '';
  }

  onQuitarImagenExistente(): void {
    this.quitarImagen.set(true);
    this.imagenExistente.set(null);
    this.imagenSeleccionada.set(null);
    this.imagenPreview.set(null);
  }

  /** Dispara el click del input file oculto */
  abrirSelectorArchivo(): void {
    const inputFile = document.getElementById('imagen') as HTMLInputElement;
    if (inputFile) inputFile.click();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    this.errorApi.set(null);
    this.guardando.set(true);

    const datos = {
      nombre:           this.formulario.value.nombre.trim(),
      idCategoriaTorta: Number(this.formulario.value.idCategoriaTorta),
      descripcion:      this.formulario.value.descripcion?.trim() || null,
      cantidades:       this.formulario.value.cantidades?.trim() || null,
      stockDisponible:  0,
      precioVenta:      Number(this.formulario.value.precioVenta),
      esPersonalizable: Boolean(this.formulario.value.esPersonalizable),
    };

    const imagenAEnviar = this.imagenSeleccionada();

    const operacion$ = this.esEditar
      ? this.tortaService.modificar(this.inputData.id!, datos, this.detalleOriginal!, imagenAEnviar)
      : this.tortaService.insertar(datos, imagenAEnviar);

    operacion$
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          const msg = this.esEditar
            ? `"${datos.nombre}" actualizada correctamente.`
            : `"${datos.nombre}" registrada correctamente.`;
          this.guardado.emit(msg);
        },
        error: (err: Error) => this.errorApi.set(err.message),
      });
  }

  onCerrar(): void { this.cerrar.emit(); }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (!this.guardando()) this.onCerrar();
    }
  }

  // ── Helpers de validación ──────────────────────────────────────────────────

  mostrarError(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  mensajeError(campo: string): string {
    const c = this.formulario.get(campo);
    if (!c || !c.errors) return '';
    const e = c.errors;
    if (e['required'])   return 'Este campo es obligatorio.';
    if (e['pattern'])    return 'No puede contener solo espacios.';
    if (e['min'])        return `El valor mínimo es ${e['min'].min}.`;
    if (e['minlength'])  return `Mínimo ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength'])  return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
