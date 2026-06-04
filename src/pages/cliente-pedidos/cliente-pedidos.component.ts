import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';
import { EstadoVentaEnum, EstadoEntregaEnum } from '../../enums';

interface Pedido {
  id: number;
  fecha: string;
  total: number;
  estadoPago: string;
  idEstadoVenta?: number;
  idEstadoEntrega?: number;
  productos: string;
  cantidad: number;
  tipoEntrega: string;
  deliveryEstado?: string;
  deliveryDireccion?: string;
  deliveryTelefono?: string;
  metodoPago: string;
}

interface EstadoInfo {
  key: string;
  label: string;
  desc: string;
  icono: string;
  badgeClass: string;
}

type FiltroPedido = 'todos' | 'pendiente' | 'proceso' | 'listo' | 'cancelado';

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pedidos-page">
      <div class="page-inner">

        <!-- HEADER -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Mis Pedidos</h1>
            <p class="page-sub">Historial y seguimiento de tus compras</p>
          </div>
          <a class="btn-outline" routerLink="/products">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Pedido
          </a>
        </div>

        @if (!isLoggedIn()) {
          <div class="empty-state">
            <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
            <h3>Inicia sesión para ver tus pedidos</h3>
            <p>Accede a tu historial de compras y sigue el estado de tus entregas.</p>
            <a class="btn-primary" routerLink="/iniciar">Iniciar Sesión</a>
          </div>
        } @else if (cargando()) {
          <div class="loading-state">
            @for (i of [1,2,3]; track i) {
              <div class="sk-card"><div class="sk sk-h"></div><div class="sk-body"><div class="sk sk-l"></div><div class="sk sk-m"></div><div class="sk sk-s"></div></div></div>
            }
          </div>
        } @else {

          <!-- CONTADOR -->
          <div class="stats-bar">
            <div class="stat-item"><span class="stat-num">{{ pedidos().length }}</span> total</div>
            <div class="stat-item"><span class="stat-num">{{ contarPorEstado('pendiente') }}</span> pendientes</div>
            <div class="stat-item"><span class="stat-num">{{ contarPorEstado('proceso') }}</span> en proceso</div>
            <div class="stat-item"><span class="stat-num">{{ contarPorEstado('listo') }}</span> listos</div>
          </div>

          <!-- FILTROS -->
          <div class="filtros">
            @for (f of filtros; track f.valor) {
              <button class="filtro-btn" [class.act]="filtroActivo() === f.valor" (click)="setFiltro(f.valor)">
                @if (f.icono) { <span [innerHTML]="f.icono"></span> }
                {{ f.label }}
              </button>
            }
          </div>

          @if (pedidosFiltrados().length === 0) {
            <div class="empty-state">
              <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
              <h3>No hay pedidos aquí</h3>
              <p>{{ filtroActivo() === 'todos' ? 'Aún no has realizado ningún pedido.' : 'Ningún pedido coincide con este filtro.' }}</p>
              @if (filtroActivo() !== 'todos') {
                <button class="btn-outline" (click)="setFiltro('todos')">Ver todos</button>
              } @else {
                <a class="btn-primary" routerLink="/products">Ver Productos</a>
              }
            </div>
          } @else {
            <div class="pedidos-list">
              @for (p of pedidosFiltrados(); track p.id) {
                @let est = getEstado(p);
                <div class="pedido-card">
                  <!-- HEADER -->
                  <div class="card-h">
                    <div class="card-h-l">
                      <span class="card-h-id">#{{ p.id }}</span>
                      <span class="card-h-fecha">{{ formatFecha(p.fecha) }}</span>
                    </div>
                    <span class="badge-estado {{ est.badgeClass }}">
                      <span class="estado-icono" [innerHTML]="est.icono"></span>
                      {{ est.label }}
                    </span>
                  </div>

                  <!-- BODY -->
                  <div class="card-b">
                    <div class="card-row">
                      <div class="card-prod">
                        <span class="card-prod-nombre">{{ p.productos }}</span>
                        <span class="card-prod-cant">x{{ p.cantidad }}</span>
                      </div>
                      <span class="card-tipo">
                        <span class="tipo-dot" [class.tipo-dot--d]="p.tipoEntrega === 'Delivery'"></span>
                        {{ p.tipoEntrega }}
                      </span>
                    </div>

                    <div class="card-detalles">
                      <div class="card-det">
                        <span class="det-label">Pago</span>
                        <span class="det-val">{{ p.metodoPago }}</span>
                      </div>
                      <div class="card-det">
                        <span class="det-label">Estado</span>
                        <span class="det-val">{{ est.desc }}</span>
                      </div>
                      @if (p.deliveryDireccion) {
                        <div class="card-det card-det--full">
                          <span class="det-label">Dirección</span>
                          <span class="det-val">{{ p.deliveryDireccion }}</span>
                        </div>
                      }
                    </div>

                    <!-- PROGRESS DELIVERY -->
                    @if (p.tipoEntrega === 'Delivery') {
                      <div class="progress-track">
                        @for (step of deliverySteps; track step.key) {
                          @let st = getStep(p, step.key);
                          <div class="progress-step" [class.done]="st === 'done'" [class.act]="st === 'active'">
                            <div class="step-dot">
                              @if (st === 'done') {
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                              } @else if (st === 'active') {
                                <div class="step-pulse"></div>
                              }
                            </div>
                            <span class="step-label">{{ step.label }}</span>
                          </div>
                        }
                      </div>
                    }

                    <!-- INFO EXTRA -->
                    <div class="card-extra">
                      @if (est.key === 'esperando') {
                        <div class="extra-banner extra-banner--azul">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Estamos revisando tu comprobante de pago. Te notificaremos cuando sea aprobado.
                        </div>
                      }
                      @if (est.key === 'rechazado') {
                        <div class="extra-banner extra-banner--rojo">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          Tu comprobante fue rechazado. Contacta con atención al cliente.
                        </div>
                      }
                      @if (est.key === 'listo-recoger') {
                        <div class="extra-banner extra-banner--verde">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                          Tu pedido está listo para recoger en Av. Los Geranios 456, Lima.
                        </div>
                      }
                      @if (est.key === 'entregado') {
                        <div class="extra-banner extra-banner--verde">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                          Pedido entregado con éxito. ¡Gracias por tu compra!
                        </div>
                      }
                    </div>
                  </div>

                  <!-- FOOTER -->
                  <div class="card-f">
                    <div class="card-f-total">
                      <span>Total pagado</span>
                      <strong>S/ {{ p.total.toFixed(2) }}</strong>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;background:#f5f2ef;min-height:100vh;font-family:system-ui,-apple-system,sans-serif;color:#2c1810}
    .pedidos-page{padding:2rem 1rem}
    .page-inner{max-width:800px;margin:0 auto}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.6rem;font-weight:700;font-family:Georgia,serif;color:#550F26;margin:0;letter-spacing:-.3px}
    .page-sub{font-size:.85rem;color:#8b6e65;margin:4px 0 0}
    .btn-primary,.btn-outline{display:inline-flex;align-items:center;gap:6px;padding:.6rem 1.2rem;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;text-decoration:none}
    .btn-primary{background:#550F26;color:#fff;border:none}
    .btn-primary:hover{background:#6d1430}
    .btn-outline{background:#fff;color:#550F26;border:1px solid #ede8e3}
    .btn-outline:hover{border-color:#550F26}
    /* Skeleton */
    .loading-state{display:flex;flex-direction:column;gap:1rem}
    .sk-card{border-radius:12px;overflow:hidden;background:#fff;border:1px solid #ede8e3}
    .sk{background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;border-radius:4px;animation:shimmer 1.4s infinite}
    .sk-h{height:52px}
    .sk-body{padding:1rem;display:flex;flex-direction:column;gap:8px}
    .sk-l{height:16px;width:60%}.sk-m{height:13px;width:80%}.sk-s{height:11px;width:40%}
    @keyframes shimmer{to{background-position:-200% 0}}
    /* Stats bar */
    .stats-bar{display:flex;gap:16px;margin-bottom:1rem;flex-wrap:wrap}
    .stat-item{font-size:.75rem;color:#8b6e65;display:flex;align-items:center;gap:4px}
    .stat-num{font-weight:700;font-size:.9rem;color:#550F26;font-family:Georgia,serif}
    /* Filtros */
    .filtros{display:flex;gap:6px;margin-bottom:1.25rem;flex-wrap:wrap}
    .filtro-btn{display:inline-flex;align-items:center;gap:5px;padding:.45rem .9rem;background:#fff;border:1px solid #ede8e3;border-radius:999px;font-size:.78rem;font-weight:500;color:#8b6e65;cursor:pointer;font-family:inherit;transition:all .15s}
    .filtro-btn:hover{border-color:#c4b5ad;color:#550F26}
    .filtro-btn.act{background:#550F26;color:#fff;border-color:#550F26}
    .filtro-btn.act:hover{background:#6d1430;color:#fff}
    /* Empty */
    .empty-state{text-align:center;padding:4rem 2rem;background:#fff;border-radius:16px;border:1px solid #ede8e3}
    .empty-icon{width:56px;height:56px;margin:0 auto 1rem;color:#c4b5ad;opacity:.6}
    .empty-icon svg{width:100%;height:100%}
    .empty-state h3{font-size:1.1rem;color:#2c1810;margin:0 0 .4rem}
    .empty-state p{font-size:.85rem;color:#8b6e65;margin:0 0 1.2rem}
    /* Cards */
    .pedidos-list{display:flex;flex-direction:column;gap:1rem}
    .pedido-card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid #ede8e3;transition:box-shadow .2s}
    .pedido-card:hover{box-shadow:0 4px 20px rgba(85,15,38,.08)}
    /* Header */
    .card-h{background:linear-gradient(135deg,#550F26 0%,#7a1f45 100%);padding:.9rem 1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
    .card-h-l{display:flex;align-items:center;gap:12px}
    .card-h-id{font-weight:700;font-size:.95rem;color:#fff;font-family:monospace}
    .card-h-fecha{font-size:.75rem;color:rgba(255,255,255,.75)}
    .badge-estado{display:inline-flex;align-items:center;gap:4px;padding:.3rem .65rem;border-radius:999px;font-size:.7rem;font-weight:600;white-space:nowrap;flex-shrink:0}
    .estado-icono{display:inline-flex;width:12px;height:12px}
    .estado-icono svg{width:100%;height:100%}
    .badge-pendiente{background:rgba(255,255,255,.2);color:#fff}
    .badge-espera{background:rgba(254,243,199,.9);color:#92400e}
    .badge-proceso{background:rgba(254,243,199,.9);color:#92400e}
    .badge-camino{background:rgba(254,215,170,.9);color:#9a3412}
    .badge-listo{background:rgba(220,252,231,.9);color:#166534}
    .badge-entregado{background:rgba(219,234,254,.9);color:#1e40af}
    .badge-rechazado{background:rgba(254,202,202,.9);color:#991b1b}
    .badge-cancelado{background:rgba(239,235,232,.9);color:#6b5b54}
    /* Body */
    .card-b{padding:1rem 1.2rem}
    .card-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;gap:8px}
    .card-prod{display:flex;align-items:center;gap:8px;min-width:0}
    .card-prod-nombre{font-size:.9rem;font-weight:600;color:#2c1810;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .card-prod-cant{font-size:.75rem;background:#f5f2ef;color:#8b6e65;padding:2px 8px;border-radius:999px;flex-shrink:0}
    .card-tipo{display:flex;align-items:center;gap:5px;font-size:.75rem;color:#8b6e65;flex-shrink:0}
    .tipo-dot{width:6px;height:6px;border-radius:50%;background:#22c55e}
    .tipo-dot--d{background:#f59e0b}
    /* Detalles */
    .card-detalles{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-bottom:.75rem}
    .card-det{display:flex;flex-direction:column;gap:2px}
    .card-det--full{grid-column:1/-1}
    .det-label{font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#b8a9a0}
    .det-val{font-size:.8rem;color:#2c1810}
    /* Banners extra */
    .card-extra{margin-bottom:.5rem}
    .extra-banner{display:flex;align-items:flex-start;gap:8px;padding:.6rem .8rem;border-radius:8px;font-size:.75rem;line-height:1.5}
    .extra-banner svg{flex-shrink:0;margin-top:2px}
    .extra-banner--azul{background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe}
    .extra-banner--verde{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
    .extra-banner--rojo{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
    /* Progress */
    .progress-track{display:flex;justify-content:space-between;margin:.75rem 0 .25rem;padding:0 4px;position:relative}
    .progress-track::before{content:'';position:absolute;top:9px;left:12%;right:12%;height:2px;background:#ede8e3;z-index:0}
    .progress-step{display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;z-index:1;flex:1}
    .step-dot{width:20px;height:20px;border-radius:50%;background:#ede8e3;display:flex;align-items:center;justify-content:center;font-size:8px;transition:all .3s}
    .progress-step.done .step-dot{background:#550F26;color:#fff}
    .progress-step.act .step-dot{background:#f59e0b;border:2px solid #fbbf24;animation:pulse 1.5s infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.4)}50%{box-shadow:0 0 0 6px rgba(245,158,11,0)}}
    .step-pulse{width:8px;height:8px;border-radius:50%;background:#fff}
    .step-label{font-size:.6rem;color:#8b6e65;text-align:center;font-weight:500;line-height:1.2}
    .progress-step.done .step-label{color:#550F26;font-weight:600}
    .progress-step.act .step-label{color:#92400e;font-weight:600}
    /* Footer */
    .card-f{padding:.8rem 1.2rem;border-top:1px solid #f5f2ef;display:flex;justify-content:flex-end}
    .card-f-total{display:flex;align-items:center;gap:10px}
    .card-f-total span{font-size:.8rem;color:#8b6e65}
    .card-f-total strong{font-size:1.15rem;color:#550F26;font-family:Georgia,serif}
    @media(max-width:600px){
      .pedidos-page{padding:1rem}
      .card-detalles{grid-template-columns:1fr}
      .progress-track{flex-wrap:wrap;gap:4px}
      .progress-track::before{display:none}
      .progress-step{flex-direction:row;gap:6px;flex:1 1 45%}
      .filtros{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}
      .page-title{font-size:1.3rem}
      .stats-bar{font-size:.7rem;gap:10px}
    }
  `]
})
export class ClientePedidosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;

  isLoggedIn = signal(false);
  cargando = signal(false);
  pedidos = signal<Pedido[]>([]);
  filtroActivo = signal<FiltroPedido>('todos');

  readonly filtros: { valor: FiltroPedido; label: string; icono?: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'pendiente', label: 'Pendientes', icono: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { valor: 'proceso', label: 'En proceso', icono: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 8 4 12h16c0-4-4-6-8-10z"/><rect x="2" y="12" width="20" height="4" rx="1"/></svg>' },
    { valor: 'listo', label: 'Listos', icono: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' },
    { valor: 'cancelado', label: 'Cancelados' },
  ];

  readonly deliverySteps = [
    { key: 'pendiente', label: 'Pedido' },
    { key: 'preparando', label: 'Preparando' },
    { key: 'camino', label: 'En camino' },
    { key: 'entregado', label: 'Entregado' },
  ];

  pedidosFiltrados = computed(() => {
    const f = this.filtroActivo();
    const lista = this.pedidos();
    if (f === 'todos') return lista;
    return lista.filter(p => this.matchFiltro(p, f));
  });

  private idVenta(p: Pedido): number { return p.idEstadoVenta ?? 0; }
  private idEntrega(p: Pedido): number { return p.idEstadoEntrega ?? 0; }

  private matchFiltro(p: Pedido, f: FiltroPedido): boolean {
    const est = this.detectarEstado(p);
    switch (f) {
      case 'pendiente': return est === 'pendiente' || est === 'esperando' || est === 'rechazado';
      case 'proceso': return est === 'preparacion' || est === 'camino' || est === 'pagado';
      case 'listo': return est === 'listo-recoger' || est === 'entregado';
      case 'cancelado': return est === 'cancelado';
      default: return true;
    }
  }

  private detectarEstado(p: Pedido): string {
    const iv = this.idVenta(p);
    const ie = this.idEntrega(p);
    const ep = (p.estadoPago ?? '').toLowerCase();
    const de = (p.deliveryEstado ?? '').toLowerCase();

    const esCancelado = iv === 6 || ie === 6 || ep.includes('cancel') || de.includes('cancel');
    if (esCancelado) return 'cancelado';

    const esRechazado = iv === 4 || ep.includes('rechaz');
    if (esRechazado) return 'rechazado';

    const esEntregado = ie === 5 || de.includes('entregado');
    if (esEntregado) return 'entregado';

    const esEnCamino = ie === 4 || de.includes('camino');
    if (esEnCamino) return 'camino';

    const esPreparacion = ie === 2 || ie === 3 || de.includes('asign') || de.includes('acept');
    if (esPreparacion) return 'preparacion';

    const esPagado = iv === 5 || ep.includes('pagada');
    if (esPagado) {
      if (p.tipoEntrega === 'Recojo en tienda') return 'listo-recoger';
      if (ie === 1 || ie === 0 || de.includes('pendiente')) return 'pagado';
      return 'listo-recoger';
    }

    const esEsperando = iv === 2 || ep.includes('esperando') || ep.includes('validaci');
    if (esEsperando) return 'esperando';

    return 'pendiente';
  }

  contarPorEstado(f: FiltroPedido): number {
    return this.pedidos().filter(p => this.matchFiltro(p, f)).length;
  }

  getEstado(p: Pedido): EstadoInfo {
    const est = this.detectarEstado(p);
    switch (est) {
      case 'cancelado':
        return { key: 'cancelado', label: 'Cancelado', desc: 'Pedido cancelado', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', badgeClass: 'badge-cancelado' };
      case 'rechazado':
        return { key: 'rechazado', label: 'Rechazado', desc: 'Comprobante rechazado', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', badgeClass: 'badge-rechazado' };
      case 'entregado':
        return { key: 'entregado', label: 'Entregado', desc: 'Recibido con éxito', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>', badgeClass: 'badge-entregado' };
      case 'camino':
        return { key: 'camino', label: 'En camino', desc: 'Repartidor en camino', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14M5 17l-2-4h16l-2 4M5 17l2-10h10l2 10"/></svg>', badgeClass: 'badge-camino' };
      case 'preparacion':
        return { key: 'preparacion', label: 'En preparación', desc: 'Preparando tu pedido', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 8 4 12h16c0-4-4-6-8-10z"/><rect x="2" y="12" width="20" height="4" rx="1"/></svg>', badgeClass: 'badge-proceso' };
      case 'listo-recoger':
        return { key: 'listo-recoger', label: 'Listo para recoger', desc: 'Puedes pasar por tu pedido', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', badgeClass: 'badge-listo' };
      case 'pagado':
        return { key: 'pagado', label: 'Pagado', desc: 'Pago confirmado, esperando asignación', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', badgeClass: 'badge-listo' };
      case 'esperando':
        return { key: 'esperando', label: 'Esperando validación', desc: 'Revisando comprobante', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', badgeClass: 'badge-espera' };
      default:
        return { key: 'pendiente', label: 'Pendiente', desc: 'Pedido registrado', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', badgeClass: 'badge-pendiente' };
    }
  }

  getStep(p: Pedido, step: string): 'done' | 'active' | 'pending' {
    const ie = this.idEntrega(p);
    const de = (p.deliveryEstado ?? '').toLowerCase();
    switch (step) {
      case 'pendiente': return 'done';
      case 'preparando': return ie >= 2 || de.includes('asign') || de.includes('acept') ? 'done' : ie >= 1 || de.includes('pendiente') ? 'active' : 'pending';
      case 'camino': return ie >= 4 || de.includes('camino') ? (ie >= 5 || de.includes('entregado') ? 'done' : 'active') : 'pending';
      case 'entregado': return ie >= 5 || de.includes('entregado') ? 'done' : 'pending';
      default: return 'pending';
    }
  }

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn.set(this.auth.isLoggedIn());
    if (this.auth.isLoggedIn()) {
      this.cargarPedidos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarPedidos(): void {
    const persona = this.auth.getPersona();
    if (!persona?.id) return;

    this.cargando.set(true);
    this.http.get<Pedido[]>(`${this.apiUrl}/Venta/MisPedidos?idPersona=${persona.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const normalized = (data ?? []).map(p => ({
            ...p,
            idEstadoVenta: p.idEstadoVenta ?? 0,
            idEstadoEntrega: p.idEstadoEntrega ?? 0,
          }));
          this.pedidos.set(normalized);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.pedidos.set([]);
        }
      });
  }

  setFiltro(f: FiltroPedido): void {
    this.filtroActivo.set(f);
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    try {
      const d = new Date(f);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return f;
    }
  }
}
