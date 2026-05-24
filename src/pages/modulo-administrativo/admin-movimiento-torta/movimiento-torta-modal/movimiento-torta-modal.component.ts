import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  HostListener,
  signal,
  computed,
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
import {
  MovimientoTortaDetalleDTO,
  TortaComboDTO,
  TipoMovimientoDTO,
  ModalInputData,
} from '../../../../models/movimiento-torta-dto';
import { MovimientoTortaService } from '../../../../services/movimiento-torta.service';

@Component({
  selector: 'app-movimiento-torta-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movimiento-torta-modal.component.html',
  styleUrls: ['./movimiento-torta-modal.component.css'],
})
export class MovimientoTortaModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) inputData!: ModalInputData;
  @Output() cerrar   = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  // ── Estado ─────────────────────────────────────────────────────────────────
  cargandoInicial = signal<boolean>(false);
  guardando       = signal<boolean>(false);
  errorApi        = signal<string | null>(null);

  tiposMovimiento = signal<TipoMovimientoDTO[]>([]);
  tortas          = signal<TortaComboDTO[]>([]);

  private detalleOriginal: MovimientoTortaDetalleDTO | null = null;

  // ── Formulario ─────────────────────────────────────────────────────────────
  formulario!: FormGroup;

  get idTipoMovimiento(): AbstractControl { return this.formulario.get('idTipoMovimiento')!; }
  get idTorta():          AbstractControl { return this.formulario.get('idTorta')!; }
  get cantidad():         AbstractControl { return this.formulario.get('cantidad')!; }
  get fechaMovimiento():  AbstractControl { return this.formulario.get('fechaMovimiento')!; }
  get referencia():       AbstractControl { return this.formulario.get('referencia')!; }

  get esEditar():    boolean { return this.inputData.mode === 'editar'; }
  get tituloModal(): string  { return this.esEditar ? 'Editar Movimiento' : 'Nuevo Movimiento de Torta'; }

  /** Tipo seleccionado actualmente */
  get tipoSeleccionado(): TipoMovimientoDTO | null {
    const id = Number(this.idTipoMovimiento?.value);
    return this.tiposMovimiento().find(t => t.id === id) ?? null;
  }
  get esTipoEntrada(): boolean {
    return this.tipoSeleccionado?.nombre.toLowerCase().includes('entrada') ?? false;
  }
  get esTipoSalida(): boolean {
    return this.tipoSeleccionado?.nombre.toLowerCase().includes('salida') ?? false;
  }

  /** Torta seleccionada actualmente — para mostrar el card de preview */
  tortaSeleccionada = computed<TortaComboDTO | null>(() => {
    const id = Number(this.formulario?.get('idTorta')?.value);
    if (!id) return null;
    return this.tortas().find(t => t.id === id) ?? null;
  });

  /** Clase de stock según disponibilidad */
  claseStockTorta = computed<string>(() => {
    const t = this.tortaSeleccionada();
    if (!t) return '';
    if (t.stockDisponible === 0)  return 'stock--agotado';
    if (t.stockDisponible <= 3)   return 'stock--bajo';
    if (t.stockDisponible <= 8)   return 'stock--alerta';
    return 'stock--ok';
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb:                 FormBuilder,
    private movimientoService:  MovimientoTortaService,
  ) {}

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
    const ahora = this.toDatetimeLocal(new Date().toISOString());
    this.formulario = this.fb.group({
      idTipoMovimiento: [null, [Validators.required, Validators.min(1)]],
      idTorta:          [null, [Validators.required, Validators.min(1)]],
      cantidad:         [null, [Validators.required, Validators.min(0.01)]],
      fechaMovimiento:  [ahora, [Validators.required]],
      referencia:       ['',   [Validators.maxLength(300)]],
    });
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────

  private cargarDatosIniciales(): void {
    this.cargandoInicial.set(true);
    this.formulario.disable();

    if (this.esEditar && this.inputData.id) {
      forkJoin({
        tipos:   this.movimientoService.obtenerTiposMovimiento(),
        tortas:  this.movimientoService.obtenerTortas(),
        detalle: this.movimientoService.obtenerPorId(this.inputData.id),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.cargandoInicial.set(false); this.formulario.enable(); })
      )
      .subscribe({
        next: ({ tipos, tortas, detalle }) => {
          this.tiposMovimiento.set(tipos);
          this.tortas.set(tortas);
          this.detalleOriginal = detalle;
          this.formulario.patchValue({
            idTipoMovimiento: detalle.idTipoMovimiento,
            idTorta:          detalle.idTorta,
            cantidad:         detalle.cantidad,
            fechaMovimiento:  this.toDatetimeLocal(detalle.fechaMovimiento),
            referencia:       detalle.referencia ?? '',
          });
        },
        error: (err: Error) => this.errorApi.set(`Error al cargar los datos: ${err.message}`),
      });

    } else {
      forkJoin({
        tipos:  this.movimientoService.obtenerTiposMovimiento(),
        tortas: this.movimientoService.obtenerTortas(),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.cargandoInicial.set(false); this.formulario.enable(); })
      )
      .subscribe({
        next: ({ tipos, tortas }) => {
          this.tiposMovimiento.set(tipos);
          this.tortas.set(tortas);
        },
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
      idTipoMovimiento: Number(this.formulario.value.idTipoMovimiento),
      idTorta:          Number(this.formulario.value.idTorta),
      cantidad:         Number(this.formulario.value.cantidad),
      fechaMovimiento:  new Date(this.formulario.value.fechaMovimiento).toISOString(),
      referencia:       this.formulario.value.referencia?.trim() || null,
    };

    const operacion$ = this.esEditar
      ? this.movimientoService.modificar(this.inputData.id!, datos, this.detalleOriginal!)
      : this.movimientoService.insertar(datos);

    operacion$
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          const tortaNombre = this.tortas().find(t => t.id === datos.idTorta)?.nombre ?? 'Torta';
          const tipoNombre  = this.tiposMovimiento().find(t => t.id === datos.idTipoMovimiento)?.nombre ?? 'Movimiento';
          const msg = this.esEditar
            ? `Movimiento actualizado correctamente.`
            : `${tipoNombre} de "${tortaNombre}" registrado correctamente.`;
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  private toDatetimeLocal(iso: string): string {
    if (!iso || iso.startsWith('0001')) return '';
    const d   = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  formatearMoneda(valor: number | null): string {
    if (valor === null) return '—';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(valor);
  }

  mostrarError(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  mensajeError(campo: string): string {
    const c = this.formulario.get(campo);
    if (!c || !c.errors) return '';
    const e = c.errors;
    if (e['required'])  return 'Este campo es obligatorio.';
    if (e['min'])       return `El valor mínimo es ${e['min'].min}.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
