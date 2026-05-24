import { Component, computed, signal } from '@angular/core';
import { ModalInputData, Notificacion, TipoMovimientoListadoDTO } from '../../../models/tipo-movimiento-dto';
import { TipoMovimientoService } from '../../../services/tipo-movimiento.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { TipoMovimientoModalComponent } from './tipo-movimiento-modal/tipo-movimiento-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-tipo-movimiento',
  imports: [CommonModule, FormsModule, TipoMovimientoModalComponent],
  templateUrl: './admin-tipo-movimiento.component.html',
  styleUrl: './admin-tipo-movimiento.component.css'
})
export class AdminTipoMovimientoComponent {
  private destroy$ = new Subject<void>();
  private toastTimer: any = null;

  // ── Estado ─────────────────────────────────────────────────────────────────
  unidades = signal<TipoMovimientoListadoDTO[]>([]);
  textoBusqueda = signal<string>('');
  cargandoTabla = signal<boolean>(false);
  eliminando = signal<boolean>(false);
  modalAbierto = signal<boolean>(false);
  modalInputData = signal<ModalInputData | null>(null);
  idParaEliminar = signal<number | null>(null);
  nombreParaEliminar = signal<string>('');
  notificacion = signal<Notificacion | null>(null);

  constructor(private tipoMovimientoService: TipoMovimientoService) {}

  /** Filtra la lista por texto en tiempo real */
  unidadesFiltradas = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.unidades();
    return this.unidades().filter((u) =>
      u.nombre.toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.cargarListado();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────
  cargarListado(): void {
    this.cargandoTabla.set(true);
    this.tipoMovimientoService
      .obtenerListado()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cargandoTabla.set(false)),
      )
      .subscribe({
        next: (data) => this.unidades.set(data),
        error: (err: Error) => this.mostrarNotificacion('error', err.message),
      });
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  onBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
  }
  limpiarBusqueda(): void {
    this.textoBusqueda.set('');
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  abrirModalCrear(): void {
    this.modalInputData.set({ mode: 'crear' });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(id: number): void {
    this.modalInputData.set({ mode: 'editar', id });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.modalInputData.set(null);
  }

  onGuardadoExitoso(mensaje: string): void {
    this.cerrarModal();
    this.cargarListado();
    this.mostrarNotificacion('exito', mensaje);
  }

  // ── Eliminación ────────────────────────────────────────────────────────────
  confirmarEliminar(unidad: TipoMovimientoListadoDTO): void {
    this.idParaEliminar.set(unidad.id);
    this.nombreParaEliminar.set(unidad.nombre);
  }

  cancelarEliminar(): void {
    this.idParaEliminar.set(null);
    this.nombreParaEliminar.set('');
  }

  ejecutarEliminar(): void {
    const id = this.idParaEliminar();
    if (!id) return;

    this.eliminando.set(true);
    this.tipoMovimientoService
      .eliminar(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.eliminando.set(false)),
      )
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.cargarListado();
          this.mostrarNotificacion(
            'exito',
            'Tipo de movimiento eliminado correctamente.',
          );
        },
        error: (err: Error) => {
          this.cancelarEliminar();
          this.mostrarNotificacion('error', err.message);
        },
      });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  mostrarNotificacion(tipo: Notificacion['tipo'], mensaje: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.notificacion.set(null), 4500);
  }

  cerrarNotificacion(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set(null);
  }

  // ── Helpers de template ────────────────────────────────────────────────────
  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  trackById(_i: number, item: TipoMovimientoListadoDTO): number {
    return item.id;
  }
}
