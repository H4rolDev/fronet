/**
 * @file admin-venta.component.ts
 * @description Módulo principal de Ventas de Tortas.
 *
 * ─── RESPONSABILIDADES ────────────────────────────────────────────────────────
 *  • Tabla con historial de ventas: ID, Fecha, Total, Estado, Tipo Entrega
 *  • Filtros: búsqueda por ID + filtro por estado (todos/pendiente/completado/cancelado)
 *  • Stats: ventas hoy, este mes, pendientes, canceladas
 *  • Paginación: 10 registros por página
 *  • 4 modales: crear venta | ver detalle | ver comprobante | confirmar cancelación
 *
 * ─── ACCIONES POR FILA ────────────────────────────────────────────────────────
 *  Pendiente:   Ver | Ticket | Cancelar
 *  Completado:  Ver | Ticket
 *  Cancelado:   Ver
 */

import {
  Component, OnInit, OnDestroy,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Subject }      from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { VentaService }  from '../../../services/venta.service';
import { VentaListadoDTO, FiltroVentas, Notificacion, ESTADO_LABEL, ENTREGA_LABEL, ESTADO_CLASE } from '../../../models/venta-dto';
import { VentaCrearModalComponent } from './venta-crear-modal/venta-crear-modal.component';
import { VentaComprobanteModalComponent, VentaDetalleModalComponent } from './venta-comprobante-modal/venta-comprobante-modal.component';


const POR_PAGINA = 10;

@Component({
  selector: 'app-admin-venta',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    VentaCrearModalComponent,
    VentaDetalleModalComponent,
    VentaComprobanteModalComponent,
  ],
  templateUrl: './admin-venta.component.html',
  styleUrls:  ['./admin-venta.component.css'],
})
export class AdminVentaComponent implements OnInit, OnDestroy {

  // ── Estado ─────────────────────────────────────────────────────────────────
  ventas         = signal<VentaListadoDTO[]>([]);
  cargando       = signal<boolean>(false);
  paginaActual   = signal<number>(1);
  busqueda       = signal<string>('');
  filtroEstado   = signal<FiltroVentas>('todos');
  notificacion   = signal<Notificacion | null>(null);

  // Modales
  mostrarCrear        = signal<boolean>(false);
  mostrarDetalle      = signal<boolean>(false);
  mostrarComprobante  = signal<boolean>(false);
  ventaSeleccionada   = signal<VentaListadoDTO | null>(null);

  // Cancelación
  ventaCancelar  = signal<VentaListadoDTO | null>(null);
  motivoCancel   = signal<string>('');
  procesando     = signal<boolean>(false);

  // ── Computados ─────────────────────────────────────────────────────────────

