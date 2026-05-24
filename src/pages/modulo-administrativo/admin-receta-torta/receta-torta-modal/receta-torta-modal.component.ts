
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
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { FilaIngrediente, ModalInputData, RecetaTortaListadoDTO } from '../../../../models/receta-torta-dto';
import { InsumoListadoDTO } from '../../../../models/insumo-dto';
import { RecetaTortaService } from '../../../../services/receta-torta.service';
import { InsumoService } from '../../../../services/insumo.service';
import { environment } from '../../../../environments/environment';


/**
 * DTO mínimo para el combo de tortas.
 * Ajustar la URL y el modelo según tu endpoint real de Tortas.
 */
export interface TortaComboDTO {
  id: number;
  nombre: string;
}

/** Contador incremental para IDs locales de filas */
let uidCounter = 0;
function nextUid(): number { return ++uidCounter; }

@Component({
  selector: 'app-receta-torta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receta-torta-modal.component.html',
  styleUrls: ['./receta-torta-modal.component.css'],
})
export class RecetaTortaModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) inputData!: ModalInputData;
  @Output() cerrar   = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  // ── Estado ─────────────────────────────────────────────────────────────────
  cargandoInicial = signal<boolean>(false);
  guardando       = signal<boolean>(false);
  errorApi        = signal<string | null>(null);

  /** Lista de tortas para el select en modo crear */
  tortas   = signal<TortaComboDTO[]>([]);
  /** Lista de insumos disponibles para los selects de ingredientes */
  insumos  = signal<InsumoListadoDTO[]>([]);

  /** Torta seleccionada en modo crear */
  idTortaSeleccionada = signal<number | null>(null);

  /** Filas editables de la tabla de ingredientes */
  filas = signal<FilaIngrediente[]>([]);

  // ── Computados de validación ────────────────────────────────────────────────

  /** IDs de insumos actualmente seleccionados en la tabla */
  insumosSeleccionados = computed(() =>
    this.filas()
      .map(f => f.idInsumo)
      .filter((id): id is number => id !== null)
  );

  /** true si hay algún insumo repetido en la tabla */
  hayDuplicados = computed(() => {
    const ids = this.insumosSeleccionados();
    return ids.length !== new Set(ids).size;
  });

  /** Lista de errores de validación para mostrar antes de guardar */
  erroresValidacion = computed<string[]>(() => {
    const errores: string[] = [];
    const f = this.filas();

    if (this.esCrear && !this.idTortaSeleccionada()) {
      errores.push('Debes seleccionar una torta.');
    }
    if (f.length === 0) {
      errores.push('La receta debe tener al menos un ingrediente.');
    }
    if (f.some(fila => fila.idInsumo === null)) {
      errores.push('Todos los ingredientes deben tener un insumo seleccionado.');
    }
    if (f.some(fila => !fila.cantidadRequerida || fila.cantidadRequerida <= 0)) {
      errores.push('Todas las cantidades deben ser mayores a 0.');
    }
    if (this.hayDuplicados()) {
      errores.push('No puedes agregar el mismo insumo más de una vez.');
    }
    return errores;
  });

  // ── Getters ─────────────────────────────────────────────────────────────────
  get esCrear():     boolean { return this.inputData.mode === 'crear'; }
  get esEditar():    boolean { return this.inputData.mode === 'editar'; }
  get tituloModal(): string  { return this.esCrear ? 'Nueva Receta' : 'Editar Receta'; }

  /** Nombre de la torta seleccionada (para mostrar en el header en modo crear) */
  get nombreTortaSeleccionada(): string {
    if (this.esEditar) return this.inputData.nombreTorta ?? '';
    const torta = this.tortas().find(t => t.id === this.idTortaSeleccionada());
    return torta?.nombre ?? '';
  }

  private destroy$ = new Subject<void>();

  constructor(
    private recetaTortaService: RecetaTortaService,
    private insumoService:      InsumoService,
  ) {}

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  ngOnInit(): void    { this.cargarDatosIniciales(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (!this.guardando()) this.onCerrar(); }

  // ── Carga de datos ─────────────────────────────────────────────────────────

  private cargarDatosIniciales(): void {
    this.cargandoInicial.set(true);

    if (this.esEditar) {
      // Cargar en paralelo: insumos + filas actuales de la torta
      forkJoin({
        insumos: this.insumoService.obtenerListado(),
        receta:  this.recetaTortaService.obtenerListado(),
      })
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoInicial.set(false)))
      .subscribe({
        next: ({ insumos, receta }) => {
          this.insumos.set(insumos);

          // Filtrar solo las filas de la torta que se está editando
          const filasDeEstaTorta = receta.filter(
            r => r.idTorta === this.inputData.idTorta
          );

          // Convertir filas del API a FilaIngrediente editables
          this.filas.set(filasDeEstaTorta.map(f => ({
            _uid: nextUid(),
            idInsumo: f.idInsumo,
            cantidadRequerida: f.cantidadRequerida,
            esNueva: false,
            abreviatura: this.abreviaturaInsumo(f.idInsumo),
          })));
        },
        error: (err: Error) => this.errorApi.set(err.message),
      });

    } else {
      // En crear: solo cargar insumos + tortas disponibles
      forkJoin({
        insumos: this.insumoService.obtenerListado(),
        tortas:  this.cargarTortas(),
      }).pipe(takeUntil(this.destroy$), finalize(() => this.cargandoInicial.set(false)))
      .subscribe({
        next: ({ insumos, tortas }) => {
          this.insumos.set(insumos);
          this.tortas.set(tortas);
          // Iniciar con una fila vacía para que el formulario no se vea vacío
          this.agregarFila();
        },
        error: (err: Error) => this.errorApi.set(err.message),
      });
    }
  }

  /**
   * Carga el combo de tortas disponibles.
   * AJUSTAR la URL según tu endpoint real de Tortas.
   */
  private cargarTortas() {
    return this.insumoService['http']
      .get<TortaComboDTO[]>(`${environment.apiUrl}/Torta/ObtenerCombo`);
  }

  // ── Gestión de filas ───────────────────────────────────────────────────────

  /** Agrega una nueva fila vacía al final de la tabla */
  agregarFila(): void {
    this.filas.update(filas => [
      ...filas,
      { _uid: nextUid(), idInsumo: null, cantidadRequerida: null, esNueva: true, abreviatura: '—' },
    ]);
  }

  /**
   * Elimina una fila de la tabla por su _uid local.
   * Si es la última fila, muestra error en lugar de eliminar.
   */
  eliminarFila(uid: number): void {
    if (this.filas().length === 1) {
      this.errorApi.set('La receta debe tener al menos un ingrediente.');
      return;
    }
    this.filas.update(filas => filas.filter(f => f._uid !== uid));
    this.errorApi.set(null);
  }

  /** Actualiza el idInsumo de una fila */
  onCambioInsumo(uid: number, idInsumo: number | null): void {
    const id = Number(idInsumo) || null;
    this.filas.update(filas =>
      filas.map(f => f._uid === uid ? { ...f, idInsumo: id, abreviatura: this.abreviaturaInsumo(id) } : f)
    );
  }

  /** Actualiza la cantidad de una fila */
  onCambioCantidad(uid: number, cantidad: string): void {
    const val = parseFloat(cantidad);
    this.filas.update(filas =>
      filas.map(f => f._uid === uid ? { ...f, cantidadRequerida: isNaN(val) ? null : val } : f)
    );
  }

  /**
   * Retorna true si el insumo ya está seleccionado en OTRA fila.
   * Usado para marcar visualmente los selects duplicados.
   */
  esInsumoRepetido(uid: number, idInsumo: number | null): boolean {
    if (!idInsumo) return false;
    const otrasFilas = this.filas().filter(f => f._uid !== uid);
    return otrasFilas.some(f => f.idInsumo === Number(idInsumo));
  }

  /**
   * Retorna el nombre de un insumo por su ID.
   * Usado para el tooltip de accesibilidad en los selects.
   */
  nombreInsumo(id: number | null): string {
    if (!id) return '';
    return this.insumos().find(i => i.id === id)?.nombre ?? '';
  }

  abreviaturaInsumo(id: number | null): string {
    if (!id) return '—';
    return this.insumos().find(i => i.id === id)?.abreviatura ?? '—';
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.errorApi.set(null);

    // Validar antes de enviar
    const errores = this.erroresValidacion();
    if (errores.length > 0) {
      this.errorApi.set(errores[0]); // mostrar el primer error
      return;
    }

    const idTorta = this.esEditar
      ? this.inputData.idTorta!
      : this.idTortaSeleccionada()!;

    const detalles = this.filas().map(f => ({
      idInsumo: f.idInsumo!,
      cantidadRequerida: f.cantidadRequerida!,
    }));

    this.guardando.set(true);

    const operacion$ = this.esEditar
      ? this.recetaTortaService.actualizar(idTorta, detalles)
      : this.recetaTortaService.insertar(idTorta, detalles);

    operacion$
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          const nombre = this.nombreTortaSeleccionada || `ID ${idTorta}`;
          const msg = this.esEditar
            ? `Receta de "${nombre}" actualizada correctamente.`
            : `Receta de "${nombre}" creada correctamente.`;
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

  trackByUid(_i: number, fila: FilaIngrediente): number { return fila._uid; }
}
