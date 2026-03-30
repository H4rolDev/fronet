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
import { InsumoDetalleDTO, ModalInputData } from '../../../../models/insumo-dto';
import { UnidadMedidaListadoDTO } from '../../../../models/unidad-medida-dto';
import { InsumoService } from '../../../../services/insumo.service';
import { UnidadMedidaService } from '../../../../services/unidad-medida.service';


@Component({
  selector: 'app-insumo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './insumo-modal.component.html',
  styleUrls: ['./insumo-modal.component.css'],
})
export class InsumoModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) inputData!: ModalInputData;
  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  // ── Estado ─────────────────────────────────────────────────────────────────
  cargandoInicial = signal<boolean>(false);
  guardando       = signal<boolean>(false);
  errorApi        = signal<string | null>(null);

  /** Combo de unidades de medida para el <select> */
  unidades        = signal<UnidadMedidaListadoDTO[]>([]);

  /** Detalle original en modo editar (para preservar campos de auditoría) */
  private detalleOriginal: InsumoDetalleDTO | null = null;

  // ── Formulario ─────────────────────────────────────────────────────────────
  formulario!: FormGroup;

  // ── Getters de template ────────────────────────────────────────────────────
  get nombre():          AbstractControl { return this.formulario.get('nombre')!; }
  get idUnidadMedida():  AbstractControl { return this.formulario.get('idUnidadMedida')!; }
  get stockActual():     AbstractControl { return this.formulario.get('stockActual')!; }
  get stockMinimo():     AbstractControl { return this.formulario.get('stockMinimo')!; }
  get costoUnitario():   AbstractControl { return this.formulario.get('costoUnitario')!; }

  get esEditar():    boolean { return this.inputData.mode === 'editar'; }
  get tituloModal(): string  { return this.esEditar ? 'Editar Insumo' : 'Nuevo Insumo'; }

  private destroy$ = new Subject<void>();

  constructor(
    private fb:                 FormBuilder,
    private insumoService:      InsumoService,
    private unidadMedidaService: UnidadMedidaService,
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
        [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S+/)],
      ],
      idUnidadMedida: [
        null,
        [Validators.required, Validators.min(1)],
      ],
      stockActual: [
        0,
        [Validators.required, Validators.min(0)],
      ],
      stockMinimo: [
        0,
        [Validators.required, Validators.min(0)],
      ],
      costoUnitario: [
        0,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  // ── Carga de datos iniciales ───────────────────────────────────────────────

  /**
   * En CREAR: carga solo el combo de unidades.
   * En EDITAR: carga en paralelo el combo y el detalle del insumo con forkJoin,
   *            así el select ya tiene las opciones cuando hace el patchValue.
   */
  private cargarDatosIniciales(): void {
    this.cargandoInicial.set(true);
    this.formulario.disable();

    if (this.esEditar && this.inputData.id) {

      // forkJoin espera a que AMBAS peticiones terminen antes de continuar
      forkJoin({
        unidades: this.unidadMedidaService.obtenerListado(),
        detalle:  this.insumoService.obtenerPorId(this.inputData.id),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoInicial.set(false);
          this.formulario.enable();
        })
      )
      .subscribe({
        next: ({ unidades, detalle }) => {
          this.unidades.set(unidades);
          this.detalleOriginal = detalle;

          // Rellenar formulario con los valores actuales del insumo
          this.formulario.patchValue({
            nombre:         detalle.nombre,
            idUnidadMedida: detalle.idUnidadMedida,
            stockActual:    detalle.stockActual,
            stockMinimo:    detalle.stockMinimo,
            costoUnitario:  detalle.costoUnitario,
          });
        },
        error: (err: Error) => {
          this.errorApi.set(`Error al cargar los datos: ${err.message}`);
        },
      });

    } else {

      // Solo se necesita el combo de unidades
      this.unidadMedidaService.obtenerListado()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.cargandoInicial.set(false);
            this.formulario.enable();
          })
        )
        .subscribe({
          next: unidades => this.unidades.set(unidades),
          error: (err: Error) => this.errorApi.set(err.message),
        });
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    this.errorApi.set(null);
    this.guardando.set(true);

    const datos = {
      nombre:         this.formulario.value.nombre.trim(),
      idUnidadMedida: Number(this.formulario.value.idUnidadMedida),
      stockActual:    Number(this.formulario.value.stockActual),
      stockMinimo:    Number(this.formulario.value.stockMinimo),
      costoUnitario:  Number(this.formulario.value.costoUnitario),
    };

    const operacion$ = this.esEditar
      ? this.insumoService.modificar(this.inputData.id!, datos, this.detalleOriginal!)
      : this.insumoService.insertar(datos);

    operacion$
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          const msg = this.esEditar
            ? `"${datos.nombre}" actualizado correctamente.`
            : `"${datos.nombre}" registrado correctamente.`;
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

    if (e['required'])  return 'Este campo es obligatorio.';
    if (e['pattern'])   return 'No puede contener solo espacios.';
    if (e['min']) {
      const min = e['min'].min;
      return `El valor mínimo es ${min}.`;
    }
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
