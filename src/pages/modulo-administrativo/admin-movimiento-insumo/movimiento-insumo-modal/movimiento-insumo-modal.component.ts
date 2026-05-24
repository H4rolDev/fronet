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
import {
  MovimientoInsumoDetalleDTO,
  InsumoLoteListadoDTO,
  TipoMovimientoListadoDTO,
  ModalInputData,
} from '../../../../models/movimiento-insumo-dto';
import { MovimientoInsumoService } from '../../../../services/movimiento-insumo.service';

@Component({
  selector: 'app-movimiento-insumo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movimiento-insumo-modal.component.html',
  styleUrls: ['./movimiento-insumo-modal.component.css'],
})
export class MovimientoInsumoModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) inputData!: ModalInputData;
  @Output() cerrar   = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  // ── Estado ─────────────────────────────────────────────────────────────────
  cargandoInicial = signal<boolean>(false);
  guardando       = signal<boolean>(false);
  errorApi        = signal<string | null>(null);

  tiposMovimiento = signal<TipoMovimientoListadoDTO[]>([]);
  insumoLotes     = signal<InsumoLoteListadoDTO[]>([]);

  private detalleOriginal: MovimientoInsumoDetalleDTO | null = null;

  // ── Formulario ─────────────────────────────────────────────────────────────
  formulario!: FormGroup;

  get idTipoMovimiento(): AbstractControl { return this.formulario.get('idTipoMovimiento')!; }
  get idInsumoLote():     AbstractControl { return this.formulario.get('idInsumoLote')!; }
  get cantidad():         AbstractControl { return this.formulario.get('cantidad')!; }
  get fechaMovimiento():  AbstractControl { return this.formulario.get('fechaMovimiento')!; }
  get referencia():       AbstractControl { return this.formulario.get('referencia')!; }

  get esEditar():    boolean { return this.inputData.mode === 'editar'; }
  get tituloModal(): string  { return this.esEditar ? 'Editar Movimiento' : 'Nuevo Movimiento'; }

  /** Nombre del tipo seleccionado (para resaltar visualmente) */
  get tipoSeleccionado(): TipoMovimientoListadoDTO | null {
    const id = Number(this.idTipoMovimiento?.value);
    return this.tiposMovimiento().find(t => t.id === id) ?? null;
  }

  get esTipoEntrada(): boolean {
    return this.tipoSeleccionado?.nombre.toLowerCase().includes('entrada') ?? false;
  }
  get esTipoSalida(): boolean {
    return this.tipoSeleccionado?.nombre.toLowerCase().includes('salida') ?? false;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private fb:                  FormBuilder,
    private movimientoService:   MovimientoInsumoService,
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
    // Fecha actual formateada para datetime-local
    const ahora = this.toDatetimeLocal(new Date().toISOString());

    this.formulario = this.fb.group({
      idTipoMovimiento: [null, [Validators.required, Validators.min(1)]],
      idInsumoLote:     [null, [Validators.required, Validators.min(1)]],
      cantidad:         [null, [Validators.required, Validators.min(0.01)]],
      fechaMovimiento:  [ahora, [Validators.required]],
      referencia:       ['', [Validators.maxLength(300)]],
    });
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────

  private cargarDatosIniciales(): void {
    this.cargandoInicial.set(true);
    this.formulario.disable();

    if (this.esEditar && this.inputData.id) {

      forkJoin({
        tipos:   this.movimientoService.obtenerTiposMovimiento(),
        lotes:   this.movimientoService.obtenerInsumoLote(),
        detalle: this.movimientoService.obtenerPorId(this.inputData.id),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.cargandoInicial.set(false); this.formulario.enable(); })
      )
      .subscribe({
        next: ({ tipos, lotes, detalle }) => {
          this.tiposMovimiento.set(tipos);
          this.insumoLotes.set(lotes);
          this.detalleOriginal = detalle;

          this.formulario.patchValue({
            idTipoMovimiento: detalle.idTipoMovimiento,
            idInsumoLote:     detalle.idInsumoLote,
            cantidad:         detalle.cantidad,
            fechaMovimiento:  this.toDatetimeLocal(detalle.fechaMovimiento),
            referencia:       detalle.referencia ?? '',
          });
        },
        error: (err: Error) => this.errorApi.set(`Error al cargar los datos: ${err.message}`),
      });

    } else {

      forkJoin({
        tipos: this.movimientoService.obtenerTiposMovimiento(),
        lotes: this.movimientoService.obtenerInsumoLote(),
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.cargandoInicial.set(false); this.formulario.enable(); })
      )
      .subscribe({
        next: ({ tipos, lotes }) => {
          this.tiposMovimiento.set(tipos);
          this.insumoLotes.set(lotes);
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
      idInsumoLote:     Number(this.formulario.value.idInsumoLote),
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
          const lote = this.insumoLotes().find(l => l.id === datos.idInsumoLote);
          const tipo = this.tiposMovimiento().find(t => t.id === datos.idTipoMovimiento);
          const msg  = this.esEditar
            ? `Movimiento actualizado correctamente.`
            : `${tipo?.nombre ?? 'Movimiento'} de "${lote?.insumo}" registrado correctamente.`;
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

  /** Convierte ISO string a formato datetime-local (YYYY-MM-DDTHH:mm) */
  private toDatetimeLocal(iso: string): string {
    if (!iso || iso.startsWith('0001')) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  mostrarError(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  mensajeError(campo: string): string {
    const c = this.formulario.get(campo);
    if (!c || !c.errors) return '';
    const e = c.errors;
    if (e['required'])   return 'Este campo es obligatorio.';
    if (e['min'])        return `El valor mínimo es ${e['min'].min}.`;
    if (e['maxlength'])  return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }

  /** Etiqueta display para un lote: "LOT-000001 — Harina" */
  etiquetaLote(lote: InsumoLoteListadoDTO): string {
    return `${lote.numeroLote} — ${lote.insumo}`;
  }
}
