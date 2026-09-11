import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RepartidorService } from '../../../services/repartidor.service';
import { AuthService } from '../../../services/auth.service';
import { EstadoEntregaEnum, ESTADO_ENTREGA_NOMBRES } from '../../../enums';

interface PedidoRepartidor {
  id: number;
  idVenta: number;
  fechaVenta: string;
  cliente: string;
  clienteTelefono: string;
  direccion: string;
  referencia: string;
  telefonoContacto: string;
  nombreContacto: string;
  costoDelivery: number;
  idEstadoEntrega: number;
  estado: string;
  fechaAsignacion: string | null;
  fechaEntrega: string | null;
  puedeAceptar: boolean;
  puedeIniciar: boolean;
  puedeCompletar: boolean;
  subtotal?: number; total?: number; montoPagado?: number; saldoPendiente?: number;
  productos?: any[]; latitud?: number | null; longitud?: number | null;
  fechaAceptacion?: string | null; fechaInicio?: string | null;
  usuarioAsignacion?: string | null;
}

@Component({
  selector: 'app-repartidor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="repartidor-page">
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Mis Pedidos</h2>
            <p class="ph-s">Gestiona tus entregas asignadas</p>
          </div>
        </div>
        <button class="btn-refresh" (click)="cargarPedidos()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Actualizar
        </button>
      </header>

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      }

      @if (!cargando() && pedidos().length === 0) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5">
            <rect x="1" y="3" width="15" height="13" rx="1"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <p>No tienes pedidos asignados</p>
          <span class="empty-sub">Los pedidos aparecerán aquí cuando te asignen entregas</span>
        </div>
      }

      @if (!cargando() && pedidos().length > 0) {
        <div class="stats-row">
          <div class="stat-card pendiente">
            <span class="stat-num">{{ obtenerPorEstado(1) }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
          <div class="stat-card aceptado">
            <span class="stat-num">{{ obtenerPorEstado(2) + obtenerPorEstado(3) }}</span>
            <span class="stat-label">Aceptados</span>
          </div>
          <div class="stat-card en-camino">
            <span class="stat-num">{{ obtenerPorEstado(4) }}</span>
            <span class="stat-label">En Camino</span>
          </div>
          <div class="stat-card entregado">
            <span class="stat-num">{{ obtenerPorEstado(5) }}</span>
            <span class="stat-label">Entregados</span>
          </div>
          <div class="stat-card ganancias">
            <span class="stat-num">S/. {{ (ganancias().mes || 0).toFixed(2) }}</span>
            <span class="stat-label">Ganancia del mes</span>
          </div>
        </div>

        <div class="pedidos-grid">
          @for (p of pedidos(); track p.id) {
            <div class="pedido-card" [class]="'estado-' + p.idEstadoEntrega">
              <div class="card-header">
                <span class="badge-estado" [class]="getEstadoClase(p.idEstadoEntrega)">
                  {{ p.estado }}
                </span>
                <span class="venta-id">Pedido #{{ p.idVenta }}</span>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <strong>{{ p.cliente }}</strong>
                    @if (p.clienteTelefono) {
                      <span class="tel">{{ p.clienteTelefono }}</span>
                    }
                  </div>
                </div>

                <div class="info-row">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <span>{{ p.direccion }}</span>
                    @if (p.referencia) {
                      <span class="ref">Ref: {{ p.referencia }}</span>
                    }
                  </div>
                </div>

                @if (p.nombreContacto || p.telefonoContacto) {
                  <div class="info-row">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                    <div>
                      @if (p.nombreContacto) {
                        <span>{{ p.nombreContacto }}</span>
                      }
                      @if (p.telefonoContacto) {
                        <span class="tel">{{ p.telefonoContacto }}</span>
                      }
                    </div>
                  </div>
                }

                 <div class="info-row costo">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                   <span>Costo delivery: <strong>S/. {{ (p.costoDelivery || 0).toFixed(2) }}</strong></span>
                 </div>

                 <div class="payment-banner" [class.has-saldo]="(p.saldoPendiente || 0) > 0">
                   <span>{{ (p.saldoPendiente || 0) > 0 ? 'Cobrar al cliente' : 'Pedido pagado' }}</span>
                   <strong>S/. {{ (p.saldoPendiente || 0).toFixed(2) }}</strong>
                 </div>
                 <div class="delivery-finanzas"><span>Total <b>S/. {{ (p.total || 0).toFixed(2) }}</b></span><span>Adelanto <b>S/. {{ (p.montoPagado || 0).toFixed(2) }}</b></span></div>
                 @if (p.productos?.length) {
                   <div class="products-mini"><strong>Productos</strong>@for (producto of p.productos; track producto.idTorta) {<div><span>{{ producto.cantidad }} x {{ producto.producto }}</span><b>S/. {{ (producto.subtotal || 0).toFixed(2) }}</b></div>}</div>
                 }
                 @if (p.latitud != null && p.longitud != null) { <button class="map-button" (click)="abrirMapa(p.latitud!, p.longitud!)">Cómo llegar en Google Maps</button> }

                @if (p.fechaAsignacion) {
                  <div class="info-row fecha">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                     <span>Asignado: {{ formatFecha(p.fechaAsignacion) }}</span>
                  </div>
                }
              </div>

              <div class="card-actions">
                @if (p.puedeAceptar) {
                  <button class="btn-accion btn-aceptar" (click)="aceptarPedido(p.id)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aceptar Pedido
                  </button>
                }
                @if (p.puedeIniciar) {
                  <button class="btn-accion btn-iniciar" (click)="iniciarDelivery(p.id)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Iniciar Delivery
                  </button>
                }
                @if (p.puedeCompletar) {
                   <button class="btn-accion btn-completar" (click)="abrirCompletar(p)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Marcar Entregado
                  </button>
                }
                @if (p.idEstadoEntrega === 5) {
                  <span class="estado-completado">✓ Entregado</span>
                }
              </div>
       </div>
      }

      @if (!cargando() && historial().length > 0) {
        <section class="history-section"><div class="section-title"><h3>Historial reciente</h3><span>Entregas completadas y canceladas</span></div>
          @for (p of historial(); track p.id) { <div class="history-row"><div><strong>Pedido #{{ p.idVenta }}</strong><small>{{ formatFecha(p.fechaEntrega || p.fechaAsignacion || '') }} · {{ p.estado }}</small></div><b>S/. {{ (p.costoDelivery || 0).toFixed(2) }}</b></div> }
          <div class="history-pager"><button (click)="cargarHistorial(paginaHistorial - 1)" [disabled]="paginaHistorial <= 1">Anterior</button><span>Página {{ paginaHistorial }} de {{ totalPaginas }}</span><button (click)="cargarHistorial(paginaHistorial + 1)" [disabled]="paginaHistorial >= totalPaginas">Siguiente</button></div>
        </section>
      }
    </div>

    @if (showCompleteModal()) { <div class="modal-overlay" (click)="cerrarCompletar()"><div class="modal-content" (click)="$event.stopPropagation()"><h3>Confirmar entrega</h3><p>Verifica el cobro antes de cerrar el pedido.</p><div class="cobro-alert">Cobrar al cliente: <strong>S/. {{ saldoCompletar().toFixed(2) }}</strong></div><label>Monto cobrado<input type="number" min="0" step="0.01" [(ngModel)]="montoCobrado"></label><label>Método<select [(ngModel)]="metodoCobro"><option [ngValue]="1">Efectivo</option><option [ngValue]="2">Yape</option><option [ngValue]="3">Plin</option></select></label><div class="modal-actions"><button (click)="cerrarCompletar()">Cancelar</button><button class="btn-completar" (click)="confirmarCompletar()">Confirmar entrega</button></div></div></div> }
      }
    </div>
  `,
  styles: [`
    .repartidor-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .ph-l { display: flex; align-items: center; gap: 16px; }
    .ph-ico { width: 52px; height: 52px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .ph-ico svg { width: 26px; height: 26px; }
    .ph-t { margin: 0; font-size: 24px; font-weight: 700; color: #111; }
    .ph-s { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
    .btn-refresh { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: white; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-weight: 500; color: #555; }
    .btn-refresh:hover { border-color: #f59e0b; color: #f59e0b; }

    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px; color: #aaa; background: #f9fafb; border-radius: 16px; }
    .empty-state p { margin-top: 16px; font-size: 18px; color: #555; }
    .empty-sub { display: block; margin-top: 8px; font-size: 14px; color: #888; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-card.pendiente { border-left: 4px solid #f59e0b; }
    .stat-card.aceptado { border-left: 4px solid #3b82f6; }
    .stat-card.en-camino { border-left: 4px solid #8b5cf6; }
    .stat-card.entregado { border-left: 4px solid #10b981; }
    .stat-num { display: block; font-size: 28px; font-weight: 700; color: #111; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }

    .pedidos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
    .pedido-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .pedido-card.estado-1 { border-left: 4px solid #f59e0b; }
    .pedido-card.estado-2 { border-left: 4px solid #3b82f6; }
    .pedido-card.estado-3 { border-left: 4px solid #8b5cf6; }
    .pedido-card.estado-4 { border-left: 4px solid #ec4899; }
    .pedido-card.estado-5 { border-left: 4px solid #10b981; }

    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .badge-estado { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-estado.pendiente { background: #fef3c7; color: #d97706; }
    .badge-estado.asignado { background: #dbeafe; color: #2563eb; }
    .badge-estado.aceptado { background: #ede9fe; color: #7c3aed; }
    .badge-estado.en-camino { background: #fce7f3; color: #db2777; }
    .badge-estado.entregado { background: #d1fae5; color: #059669; }
    .venta-id { font-size: 13px; font-weight: 600; color: #333; }

    .card-body { padding: 16px; }
    .info-row { display: flex; gap: 10px; margin-bottom: 12px; color: #555; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-row svg { color: #9ca3af; flex-shrink: 0; margin-top: 2px; }
    .info-row div { display: flex; flex-direction: column; gap: 2px; }
    .info-row strong { color: #111; }
    .info-row .tel { color: #666; font-size: 13px; }
    .info-row .ref { color: #888; font-size: 12px; font-style: italic; }
    .info-row.costo { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb; }
    .info-row.costo strong { color: #f59e0b; font-size: 15px; }
     .info-row.fecha { color: #6b7280; font-size: 13px; }
     .payment-banner { display:flex; justify-content:space-between; align-items:center; margin:12px 0; padding:12px; border-radius:10px; background:#ecfdf5; color:#047857; font-size:13px; }.payment-banner.has-saldo { background:#fff7ed; color:#c2410c; }.payment-banner strong { font-size:17px; }
     .delivery-finanzas { display:flex; justify-content:space-between; padding:10px 0; color:#64748b; font-size:12px; }.delivery-finanzas b { color:#111827; margin-left:5px; }
     .products-mini { padding:10px 0; border-top:1px dashed #e5e7eb; border-bottom:1px dashed #e5e7eb; margin-bottom:10px; font-size:12px; }.products-mini > strong { display:block; margin-bottom:6px; color:#92400e; }.products-mini div { display:flex; justify-content:space-between; padding:3px 0; }.products-mini b { color:#111827; }.map-button { width:100%; padding:9px; border:1px solid #bfdbfe; border-radius:8px; color:#2563eb; background:#eff6ff; cursor:pointer; }
     .history-section { margin-top:28px; background:white; border:1px solid #e5e7eb; border-radius:16px; padding:18px; }.section-title { display:flex; justify-content:space-between; align-items:end; margin-bottom:10px; }.section-title h3 { margin:0; }.section-title span { color:#6b7280; font-size:12px; }.history-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-top:1px solid #f1f5f9; }.history-row small { display:block; color:#6b7280; margin-top:3px; }.history-pager { display:flex; justify-content:center; gap:14px; align-items:center; margin-top:12px; font-size:12px; }.history-pager button { border:1px solid #ddd; background:white; border-radius:7px; padding:6px 10px; }.history-pager button:disabled { opacity:.4; }
     .modal-overlay { position:fixed; inset:0; background:#0008; display:flex; align-items:center; justify-content:center; z-index:10; padding:20px; }.modal-content { background:white; border-radius:18px; padding:22px; width:min(430px,100%); box-shadow:0 18px 60px #0003; }.modal-content h3 { margin-top:0; }.modal-content label { display:block; font-size:12px; font-weight:600; color:#475569; margin:12px 0; }.modal-content input,.modal-content select { display:block; width:100%; margin-top:5px; padding:10px; border:1px solid #dbe1e8; border-radius:8px; box-sizing:border-box; }.cobro-alert { padding:12px; background:#fff7ed; color:#9a3412; border-radius:9px; }.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:18px; }.modal-actions button { border:0; border-radius:8px; padding:10px 14px; cursor:pointer; }

    .card-actions { padding: 12px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-accion { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; justify-content: center; }
    .btn-aceptar { background: #3b82f6; color: white; }
    .btn-aceptar:hover { background: #2563eb; }
    .btn-iniciar { background: #f59e0b; color: white; }
    .btn-iniciar:hover { background: #d97706; }
    .btn-completar { background: #10b981; color: white; }
    .btn-completar:hover { background: #059669; }
    .estado-completado { color: #10b981; font-weight: 600; font-size: 14px; padding: 12px 20px; }
  `]
})
export class RepartidorComponent implements OnInit {
  pedidos = signal<PedidoRepartidor[]>([]);
  cargando = signal(false);
  idPersona = 0;
  historial = signal<PedidoRepartidor[]>([]);
  ganancias = signal<any>({ total: 0, hoy: 0, semana: 0, mes: 0, entregasCompletadas: 0 });
  paginaHistorial = 1;
  totalPaginas = 1;
  showCompleteModal = signal(false);
  pedidoCompletando = signal<PedidoRepartidor | null>(null);
  montoCobrado = 0;
  metodoCobro = 1;

  constructor(
    private repartidorService: RepartidorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.obtenerIdPersona();
    if (this.idPersona > 0) {
      this.cargarPedidos();
      this.cargarHistorial();
      this.cargarGanancias();
    }
  }

  private obtenerIdPersona(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.persona && user.persona.id) {
        this.idPersona = user.persona.id;
      }
    }
  }

  cargarPedidos(): void {
    if (this.idPersona === 0) return;
    
    this.cargando.set(true);
    this.repartidorService.obtenerMisPedidos(this.idPersona).subscribe({
      next: (data) => {
        this.pedidos.set((data || []).filter((p: PedidoRepartidor) => p.idEstadoEntrega !== 5 && p.idEstadoEntrega !== 6));
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.cargando.set(false);
      }
    });
  }

  aceptarPedido(id: number): void {
    if (!confirm('¿Aceptar este pedido?')) return;
    
    this.repartidorService.aceptarPedido(id).subscribe({
      next: () => {
        alert('Pedido aceptado');
        this.cargarPedidos();
      },
      error: (err) => alert('Error: ' + err.message)
    });
  }

  iniciarDelivery(id: number): void {
    if (!confirm('¿Iniciar el delivery?')) return;
    
    this.repartidorService.iniciarDelivery(id).subscribe({
      next: () => {
        alert('Delivery iniciado');
        this.cargarPedidos();
      },
      error: (err) => alert('Error: ' + err.message)
    });
  }

  completarEntrega(id: number): void {
    const pedido = this.pedidos().find(p => p.id === id); if (pedido) this.abrirCompletar(pedido);
  }

  saldoCompletar(): number { return this.pedidoCompletando()?.saldoPendiente || 0; }
  abrirCompletar(pedido: PedidoRepartidor): void { this.pedidoCompletando.set(pedido); this.montoCobrado = pedido.saldoPendiente || 0; this.metodoCobro = 1; this.showCompleteModal.set(true); }
  cerrarCompletar(): void { this.showCompleteModal.set(false); this.pedidoCompletando.set(null); }
  confirmarCompletar(): void { const p = this.pedidoCompletando(); if (!p) return; this.repartidorService.completarEntrega(p.id, Number(this.montoCobrado) || 0, this.metodoCobro).subscribe({ next: () => { this.cerrarCompletar(); this.cargarPedidos(); this.cargarHistorial(); this.cargarGanancias(); }, error: (err) => console.error(err) }); }
  abrirMapa(latitud: number, longitud: number): void { window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`, '_blank', 'noopener'); }
  cargarHistorial(pagina = 1): void { if (!this.idPersona) return; this.repartidorService.obtenerHistorial(this.idPersona, pagina).subscribe({ next: data => { this.historial.set(data?.items || []); this.paginaHistorial = data?.paginaActual || pagina; this.totalPaginas = data?.totalPaginas || 1; } }); }
  cargarGanancias(): void { if (!this.idPersona) return; this.repartidorService.obtenerGanancias(this.idPersona).subscribe({ next: data => this.ganancias.set(data || this.ganancias()) }); }

  obtenerPorEstado(estado: number): number {
    return this.pedidos().filter(p => p.idEstadoEntrega === estado).length;
  }

  getEstadoClase(estado: number): string {
    switch (estado) {
      case 1: return 'pendiente';
      case 2: return 'asignado';
      case 3: return 'aceptado';
      case 4: return 'en-camino';
      case 5: return 'entregado';
      default: return 'pendiente';
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