  ventasFiltradas = computed(() => {
    let lista = this.ventas();
    const txt = this.busqueda().trim().toLowerCase();
    const f   = this.filtroEstado();

    if (txt) lista = lista.filter(v =>
      String(v.id).includes(txt)
    );
    if (f !== 'todos') {
      const mapa: Record<FiltroVentas, number> = { todos: 0, pendiente: 1, completado: 2, cancelado: 3 };
      lista = lista.filter(v => v.idEstadoVenta === mapa[f]);
    }
    return lista;
  });

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.ventasFiltradas().length / POR_PAGINA))
  );

  ventasPagina = computed(() => {
    const ini = (this.paginaActual() - 1) * POR_PAGINA;
    return this.ventasFiltradas().slice(ini, ini + POR_PAGINA);
  });

  paginasArr = computed(() =>
    Array.from({ length: Math.min(this.totalPaginas(), 7) }, (_, i) => i + 1)
  );

  // Stats
  hoy = new Date().toISOString().split('T')[0];

  ventasHoy = computed(() =>
    this.ventas().filter(v => v.fechaVenta?.startsWith(this.hoy)).length
  );

  totalHoy = computed(() =>
    this.ventas()
      .filter(v => v.fechaVenta?.startsWith(this.hoy))
      .reduce((a, v) => a + v.total, 0)
  );

  mesActual = computed(() => {
    const m = new Date().toISOString().slice(0, 7); // "2026-04"
    return this.ventas().filter(v => v.fechaVenta?.startsWith(m)).length;
  });

  totalMes = computed(() => {
    const m = new Date().toISOString().slice(0, 7);
    return this.ventas()
      .filter(v => v.fechaVenta?.startsWith(m))
      .reduce((a, v) => a + v.total, 0);
  });

  pendientes  = computed(() => this.ventas().filter(v => v.idEstadoVenta === 1).length);
  canceladas  = computed(() => this.ventas().filter(v => v.idEstadoVenta === 3).length);

  // ── Helpers públicos (para template) ──────────────────────────────────────
  readonly ESTADO_LABEL  = ESTADO_LABEL;
  readonly ENTREGA_LABEL = ENTREGA_LABEL;
  readonly ESTADO_CLASE  = ESTADO_CLASE;

  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private svc: VentaService) {}

  ngOnInit(): void  { this.cargar(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga ──────────────────────────────────────────────────────────────────
  cargar(): void {
    this.cargando.set(true);
    this.svc.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({
        next: d => { this.ventas.set(d); this.paginaActual.set(1); },
        error: (e: Error) => this.toast('error', e.message),
      });
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  onBusqueda(v: string): void { this.busqueda.set(v); this.paginaActual.set(1); }
  setFiltro(f: FiltroVentas): void { this.filtroEstado.set(f); this.paginaActual.set(1); }
  limpiarFiltros(): void { this.busqueda.set(''); this.filtroEstado.set('todos'); this.paginaActual.set(1); }

  // ── Paginación ─────────────────────────────────────────────────────────────
  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) this.paginaActual.set(p);
  }

  // ── Modales ────────────────────────────────────────────────────────────────
  abrirCrear():  void { this.mostrarCrear.set(true); }
  cerrarCrear(): void { this.mostrarCrear.set(false); }

  abrirDetalle(v: VentaListadoDTO): void {
    this.ventaSeleccionada.set(v);
    this.mostrarDetalle.set(true);
  }
  cerrarDetalle(): void { this.mostrarDetalle.set(false); this.ventaSeleccionada.set(null); }

  abrirComprobante(v: VentaListadoDTO): void {
    this.ventaSeleccionada.set(v);
    this.mostrarComprobante.set(true);
  }
  abrirComprobanteDesdeDetalle(idVenta: number): void {
    const v = this.ventas().find(x => x.id === idVenta);
    if (v) this.abrirComprobante(v);
  }
  cerrarComprobante(): void { this.mostrarComprobante.set(false); this.ventaSeleccionada.set(null); }

  onVentaCreada(msg: string): void {
    this.cerrarCrear();
    this.cargar();
    this.toast('exito', msg);
  }

  // ── Cancelación ────────────────────────────────────────────────────────────
  iniciarCancelar(v: VentaListadoDTO): void {
    this.ventaCancelar.set(v);
    this.motivoCancel.set('');
  }
  cerrarCancelar(): void { this.ventaCancelar.set(null); this.motivoCancel.set(''); }

  confirmarCancelar(): void {
    const v = this.ventaCancelar();
    if (!v) return;
    const motivo = this.motivoCancel().trim();
    if (!motivo) { this.toast('error', 'Debes ingresar el motivo de cancelación.'); return; }

    this.procesando.set(true);
    this.svc.cancelar(v.id, motivo)
      .pipe(takeUntil(this.destroy$), finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => {
          this.cerrarCancelar();
          this.cargar();
          this.toast('exito', `Venta #${v.id} cancelada correctamente.`);
        },
        error: (e: Error) => {
          this.cerrarCancelar();
          this.toast('error', e.message);
        },
      });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast(tipo: Notificacion['tipo'], mensaje: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.notificacion.set(null), 5000);
  }
  cerrarToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set(null);
  }

  // ── Helpers de template ────────────────────────────────────────────────────
  formatFecha(f: string): string {
    if (!f) return '—';
    const d = f.split('T')[0].split('-');
    return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : f;
  }

  formatMoneda(v: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v);
  }

  esCancelable(v: VentaListadoDTO): boolean { return v.idEstadoVenta === 1; }
  esImprimible(v: VentaListadoDTO): boolean { return v.idEstadoVenta !== 3; }

  trackById(_: number, v: VentaListadoDTO): number { return v.id; }
}
