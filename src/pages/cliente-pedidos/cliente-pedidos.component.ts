import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { VentaService } from '../../services/venta.service';
import { ESTADO_LABEL, ComprobanteDTO } from '../../models/venta-dto';

interface Pedido {
  id: number;
  fecha: string;
  total: number;
  estadoPago: string;
  idEstadoVenta: number;
  productos: string;
  cantidad: number;
  tipoEntrega: string;
  deliveryEstado?: string;
  deliveryDireccion?: string;
  deliveryTelefono?: string;
  metodoPago: string;
  montoPagado?: number;
  saldoPendiente?: number;
  codigoEntrega?: string;
}

interface PedidoDetalle {
  venta: any;
  cliente: any;
  detalles: any[];
  pagos: any[];
  delivery: any;
  comprobante: any;
  imagenComprobante?: string | null;
}

interface HistorialItem {
  id: number;
  idEstadoAnterior?: number | null;
  idEstadoNuevo: number;
  accion: string;
  observacion?: string;
  usuario: string;
  fecha: string;
}

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="orders-page">
      <div class="orders-shell">
        <header class="orders-hero">
          <div>
            <span class="eyebrow">Tu cuenta · seguimiento</span>
            <h1>Historial de pedidos</h1>
            <p>Revisa tus compras y conoce cada actualización en tiempo real.</p>
          </div>
          <a class="hero-action" routerLink="/products"><span>＋</span> Nuevo pedido</a>
        </header>

        <section class="summary-row" *ngIf="!loading && isLoggedIn">
          <div class="summary-card summary-card--accent"><span class="summary-icon">▣</span><div><strong>{{ totalRegistros }}</strong><small>Pedidos realizados</small></div></div>
          <div class="summary-card"><span class="summary-icon">◷</span><div><strong>{{ paginaActual }} / {{ totalPaginas }}</strong><small>Página actual</small></div></div>
          <div class="summary-card"><span class="summary-icon">↗</span><div><strong>Más recientes</strong><small>Ordenados por fecha</small></div></div>
        </section>

        <section class="login-card" *ngIf="!isLoggedIn">
          <div class="empty-mark">◌</div><h2>Inicia sesión para ver tus pedidos</h2>
          <p>Accede a tu historial, comprobantes y seguimiento detallado.</p>
          <a class="primary-button" routerLink="/iniciar">Iniciar sesión</a>
        </section>

        <section class="loading-grid" *ngIf="isLoggedIn && loading">
          <div class="skeleton-card" *ngFor="let item of [1,2,3]"><i></i><b></b><em></em></div>
        </section>

        <ng-container *ngIf="isLoggedIn && !loading">
          <div class="error-card" *ngIf="errorMessage"><strong>No pudimos cargar tus pedidos.</strong><span>{{ errorMessage }}</span><button (click)="cargarPedidos()">Intentar nuevamente</button></div>
          <section class="empty-card" *ngIf="!errorMessage && pedidos.length === 0"><div class="empty-mark">♡</div><h2>Aún no tienes pedidos</h2><p>Cuando realices tu primera compra aparecerá aquí.</p><a class="primary-button" routerLink="/products">Ver catálogo</a></section>

          <section class="orders-list" *ngIf="!errorMessage && pedidos.length > 0">
            <div class="list-heading"><div><span class="eyebrow">Últimas compras</span><h2>Todos tus pedidos</h2></div><span class="result-count">{{ totalRegistros }} resultados</span></div>
            <article class="order-card" *ngFor="let pedido of pedidos; trackBy: trackPedido">
              <div class="order-card__top"><div><span class="order-number">Pedido #{{ pedido.id }}</span><time>{{ formatDate(pedido.fecha) }}</time></div><span class="status" [class]="statusClass(pedido.idEstadoVenta)">{{ estadoLabel(pedido) }}</span></div>
              <div class="order-card__body"><div class="product-summary"><span class="cake-mark">✦</span><div><strong>{{ pedido.productos || 'Pedido personalizado' }}</strong><small>{{ pedido.cantidad }} producto(s) · {{ pedido.tipoEntrega }}</small></div></div><div class="order-total"><small>Total</small><strong>S/ {{ pedido.total | number:'1.2-2' }}</strong></div></div>
               <div class="order-card__meta"><span><small>Pago</small>{{ pedido.metodoPago || 'Pendiente' }}</span><span><small>Estado</small>{{ estadoDescription(pedido) }}</span><button class="detail-button" (click)="verDetalle(pedido)">Ver detalle <b>→</b></button></div>
               <div class="delivery-code-mini" *ngIf="pedido.codigoEntrega"><small>Código de entrega</small><strong>{{ pedido.codigoEntrega }}</strong><span>Preséntalo con tu DNI</span></div>
            </article>
          </section>

          <nav class="pagination" *ngIf="totalPaginas > 1" aria-label="Paginación de pedidos">
            <button (click)="cambiarPagina(paginaActual - 1)" [disabled]="paginaActual === 1">← Anterior</button>
            <div><button *ngFor="let page of paginas" [class.active]="page === paginaActual" (click)="cambiarPagina(page)">{{ page }}</button></div>
            <button (click)="cambiarPagina(paginaActual + 1)" [disabled]="paginaActual === totalPaginas">Siguiente →</button>
          </nav>
        </ng-container>
      </div>

      <div class="modal-backdrop" *ngIf="selectedOrder" (click)="cerrarDetalle()">
        <section class="detail-modal" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="cerrarDetalle()" aria-label="Cerrar">×</button>
          <div class="detail-heading"><span class="eyebrow">Detalle completo</span><h2>Pedido #{{ selectedOrder.id }}</h2><p>{{ formatDate(selectedOrder.fecha) }} · {{ estadoLabel(selectedOrder) }}</p></div>
          <div class="detail-loading" *ngIf="detailLoading">Cargando información del pedido...</div>
          <div *ngIf="!detailLoading && detail" class="detail-content">
             <div class="detail-total"><span>Total del pedido</span><strong>S/ {{ detail.venta.total | number:'1.2-2' }}</strong><small>Creado el {{ formatDate(detail.venta.fechaVenta) }}</small></div>
             <section class="delivery-code-box" *ngIf="detail.venta.codigoEntrega"><small>Código único de entrega</small><strong>{{ detail.venta.codigoEntrega }}</strong><p>Guárdalo en tu historial. Te lo solicitarán junto con tu DNI para recoger o recibir el pedido.</p></section>
            <section class="detail-section"><h3>Productos</h3><div class="detail-product" *ngFor="let item of detail.detalles"><div><strong>{{ item.torta }}</strong><small>x{{ item.cantidad }} <span *ngIf="item.tamanio">· {{ item.tamanio }}</span><span *ngIf="item.sabor">· {{ item.sabor }}</span><span *ngIf="item.relleno">· {{ item.relleno }}</span></small></div><b>S/ {{ item.subTotal | number:'1.2-2' }}</b></div></section>
            <div class="detail-columns"><section class="detail-section"><h3>Pago</h3><div class="info-line" *ngFor="let pago of detail.pagos"><span>{{ pago.nombreMetodo }}<small *ngIf="pago.numeroOperacion">Operación {{ pago.numeroOperacion }}</small></span><b>S/ {{ pago.monto | number:'1.2-2' }}</b></div></section><section class="detail-section"><h3>Entrega</h3><div class="info-line"><span>Modalidad</span><b>{{ detail.venta.idTipoEntrega === 2 ? 'Delivery' : 'Recojo en tienda' }}</b></div><div class="info-line" *ngIf="detail.delivery"><span>Dirección</span><b>{{ detail.delivery.direccion }}</b></div><div class="info-line" *ngIf="detail.delivery"><span>Teléfono</span><b>{{ detail.delivery.telefonoContacto || detail.delivery.telefono }}</b></div></section></div>
             <section class="receipt-box" *ngIf="detail.imagenComprobante"><div><span class="receipt-icon">▤</span><div><strong>Comprobante de pago</strong><small>Imagen enviada para validación</small></div></div><a [href]="detail.imagenComprobante" target="_blank" rel="noopener">Ver comprobante ↗</a></section>
             <section class="receipt-box receipt-box--official" *ngIf="detail.venta.idEstadoVenta === 7"><div><span class="receipt-icon">✓</span><div><strong>Comprobante de compra</strong><small>Disponible porque tu pedido fue entregado</small></div></div><button (click)="verComprobante()">Ver comprobante</button></section>
            <section class="timeline-section"><h3>Seguimiento del pedido</h3><div class="timeline" *ngIf="history.length; else noHistory"><div class="timeline-item" *ngFor="let event of history; let last = last" [class.last]="last"><span class="timeline-dot" [class]="statusClass(event.idEstadoNuevo)"></span><div><div class="timeline-title"><strong>{{ event.accion || estadoLabelById(event.idEstadoNuevo) }}</strong><time>{{ formatDate(event.fecha) }}</time></div><p *ngIf="event.idEstadoAnterior">{{ estadoLabelById(event.idEstadoAnterior) }} <b>→</b> {{ estadoLabelById(event.idEstadoNuevo) }}</p><p *ngIf="event.observacion">{{ event.observacion }}</p><small>Actualizado por {{ event.usuario || 'Administración' }}</small></div></div></div><ng-template #noHistory><p class="muted">Aún no hay movimientos registrados para este pedido.</p></ng-template></section>
          </div>
          <div class="detail-error" *ngIf="detailError">{{ detailError }}</div>
       </section>
      </div>
      <div class="modal-backdrop" *ngIf="receipt" (click)="cerrarComprobante()">
        <section class="receipt-modal" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="cerrarComprobante()" aria-label="Cerrar">×</button>
          <div class="receipt-brand"><span>✦</span><div><small>COMPROBANTE DE COMPRA</small><h2>{{ receipt.empresa.nombre }}</h2></div></div>
          <div class="receipt-company"><span>RUC {{ receipt.empresa.ruc }}</span><span>{{ receipt.empresa.direccion }}</span><span>{{ receipt.empresa.telefono }}</span></div>
          <div class="receipt-meta"><span><small>{{ receipt.tipoComprobante }}</small><strong>{{ receipt.serieNumero }}</strong></span><span><small>Fecha</small><strong>{{ formatDate(receipt.fecha) }}</strong></span><span><small>Cliente</small><strong>{{ receipt.cliente }}</strong></span></div>
           <div class="receipt-items"><div class="receipt-item" *ngFor="let item of receipt.detalles"><span><strong>{{ item.torta }}</strong><small>{{ item.cantidad }} x S/ {{ item.precioUnitario | number:'1.2-2' }}</small><small *ngIf="item.tamanio || item.sabor || item.relleno || item.pisos || item.colorDecoracion || item.mensaje">{{ item.tamanio }} · {{ item.sabor }} · {{ item.relleno }}<span *ngIf="item.pisos"> · {{ item.pisos }} piso(s)</span><span *ngIf="item.colorDecoracion"> · {{ item.colorDecoracion }}</span><span *ngIf="item.mensaje"> · {{ item.mensaje }}</span></small></span><b>S/ {{ item.subTotal | number:'1.2-2' }}</b></div></div>
           <div class="receipt-breakdown"><span>Subtotal</span><b>S/ {{ receipt.subTotal | number:'1.2-2' }}</b><span>Delivery</span><b>S/ {{ (receipt.total - (receipt.subTotal || 0)) | number:'1.2-2' }}</b></div><div class="receipt-total"><span>Total pagado</span><strong>S/ {{ receipt.total | number:'1.2-2' }}</strong></div>
          <p class="receipt-thanks">Gracias por elegirnos. Tu celebracion merece algo dulce.</p>
        </section>
      </div>
    </main>
  `,
  styles: [`
    :host{display:block;background:#fffaf2;min-height:100vh;color:#3e2922}.orders-page{padding:3rem 1.25rem 5rem}.orders-shell{max-width:1000px;margin:auto}.orders-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:1.5rem;margin-bottom:2rem}.eyebrow{display:block;color:#b95743;text-transform:uppercase;letter-spacing:.13em;font-size:.67rem;font-weight:800;margin-bottom:.5rem}.orders-hero h1{font:700 clamp(2rem,5vw,3.2rem)/1.05 Georgia,serif;color:#3e2922;margin:0}.orders-hero p{color:#765f53;margin:.65rem 0 0}.hero-action,.primary-button{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;background:#b95743;color:#fff;border:0;border-radius:999px;padding:.8rem 1.2rem;text-decoration:none;font-weight:700;box-shadow:0 8px 18px #b9574330}.hero-action span{font-size:1.2rem}.summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:.9rem;margin-bottom:2.3rem}.summary-card{display:flex;align-items:center;gap:.75rem;padding:1rem 1.1rem;border:1px solid #eadbca;border-radius:1rem;background:#fffdf9}.summary-card--accent{background:#3e2922;color:#fff;border-color:#3e2922}.summary-icon{display:grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:.75rem;background:#f8eee2;color:#b95743;font-size:1.1rem}.summary-card--accent .summary-icon{background:#b95743;color:#fff}.summary-card strong,.summary-card small{display:block}.summary-card strong{font:700 1.05rem Georgia,serif}.summary-card small{font-size:.72rem;opacity:.72;margin-top:.2rem}.list-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:1rem}.list-heading h2{font:700 1.55rem Georgia,serif;margin:0}.result-count{font-size:.75rem;color:#765f53}.orders-list{display:grid;gap:1rem}.order-card{background:#fffdf9;border:1px solid #eadbca;border-radius:1.25rem;overflow:hidden;box-shadow:0 10px 25px #3e29220b;transition:.2s}.order-card:hover{transform:translateY(-2px);box-shadow:0 14px 30px #3e292218}.order-card__top{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;background:#fdf5eb;border-bottom:1px solid #f0e2d2}.order-number{font-weight:800;font-family:monospace;color:#3e2922;display:block}.order-card time{font-size:.72rem;color:#765f53}.status{display:inline-flex;padding:.35rem .7rem;border-radius:999px;font-size:.7rem;font-weight:800}.status--pending,.status--waiting{background:#fff1cf;color:#986313}.status--success{background:#e5f6e9;color:#23733a}.status--danger{background:#fde8e7;color:#a33f35}.status--neutral{background:#eee9e4;color:#765f53}.order-card__body{display:flex;justify-content:space-between;align-items:center;padding:1.25rem}.product-summary{display:flex;align-items:center;gap:.75rem}.cake-mark{display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:.8rem;background:#f8e8d7;color:#b95743;font-size:1.2rem}.product-summary strong,.product-summary small{display:block}.product-summary small{font-size:.76rem;color:#765f53;margin-top:.25rem}.order-total{text-align:right}.order-total small{display:block;color:#765f53;font-size:.7rem}.order-total strong{font:700 1.35rem Georgia,serif;color:#b95743}.order-card__meta{display:flex;align-items:center;gap:1.5rem;padding:.85rem 1.25rem;border-top:1px solid #f0e2d2;color:#765f53;font-size:.78rem}.order-card__meta span{display:grid;gap:.2rem}.order-card__meta small{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:#9a8479}.detail-button{margin-left:auto;background:none;border:0;color:#b95743;font-weight:800;cursor:pointer}.detail-button b{font-size:1.1rem}.pagination{display:flex;justify-content:center;align-items:center;gap:1rem;margin-top:2rem}.pagination>div{display:flex;gap:.35rem}.pagination button{border:1px solid #eadbca;background:#fffdf9;color:#765f53;padding:.55rem .8rem;border-radius:.6rem;cursor:pointer;font:inherit;font-size:.78rem}.pagination button.active{background:#b95743;color:#fff;border-color:#b95743}.pagination button:disabled{opacity:.4;cursor:not-allowed}.login-card,.empty-card{text-align:center;background:#fffdf9;border:1px solid #eadbca;border-radius:1.25rem;padding:4rem 1rem}.empty-mark{font-size:2.8rem;color:#c99032;margin-bottom:.7rem}.login-card h2,.empty-card h2{font:700 1.45rem Georgia,serif;margin:.2rem 0}.login-card p,.empty-card p{color:#765f53;margin:.5rem 0 1.4rem}.loading-grid{display:grid;gap:1rem}.skeleton-card{height:155px;border-radius:1.25rem;background:linear-gradient(100deg,#fffdf9 30%,#f8eee2 50%,#fffdf9 70%);background-size:200% 100%;animation:shimmer 1.3s infinite;border:1px solid #eadbca}.skeleton-card i,.skeleton-card b,.skeleton-card em{display:block;height:14px;background:#eadbca;border-radius:5px;margin:25px 20px 0}.skeleton-card b{width:55%;margin-top:24px}.skeleton-card em{width:30%;margin-top:14px}@keyframes shimmer{to{background-position:-200% 0}}.error-card{padding:1rem;background:#fde8e7;border:1px solid #f3c5c2;border-radius:1rem;color:#a33f35;display:flex;gap:.75rem;align-items:center}.error-card span{font-size:.85rem}.error-card button{margin-left:auto;border:0;border-radius:999px;padding:.5rem .8rem;background:#a33f35;color:#fff;cursor:pointer}.modal-backdrop{position:fixed;inset:0;z-index:100;background:#3e2922a8;display:grid;place-items:center;padding:1rem}.detail-modal{position:relative;max-height:92vh;overflow:auto;width:min(760px,100%);background:#fffdf9;border-radius:1.4rem;box-shadow:0 25px 70px #3e292255}.modal-close{position:absolute;right:1rem;top:1rem;width:2rem;height:2rem;border:0;border-radius:50%;background:#f8eee2;color:#3e2922;font-size:1.3rem;cursor:pointer}.detail-heading{padding:2rem 2rem 1.35rem;background:linear-gradient(135deg,#3e2922,#70483a);color:#fff}.detail-heading .eyebrow{color:#f1c982}.detail-heading h2{font:700 2rem Georgia,serif;margin:0}.detail-heading p{margin:.45rem 0 0;color:#f8e8d7;font-size:.82rem}.detail-content{padding:1.35rem 2rem 2rem}.detail-total{padding:1rem 1.15rem;border-radius:1rem;background:#f8eee2;display:grid;grid-template-columns:1fr auto;align-items:center}.detail-total span,.detail-total small{color:#765f53;font-size:.75rem}.detail-total strong{grid-column:2;grid-row:1/3;color:#b95743;font:700 1.5rem Georgia,serif}.detail-total small{grid-column:1}.detail-section{margin-top:1.35rem}.detail-section h3,.timeline-section h3{font:700 1rem Georgia,serif;margin:0 0 .75rem;color:#3e2922}.detail-product,.info-line{display:flex;justify-content:space-between;gap:1rem;padding:.7rem 0;border-bottom:1px solid #f0e2d2;font-size:.83rem}.detail-product small,.info-line small{display:block;color:#765f53;margin-top:.25rem;font-size:.72rem}.detail-product>b,.info-line>b{color:#b95743;white-space:nowrap}.detail-columns{display:grid;grid-template-columns:1fr 1fr;gap:2rem}.receipt-box{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:1.35rem;padding:1rem;border:1px solid #eadbca;border-radius:1rem}.receipt-box>div{display:flex;align-items:center;gap:.7rem}.receipt-icon{display:grid;place-items:center;width:2.3rem;height:2.3rem;border-radius:.7rem;background:#e5f6e9;color:#23733a}.receipt-box strong,.receipt-box small{display:block}.receipt-box small{font-size:.72rem;color:#765f53;margin-top:.2rem}.receipt-box a{color:#b95743;font-size:.78rem;font-weight:800;text-decoration:none}.timeline-section{margin-top:1.7rem}.timeline{display:grid}.timeline-item{position:relative;display:grid;grid-template-columns:1rem 1fr;gap:.75rem;padding-bottom:1.15rem}.timeline-item:not(.last)::after{content:'';position:absolute;left:.42rem;top:.9rem;bottom:0;width:2px;background:#eadbca}.timeline-dot{position:relative;z-index:1;width:.85rem;height:.85rem;border-radius:50%;background:#c99032;border:3px solid #fffdf9;box-shadow:0 0 0 1px #c99032}.timeline-dot.status--success{background:#22a05a;box-shadow:0 0 0 1px #22a05a}.timeline-dot.status--danger{background:#b95743;box-shadow:0 0 0 1px #b95743}.timeline-title{display:flex;justify-content:space-between;gap:1rem}.timeline-title strong{font-size:.82rem}.timeline-title time,.timeline-item p,.timeline-item small{color:#765f53;font-size:.72rem}.timeline-item p{margin:.3rem 0}.timeline-item p b{color:#c99032}.muted{color:#765f53;font-size:.8rem}.detail-loading,.detail-error{padding:2rem;text-align:center;color:#765f53}@media(max-width:700px){.orders-page{padding:2rem .9rem 4rem}.orders-hero{display:block}.hero-action{margin-top:1rem}.summary-row{grid-template-columns:1fr}.summary-card:nth-child(2),.summary-card:nth-child(3){display:none}.order-card__meta{flex-wrap:wrap;gap:.8rem}.detail-button{width:100%;text-align:left;margin:0}.detail-content{padding:1.1rem}.detail-heading{padding:1.6rem 1.1rem 1.2rem}.detail-columns{grid-template-columns:1fr;gap:.3rem}.receipt-box{align-items:flex-start;flex-direction:column}.receipt-box a{margin-left:3rem}.pagination{gap:.4rem}.pagination>button{font-size:0}.pagination>button:first-child:before{content:'‹';font-size:1.1rem}.pagination>button:last-child:before{content:'›';font-size:1.1rem}}
    `, `
     .receipt-box--official{border-color:#c9a45c;background:linear-gradient(135deg,#fffdf8,#fff6df)}.receipt-box--official button{border:0;border-radius:999px;background:#b95743;color:#fff;padding:.65rem 1rem;font-weight:700;cursor:pointer}.receipt-modal{position:relative;width:min(92vw,480px);background:#fffdf9;border-radius:1.5rem;padding:2rem;box-shadow:0 25px 70px #3e292250;border:1px solid #eadbca}.receipt-brand{display:flex;gap:.8rem;align-items:center;color:#b95743}.receipt-brand>span{display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:1rem;background:#3e2922;color:#e5bd68;font-size:1.4rem}.receipt-brand small,.receipt-meta small{display:block;color:#b95743;font-size:.62rem;font-weight:800;letter-spacing:.12em}.receipt-brand h2{margin:.15rem 0 0;font:700 1.5rem Georgia,serif;color:#3e2922}.receipt-company{display:flex;flex-wrap:wrap;gap:.45rem 1rem;padding:1rem 0;border-bottom:1px dashed #d9c7b4;color:#765f53;font-size:.72rem}.receipt-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;padding:1rem 0}.receipt-meta strong{display:block;margin-top:.25rem;font-size:.78rem;color:#3e2922}.receipt-items{border-top:1px solid #eadbca}.receipt-item{display:flex;justify-content:space-between;gap:1rem;padding:.8rem 0;border-bottom:1px solid #f0e7dd}.receipt-item strong,.receipt-item small{display:block}.receipt-item small{color:#765f53;margin-top:.2rem}.receipt-item b{color:#b95743}.receipt-total{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 0;font-weight:700;color:#3e2922}.receipt-total strong{font:700 1.6rem Georgia,serif;color:#b95743}.receipt-thanks{text-align:center;color:#765f53;font-size:.78rem;margin:.5rem 0 0}@media(max-width:560px){.receipt-modal{padding:1.25rem}.receipt-meta{grid-template-columns:1fr 1fr}.receipt-meta span:last-child{grid-column:1/-1}}
    `, `
      .delivery-code-mini{display:flex;align-items:center;gap:.55rem;margin:0 1rem 1rem;padding:.65rem .8rem;background:#3e2922;color:#fff4df;border-radius:.7rem}.delivery-code-mini small,.delivery-code-mini span{font-size:.65rem;opacity:.8}.delivery-code-mini strong{font:700 1rem monospace;letter-spacing:.12em}.delivery-code-box{display:grid;gap:.3rem;margin:1rem 0;padding:1rem;background:#3e2922;color:#fff4df;border-radius:1rem}.delivery-code-box small{text-transform:uppercase;letter-spacing:.12em;font-size:.65rem;opacity:.75}.delivery-code-box strong{font:700 1.8rem monospace;letter-spacing:.16em}.delivery-code-box p{margin:.2rem 0 0;color:#f7dfc7;font-size:.78rem}
    `]
})
export class ClientePedidosComponent implements OnInit {
  isLoggedIn = false;
  loading = true;
  errorMessage = '';
  pedidos: Pedido[] = [];
  paginaActual = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  readonly tamanioPagina = 6;
  selectedOrder: Pedido | null = null;
  detail: PedidoDetalle | null = null;
  history: HistorialItem[] = [];
  detailLoading = false;
  detailError = '';
  receipt: ComprobanteDTO | null = null;
  receiptLoading = false;
  receiptError = '';

  constructor(private auth: AuthService, private ventas: VentaService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) this.cargarPedidos();
    else this.loading = false;
  }

  cargarPedidos(): void {
    const personaId = this.auth.getPersonaId();
    if (!personaId) { this.loading = false; this.errorMessage = 'No se encontró la información del cliente.'; return; }
    this.loading = true;
    this.errorMessage = '';
    this.ventas.obtenerMisPedidosPaginado(personaId, this.paginaActual, this.tamanioPagina).subscribe({
      next: response => {
        this.pedidos = (response?.items || []).sort((a: Pedido, b: Pedido) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.totalRegistros = response?.totalRegistros || 0;
        this.totalPaginas = Math.max(response?.totalPaginas || 1, 1);
        this.paginaActual = response?.paginaActual || this.paginaActual;
        this.loading = false;
      },
      error: error => { this.loading = false; this.errorMessage = error?.error?.mensaje || 'Intenta nuevamente en unos segundos.'; }
    });
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas || page === this.paginaActual) return;
    this.paginaActual = page;
    this.cargarPedidos();
  }

  verDetalle(order: Pedido): void {
    this.selectedOrder = order;
    this.detail = null;
    this.history = [];
    this.detailError = '';
    this.detailLoading = true;
    forkJoin({ detail: this.ventas.obtenerDetalle(order.id), history: this.ventas.obtenerHistorial(order.id) }).subscribe({
      next: result => { this.detail = result.detail as PedidoDetalle; this.history = (result.history || []).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()); this.detailLoading = false; },
      error: error => { this.detailLoading = false; this.detailError = error?.error?.mensaje || 'No se pudo cargar el detalle del pedido.'; }
    });
  }

  cerrarDetalle(): void { this.selectedOrder = null; this.detail = null; this.cerrarComprobante(); }

  verComprobante(): void {
    if (!this.detail || this.detail.venta.idEstadoVenta !== 7) return;
    this.receiptLoading = true;
    this.receiptError = '';
    this.ventas.obtenerComprobante(this.detail.venta.id).subscribe({
      next: receipt => { this.receipt = receipt; this.receiptLoading = false; },
      error: error => { this.receiptLoading = false; this.receiptError = error.message; }
    });
  }

  cerrarComprobante(): void { this.receipt = null; }

  get paginas(): number[] {
    const start = Math.max(1, Math.min(this.paginaActual - 2, this.totalPaginas - 4));
    return Array.from({ length: Math.min(this.totalPaginas, 5) }, (_, index) => start + index);
  }

  estadoLabel(order: Pedido): string { return ESTADO_LABEL[order.idEstadoVenta] || order.estadoPago || 'Pendiente'; }
  estadoLabelById(id: number): string { return ESTADO_LABEL[id] || 'Actualización'; }
  estadoDescription(order: Pedido): string { return order.idEstadoVenta === 7 ? 'Pedido entregado' : order.deliveryEstado || (order.idEstadoVenta === 5 ? 'Pago confirmado' : 'En revisión'); }
  statusClass(id: number): string { return [1, 2].includes(id) ? 'status--pending' : [3, 5, 7].includes(id) ? 'status--success' : [4, 6].includes(id) ? 'status--danger' : 'status--neutral'; }
  formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
  trackPedido(_: number, pedido: Pedido): number { return pedido.id; }
}
