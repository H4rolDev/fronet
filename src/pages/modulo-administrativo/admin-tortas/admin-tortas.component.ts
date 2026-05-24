import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { TortaListadoDTO, ModalInputData, Notificacion } from '../../../models/torta-dto';
import { TortaService } from '../../../services/torta.service';
import { TortaModalComponent } from './torta-modal/torta-modal.component';

@Component({
  selector: 'app-admin-tortas',
  standalone: true,
  imports: [CommonModule, FormsModule, TortaModalComponent],
  templateUrl: './admin-tortas.component.html',
  styleUrls: ['./admin-tortas.component.css'],
})
export class AdminTortasComponent implements OnInit, OnDestroy {

  // ── Estado ─────────────────────────────────────────────────────────────────
  tortas             = signal<TortaListadoDTO[]>([]);
  textoBusqueda      = signal<string>('');
  cargandoTabla      = signal<boolean>(false);
  eliminando         = signal<boolean>(false);
  modalAbierto       = signal<boolean>(false);
  modalInputData     = signal<ModalInputData | null>(null);
  idParaEliminar     = signal<number | null>(null);
  nombreParaEliminar = signal<string>('');
  notificacion       = signal<Notificacion | null>(null);

  // ── Computados ─────────────────────────────────────────────────────────────

  /** Filtra por nombre, categoría o descripción */
  tortasFiltradas = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.tortas();
    return this.tortas().filter(t =>
      t.nombre.toLowerCase().includes(texto) ||
      t.nombreCategoriaTorta.toLowerCase().includes(texto) ||
      (t.descripcion ?? '').toLowerCase().includes(texto)
    );
  });

  // ── Limpieza ───────────────────────────────────────────────────────────────
  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private tortaService: TortaService) {}

  ngOnInit(): void  { this.cargarListado(); }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────
  cargarListado(): void {
    this.cargandoTabla.set(true);
    this.tortaService.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoTabla.set(false)))
      .subscribe({
        next: data => this.tortas.set(data),
        error: (err: Error) => this.mostrarNotificacion('error', err.message),
      });
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  onBusqueda(valor: string): void { this.textoBusqueda.set(valor); }
  limpiarBusqueda(): void { this.textoBusqueda.set(''); }

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
  confirmarEliminar(torta: TortaListadoDTO): void {
    this.idParaEliminar.set(torta.id);
    this.nombreParaEliminar.set(torta.nombre);
  }

  cancelarEliminar(): void {
    this.idParaEliminar.set(null);
    this.nombreParaEliminar.set('');
  }

  ejecutarEliminar(): void {
    const id = this.idParaEliminar();
    if (!id) return;

    this.eliminando.set(true);
    this.tortaService.eliminar(id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.cargarListado();
          this.mostrarNotificacion('exito', 'Torta eliminada correctamente.');
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

  formatearMoneda(valor: number | null): string {
    if (valor === null || valor === undefined) return '—';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
    }).format(valor);
  }

  formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0 }).format(valor);
  }

  trackById(_i: number, item: TortaListadoDTO): number { return item.id; }
}
