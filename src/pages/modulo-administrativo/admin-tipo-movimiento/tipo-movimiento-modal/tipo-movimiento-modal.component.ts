import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalInputData, TipoMovimientoDetalleDTO } from '../../../../models/tipo-movimiento-dto';
import { finalize, observeOn, Subject, takeUntil } from 'rxjs';
import { TipoMovimientoService } from '../../../../services/tipo-movimiento.service';

@Component({
  selector: 'app-tipo-movimiento-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tipo-movimiento-modal.component.html',
  styleUrl: './tipo-movimiento-modal.component.css'
})
export class TipoMovimientoModalComponent {
// ────────────────────────────────────────────────────────────────────────────
  // ENTRADAS Y SALIDAS
  // ────────────────────────────────────────────────────────────────────────────

  /** Datos del padre: { mode: 'crear' | 'editar', id?: number } */
  @Input({ required: true }) inputData!: ModalInputData;

  /** Emite cuando el usuario cancela o cierra el modal */
  @Output() cerrar = new EventEmitter<void>();

  /**
   * Emite el mensaje de éxito al padre para que lo muestre como toast.
   * El padre también recarga la tabla al recibirlo.
   */
  @Output() guardado = new EventEmitter<string>();

  /** true mientras se carga el detalle del registro en modo editar */
  cargandoDetalle = signal<boolean>(false);

  /** true mientras se ejecuta la petición de guardar */
  guardando = signal<boolean>(false);

  /** Mensaje de error de la API (distinto a los errores de validación del form) */
  errorApi = signal<string | null>(null);

  /**
   * Guarda el detalle original del registro en modo editar.
   * Necesario para preservar campos como fechaCreacion al hacer el PUT.
   */
  private detalleOriginal: TipoMovimientoDetalleDTO | null = null;

  formulario!: FormGroup;

  /** Acceso directo al control 'nombre' */
  get nombre(): AbstractControl {
    return this.formulario.get('nombre')!;
  }

  /** true si el formulario está en modo editar */
  get esEditar(): boolean {
    return this.inputData.mode === 'editar';
  }

  /** Título dinámico del modal */
  get tituloModal(): string {
    return this.esEditar ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento';
  }

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tipoMovimientoService: TipoMovimientoService,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();

    if (this.esEditar && this.inputData.id) {
      this.cargarDetalle(this.inputData.id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.guardando()) this.onCerrar();
  }

  /**
   * Inicializa el FormGroup con sus controles y validadores.
   * Separado en su propio método para mantener ngOnInit limpio.
   */
  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S+/),],],
    });
  }

  /**
   * Llama a ObtenerListadoPorId y pre-rellena el formulario con los datos
   * del registro seleccionado. También guarda el detalle original para el PUT.
   *
   * @param id - ID del registro a cargar
   */
  private cargarDetalle(id: number): void {
    this.cargandoDetalle.set(true);
    this.formulario.disable();

    this.tipoMovimientoService
      .obtenerPorId(id).pipe( takeUntil(this.destroy$), finalize(() => { this.cargandoDetalle.set(false); this.formulario.enable();}),)
      .subscribe({
        next: (detalle) => {
          this.detalleOriginal = detalle;
          // patchValue solo actualiza los campos que existen en el form
          this.formulario.patchValue({
            nombre: detalle.nombre,
          });
        },
        error: (err: Error) => {
          this.errorApi.set(`Error al cargar los datos: ${err.message}`);
        },
      });
  }

  /**
   * Valida el formulario y llama al servicio correspondiente.
   * Si el formulario tiene errores, los marca como touched para mostrarlos.
   */
  onSubmit(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    this.errorApi.set(null);
    this.guardando.set(true);

    const datosForm = {
      nombre: this.formulario.value.nombre.trim(),
    };

    const operacion$ = this.esEditar ? this.tipoMovimientoService.modificar(
          this.inputData.id!,
          datosForm,
          this.detalleOriginal!,
        ) : this.tipoMovimientoService.insertar(datosForm);

    operacion$.pipe(
        takeUntil(this.destroy$),
        finalize(() => this.guardando.set(false)),
      ).subscribe({
        next: () => {
          const msg = this.esEditar
            ? `"${datosForm.nombre}" actualizado correctamente.`
            : `"${datosForm.nombre}" creado correctamente.`;
          this.guardado.emit(msg);
        },
        error: (err: Error) => {
          this.errorApi.set(err.message);
        },
      });
  }

  /** Emite el evento de cierre hacia el padre */
  onCerrar(): void {
    this.cerrar.emit();
  }

  /**
   * Cierra el modal al hacer click en el overlay (fondo oscuro).
   * Solo cierra si el click fue directamente en el overlay, no en el panel.
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (!this.guardando()) this.onCerrar();
    }
  }

  /**
   * Retorna true si el campo debe mostrar su mensaje de error.
   * Condición: campo inválido Y (tocado O el formulario fue enviado).
   *
   * @param campo - Nombre del control del formulario
   */
  mostrarError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Retorna el mensaje de error apropiado para un campo.
   * Evalúa los errores en orden de prioridad.
   *
   * @param campo - Nombre del control del formulario
   */
  mensajeError(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control || !control.errors) return '';

    const { errors } = control;

    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['pattern']) return 'No puede contener solo espacios.';
    if (errors['minlength']) {
      const min = errors['minlength'].requiredLength;
      return `Mínimo ${min} caractere${min > 1 ? 's' : ''}.`;
    }
    if (errors['maxlength']) {
      const max = errors['maxlength'].requiredLength;
      return `Máximo ${max} caracteres.`;
    }

    return 'Valor inválido.';
  }
}
