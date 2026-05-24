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
import {
  MovimientoInsumoListadoDTO,
  ModalInputData,
  Notificacion,
} from '../../../models/movimiento-insumo-dto';
import { MovimientoInsumoService } from '../../../services/movimiento-insumo.service';
import { MovimientoInsumoModalComponent } from './movimiento-insumo-modal/movimiento-insumo-modal.component';

@Component({
  selector: 'app-admin-movimiento-insumo',
  standalone: true,
  imports: [CommonModule, FormsModule, MovimientoInsumoModalComponent],
  templateUrl: './admin-movimiento-insumo.component.html',
  styleUrls: ['./admin-movimiento-insumo.component.css'],
})
export class AdminMovimientoInsumoComponent implements OnInit, OnDestroy {

  // ── Estado ─────────────────────────────────────────────────────────────────
  movimientos    = signal<MovimientoInsumoListadoDTO[]>([]);
  textoBusqueda  = signal<string>('');
  filtroTipo     = signal<string>('');
  cargandoTabla  = signal<boolean>(false);
  modalAbierto   = signal<boolean>(false);
  modalInputData = signal<ModalInputData | null>(null);
  notificacion   = signal<Notificacion | null>(null);

  // ── Computados ─────────────────────────────────────────────────────────────

  movimientosFiltrados = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    const tipo  = this.filtroTipo();
    return this.movimientos().filter(m => {
      const coincideTexto = !texto || (
        m.insumo.toLowerCase().includes(texto) ||
        m.numeroLote.toLowerCase().includes(texto) ||
        (m.referencia ?? '').toLowerCase().includes(texto) ||
        m.tipoMovimiento.toLowerCase().includes(texto)
      );
      const coincideTipo = !tipo || m.idTipoMovimiento.toString() === tipo;
      return coincideTexto && coincideTipo;
    });
  });

  tiposUnicos = computed(() => {
    const map = new Map<number, string>();
    for (const m of this.movimientos()) {
      if (!map.has(m.idTipoMovimiento)) map.set(m.idTipoMovimiento, m.tipoMovimiento);
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  });

  totalEntradas = computed(() =>
    this.movimientos()
      .filter(m => m.tipoMovimiento.toLowerCase().includes('entrada'))
      .reduce((acc, m) => acc + m.cantidad, 0)
  );

  totalSalidas = computed(() =>
    this.movimientos()
      .filter(m => m.tipoMovimiento.toLowerCase().includes('salida'))
      .reduce((acc, m) => acc + m.cantidad, 0)
  );

  // ── Limpieza ───────────────────────────────────────────────────────────────
  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private movimientoService: MovimientoInsumoService) {}

  ngOnInit(): void  { this.cargarListado(); }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga ──────────────────────────────────────────────────────────────────
  cargarListado(): void {
    this.cargandoTabla.set(true);
    this.movimientoService.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoTabla.set(false)))
      .subscribe({
        next: data => this.movimientos.set(data),
        error: (err: Error) => this.mostrarNotificacion('error', err.message),
      });
  }

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  onBusqueda(valor: string): void { this.textoBusqueda.set(valor); }
  limpiarBusqueda(): void { this.textoBusqueda.set(''); }
  onFiltroTipo(valor: string): void { this.filtroTipo.set(valor); }

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

  claseTipo(tipo: string): string {
    const t = tipo.toLowerCase();
    if (t.includes('entrada')) return 'badge-tipo--entrada';
    if (t.includes('salida'))  return 'badge-tipo--salida';
    return 'badge-tipo--otro';
  }

  iconoTipo(tipo: string): string {
    const t = tipo.toLowerCase();
    if (t.includes('entrada')) return '↑';
    if (t.includes('salida'))  return '↓';
    return '↔';
  }

  formatearFecha(fecha: string): string {
    if (!fecha || fecha.startsWith('0001')) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(fecha));
  }

  formatearFechaCorta(fecha: string): string {
    if (!fecha || fecha.startsWith('0001')) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(fecha));
  }

  formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0 }).format(valor);
  }

  trackById(_i: number, item: MovimientoInsumoListadoDTO): number { return item.id; }
}
