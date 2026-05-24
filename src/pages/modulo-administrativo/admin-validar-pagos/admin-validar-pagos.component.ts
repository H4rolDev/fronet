import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../../services/venta.service';

interface VentaValidacion {
  id: number;
  fechaVenta: string;
  cliente: string;
  clienteTelefono: string;
  total: number;
  numeroOperacion: string | null;
  imagenComprobante: string | null;
  estado: string;
  idEstadoVenta: number;
  detalles: VentaDetalle[];
}

interface VentaDetalle {
  idTorta: number;
  torta: string;
  cantidad: number;
  precio: number;
}

interface HistorialItem {
  id: number;
  accion: string;
  observacion?: string;
  usuario: string;
  fecha: string;
}

@Component({
  selector: 'app-admin-validar-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="validacion-page">
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Validar Pagos</h2>
            <p class="ph-s">Revisa los comprobantes de pago pendientes de aprobación</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="toggle-group">
            <button [class.active]="vistaActual() === 'pendientes'" (click)="cambiarVista('pendientes')">
              Pendientes
            </button>
            <button [class.active]="vistaActual() === 'todas'" (click)="cambiarVista('todas')">
              Todas
            </button>
          </div>
          <div class="count-pill">{{ ventasPendientes().length }} pendientes</div>
        </div>
      </header>

      @if (vistaActual() === 'todas') {
        <div class="filtros-section">
          <div class="filtros-row">
            <select [(ngModel)]="filtroEstado" (change)="cargarTodas()">
              <option [ngValue]="null">Todos los estados</option>
              <option [ngValue]="4">Esperando Validación</option>
              <option [ngValue]="2">Pagado</option>
              <option [ngValue]="6">Rechazado</option>
              <option [ngValue]="3">Cancelado</option>
            </select>
            <input type="date" [(ngModel)]="filtroFechaInicio" (change)="cargarTodas()" placeholder="Fecha inicio">
            <input type="date" [(ngModel)]="filtroFechaFin" (change)="cargarTodas()" placeholder="Fecha fin">
            <input type="text" [(ngModel)]="filtroNumero" (change)="cargarTodas()" placeholder="N° Operación">
            <button class="btn-buscar" (click)="cargarTodas()">Buscar</button>
            <button class="btn-limpiar" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </div>
      }

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando comprobantes...</p>
        </div>
      }

      @if (!cargando() && ventasPendientes().length === 0 && vistaActual() === 'pendientes') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No hay comprobantes pendientes de validación</p>
        </div>
      }

      @if (!cargando() && vistaActual() === 'todas' && todasVentas().length === 0) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No se encontraron ventas con los filtros aplicados</p>
        </div>
      }

      @if (!cargando() && (ventasPendientes().length > 0 || todasVentas().length > 0)) {
        <div class="cards-grid">
          @for (v of (vistaActual() === 'pendientes' ? ventasPendientes() : todasVentas()); track v.id) {
            <div class="card-validacion">
              <div class="card-header">
                <div class="card-id">
                  <span class="badge" [class]="getBadgeClass(v.idEstadoVenta)">{{ getEstadoTexto(v.idEstadoVenta) }}</span>
                  <span class="venta-id">Venta #{{ v.id }}</span>
                </div>
                <span class="fecha">{{ formatFecha(v.fechaVenta) }}</span>
              </div>

              <div class="card-body">
                <div class="info-section">
                  <h4>Cliente</h4>
                  <div class="info-row">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div>
                      <strong>{{ v.cliente }}</strong>
                      @if (v.clienteTelefono) {
                        <span class="tel">{{ v.clienteTelefono }}</span>
                      }
                    </div>
                  </div>
                </div>

                <div class="info-section">
                  <h4>Detalles del Pedido</h4>
                  @for (d of v.detalles; track d.idTorta) {
                    <div class="detalle-item">
                      <span class="torta-nombre">{{ d.torta }}</span>
                      <span class="torta-cant">x{{ d.cantidad }}</span>
                      <span class="torta-precio">S/. {{ (d.precio * d.cantidad).toFixed(2) }}</span>
                    </div>
                  }
                  <div class="total-row">
                    <span>Total</span>
                    <strong class="total-amount">S/. {{ v.total.toFixed(2) }}</strong>
                  </div>
                </div>

                @if (v.numeroOperacion) {
                  <div class="info-section">
                    <h4>Información de Pago</h4>
                    <div class="info-row">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      <span>N° Operación: <strong>{{ v.numeroOperacion }}</strong></span>
                    </div>
                  </div>
                }

                @if (v.imagenComprobante) {
                  <div class="info-section">
                    <h4>Comprobante de Pago</h4>
                    <div class="comprobante-preview" (click)="abrirImagen(v.imagenComprobante!)">
                      <img [src]="v.imagenComprobante" alt="Comprobante" />
                      <div class="overlay">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Ver imagen completa</span>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="card-actions">
                @if (vistaActual() === 'pendientes') {
                  <button class="btn-ver-historial" (click)="verHistorial(v.id)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 8v4l3 3"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    Historial
                  </button>
                  <button class="btn-aprobar" (click)="aprobarVenta(v.id)" [disabled]="procesando()">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aprobar
                  </button>
                  <button class="btn-rechazar" (click)="abrirModalRechazo(v.id)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Rechazar
                  </button>
                } @else {
                  <button class="btn-ver-historial" (click)="verHistorial(v.id)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 8v4l3 3"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    Ver Historial
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showRechazoModal()) {
      <div class="modal-overlay" (click)="cerrarModalRechazo()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Rechazar Comprobante</h3>
            <button class="modal-cerrar" (click)="cerrarModalRechazo()">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Por qué rechazas este comprobante?</p>
            <div class="form-group">
              <textarea class="inp" [(ngModel)]="motivoRechazo" placeholder="Motivo del rechazo..." rows="4"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-sec" (click)="cerrarModalRechazo()">Cancelar</button>
            <button class="btn-peligro" (click)="confirmarRechazo()" [disabled]="!motivoRechazo()">Rechazar</button>
          </div>
        </div>
      </div>
    }

    @if (imagenAmpliada()) {
      <div class="modal-overlay" (click)="cerrarImagen()">
        <div class="modal-imagen" (click)="$event.stopPropagation()">
          <button class="cerrar-imagen" (click)="cerrarImagen()">✕</button>
          <img [src]="imagenAmpliada()" alt="Comprobante ampliado" />
        </div>
      </div>
    }

    @if (showHistorialModal()) {
      <div class="modal-overlay" (click)="cerrarHistorialModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Historial de Cambios</h3>
            <button class="modal-cerrar" (click)="cerrarHistorialModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="historial-list">
              @for (h of historialActual(); track h.id) {
                <div class="historial-item">
                  <div class="historial-icon" [class]="h.accion.toLowerCase()">
                    @if (h.accion === 'Creada') { <span>📝</span> }
                    @else if (h.accion === 'Aprobada') { <span>✅</span> }
                    @else if (h.accion === 'Rechazada') { <span>❌</span> }
                    @else { <span>📋</span> }
                  </div>
                  <div class="historial-content">
                    <div class="historial-accion">{{ h.accion }}</div>
                    @if (h.observacion) {
                      <div class="historial-obs">{{ h.observacion }}</div>
                    }
                    <div class="historial-meta">
                      <span class="historial-user">{{ h.usuario }}</span>
                      <span class="historial-fecha">{{ formatFecha(h.fecha) }}</span>
                    </div>
                  </div>
                </div>
              }
              @if (historialActual().length === 0) {
                <p class="no-hay">No hay registros de auditoría</p>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .validacion-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .toggle-group { display: flex; background: #f3f4f6; border-radius: 10px; padding: 4px; }
    .toggle-group button { padding: 8px 20px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-weight: 500; color: #6b7280; transition: all 0.2s; }
    .toggle-group button.active { background: white; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; }
    .filtros-section { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .filtros-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .filtros-row select, .filtros-row input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-width: 150px; }
    .filtros-row select:focus, .filtros-row input:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
    .btn-buscar { background: #059669; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-buscar:hover { background: #047857; }
    .btn-limpiar { background: #fff; color: #374151; border: 1px solid #d1d5db; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-limpiar:hover { background: #f9fafb; }
    .ph-l { display: flex; align-items: center; gap: 16px; }
    .ph-ico { width: 52px; height: 52px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
    .ph-ico svg { width: 26px; height: 26px; }
    .ph-t { margin: 0; font-size: 24px; font-weight: 700; color: #111; }
    .ph-s { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
    .count-pill { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }

    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px; color: #aaa; background: #f9fafb; border-radius: 16px; margin: 20px 0; }
    .empty-state p { margin-top: 16px; font-size: 16px; }
    .empty-state svg { margin-bottom: 16px; opacity: 0.5; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; }
    .card-validacion { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .card-id { display: flex; align-items: center; gap: 10px; }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge--warning { background: #fef3c7; color: #d97706; }
    .venta-id { font-size: 14px; font-weight: 600; color: #333; }
    .fecha { font-size: 13px; color: #888; }

    .card-body { padding: 20px; }
    .info-section { margin-bottom: 16px; }
    .info-section h4 { margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .info-row { display: flex; align-items: center; gap: 10px; color: #4b5563; font-size: 14px; }
    .info-row svg { color: #9ca3af; flex-shrink: 0; }
    .info-row strong { color: #111; }
    .info-row .tel { display: block; font-size: 13px; color: #6b7280; }

    .detalle-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; font-size: 14px; }
    .detalle-item:last-of-type { border-bottom: none; }
    .torta-nombre { flex: 1; color: #374151; }
    .torta-cant { color: #6b7280; margin-right: 12px; }
    .torta-precio { font-weight: 600; color: #111; }

    .total-row { display: flex; justify-content: space-between; padding-top: 12px; margin-top: 8px; border-top: 2px solid #e5e7eb; font-size: 15px; }
    .total-amount { color: #059669; font-size: 18px; }

    .comprobante-preview { position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px dashed #d1d5db; }
    .comprobante-preview img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
    .comprobante-preview .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.2s; }
    .comprobante-preview:hover .overlay { opacity: 1; }

    .card-actions { display: flex; gap: 12px; padding: 16px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .btn-aprobar, .btn-rechazar { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; justify-content: center; }
    .btn-aprobar { background: #059669; color: white; }
    .btn-aprobar:hover { background: #047857; }
    .btn-aprobar:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-rechazar { background: #fee2e2; color: #dc2626; }
    .btn-rechazar:hover { background: #fecaca; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 16px; width: 100%; max-width: 480px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
    .modal-cerrar { background: none; border: none; font-size: 20px; cursor: pointer; color: #9ca3af; }
    .modal-body { padding: 24px; }
    .modal-body p { margin: 0 0 16px; color: #4b5563; }
    .form-group textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; }
    .form-group textarea:focus { outline: none; border-color: #059669; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #e5e7eb; }
    .btn-sec, .btn-peligro { padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-sec { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .btn-peligro { background: #dc2626; color: white; border: none; }
    .btn-peligro:disabled { opacity: 0.5; cursor: not-allowed; }

    .modal-imagen { position: relative; max-width: 90vw; max-height: 90vh; }
    .modal-imagen img { max-width: 100%; max-height: 90vh; border-radius: 8px; }
    .cerrar-imagen { position: absolute; top: -40px; right: 0; background: white; border: none; font-size: 24px; cursor: pointer; padding: 8px; border-radius: 50%; }
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .toggle-group { display: flex; background: #f3f4f6; border-radius: 8px; padding: 4px; }
    .toggle-group button { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-weight: 500; color: #6b7280; }
    .toggle-group button.active { background: white; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .filtros-section { background: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
    .filtros-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .filtros-row select, .filtros-row input { padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
    .filtros-row input[type="text"] { min-width: 150px; }
    .btn-buscar { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; }
    .btn-buscar:hover { background: #1d4ed8; }
    .btn-limpiar { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; }
    .btn-limpiar:hover { background: #e5e7eb; }
    .badge--success { background: #d1fae5; color: #059669; }
    .badge--danger { background: #fee2e2; color: #dc2626; }
    .badge--info { background: #dbeafe; color: #2563eb; }
    .modal-lg { max-width: 600px; }
    .btn-ver-historial { background: #f3f4f6; color: #374151; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .btn-ver-historial:hover { background: #e5e7eb; }
    .historial-list { display: flex; flex-direction: column; gap: 12px; }
    .historial-item { display: flex; gap: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; }
    .historial-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .historial-content { flex: 1; }
    .historial-accion { font-weight: 600; color: #111; }
    .historial-obs { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .historial-meta { display: flex; gap: 12px; font-size: 12px; color: #9ca3af; margin-top: 6px; }
    .historial-user { font-weight: 500; }
    .no-hay { text-align: center; color: #9ca3af; padding: 20px; }
  `]
})
export class AdminValidarPagosComponent implements OnInit {
  ventasPendientes = signal<VentaValidacion[]>([]);
  ventasTodas = signal<VentaValidacion[]>([]);
  cargando = signal(false);
  procesando = signal(false);

  showRechazoModal = signal(false);
  idRechazando = signal<number | null>(null);
  motivoRechazo = signal('');

  imagenAmpliada = signal<string | null>(null);

  vistaActual = signal<'pendientes' | 'todas'>('pendientes');
  filtroEstado = signal<number | null>(null);
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');
  filtroNumero = signal<string>('');
  historialActual = signal<HistorialItem[]>([]);
  showHistorialModal = signal(false);
  idHistorial = signal<number | null>(null);

  constructor(private ventaService: VentaService) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cambiarVista(vista: 'pendientes' | 'todas'): void {
    this.vistaActual.set(vista);
    if (vista === 'todas' && this.ventasTodas().length === 0) {
      this.cargarTodas();
    }
  }

  cargarTodas(): void {
    this.cargando.set(true);
    const filtro: any = {};
    if (this.filtroEstado()) filtro.idEstado = this.filtroEstado();
    if (this.filtroFechaInicio()) filtro.fechaInicio = this.filtroFechaInicio();
    if (this.filtroFechaFin()) filtro.fechaFin = this.filtroFechaFin();
    if (this.filtroNumero()) filtro.numeroOperacion = this.filtroNumero();
    filtro.tamanioPagina = 50;

    this.ventaService.obtenerTodos(filtro).subscribe({
      next: (data) => {
        if (data && data.items) {
          this.ventasTodas.set(data.items);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstado.set(null);
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.filtroNumero.set('');
    this.cargarTodas();
  }

  verHistorial(idVenta: number): void {
    this.idHistorial.set(idVenta);
    this.ventaService.obtenerHistorial(idVenta).subscribe({
      next: (data) => {
        this.historialActual.set(data);
        this.showHistorialModal.set(true);
      },
      error: () => {
        this.historialActual.set([]);
        this.showHistorialModal.set(true);
      }
    });
  }

  cerrarHistorialModal(): void {
    this.showHistorialModal.set(false);
    this.idHistorial.set(null);
    this.historialActual.set([]);
  }

  getBadgeClass(estado: number): string {
    switch (estado) {
      case 4: return 'badge--warning';
      case 2: return 'badge--success';
      case 6: return 'badge--danger';
      case 3: return 'badge--info';
      default: return '';
    }
  }

  getEstadoTexto(estado: number): string {
    switch (estado) {
      case 1: return 'Pendiente';
      case 4: return 'Esperando Validación';
      case 2: return 'Pagado';
      case 5: return 'Aprobado';
      case 6: return 'Rechazado';
      case 3: return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  get todasVentas() {
    return this.ventasTodas;
  }

  cargarPendientes(): void {
    this.cargando.set(true);
    this.ventaService.obtenerPendientesValidacion().subscribe({
      next: (data) => {
        this.ventasPendientes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  aprobarVenta(idVenta: number): void {
    this.procesando.set(true);
    this.ventaService.aprobarVenta(idVenta, 'admin').subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargarPendientes();
        if (this.vistaActual() === 'todas') {
          this.cargarTodas();
        }
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  abrirModalRechazo(idVenta: number): void {
    this.idRechazando.set(idVenta);
    this.motivoRechazo.set('');
    this.showRechazoModal.set(true);
  }

  cerrarModalRechazo(): void {
    this.showRechazoModal.set(false);
    this.idRechazando.set(null);
    this.motivoRechazo.set('');
  }

  confirmarRechazo(): void {
    const id = this.idRechazando();
    const motivo = this.motivoRechazo();
    if (!id || !motivo) return;

    this.ventaService.rechazarVenta(id, motivo, 'admin').subscribe({
      next: () => {
        this.cerrarModalRechazo();
        this.cargarPendientes();
        if (this.vistaActual() === 'todas') {
          this.cargarTodas();
        }
      },
      error: () => {
        this.cerrarModalRechazo();
      }
    });
  }

  abrirImagen(url: string): void {
    this.imagenAmpliada.set(url);
  }

  cerrarImagen(): void {
    this.imagenAmpliada.set(null);
  }
}