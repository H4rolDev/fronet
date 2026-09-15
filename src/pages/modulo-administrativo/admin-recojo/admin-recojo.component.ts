import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../../services/venta.service';

interface Recojo {
  id: number;
  fechaVenta: string;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  idEstadoVenta: number;
  codigoEntrega: string;
  cliente: string;
  documento: string;
  detalles: Array<{ torta: string; cantidad: number; subTotal: number }>;
}

@Component({
  selector: 'app-admin-recojo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="pickup-page">
      <header><div><span class="eyebrow">Atención en tienda</span><h1>Recojo en tienda</h1><p>Valida el código y DNI antes de entregar el pedido.</p></div><button (click)="cargar()">Actualizar</button></header>
      <div class="state" *ngIf="cargando">Cargando pedidos...</div>
      <div class="empty" *ngIf="!cargando && !pedidos().length">No hay pedidos de recojo registrados.</div>
      <section class="grid" *ngIf="!cargando && pedidos().length">
        <article class="card" *ngFor="let pedido of pedidos()">
          <div class="top"><strong>Pedido #{{ pedido.id }}</strong><span [class]="estadoClase(pedido)">{{ estado(pedido) }}</span></div>
          <h2>{{ pedido.cliente }}</h2><p class="doc">DNI: {{ pedido.documento || 'No registrado' }}</p>
          <div class="code"><small>Código de entrega</small><b>{{ pedido.codigoEntrega }}</b></div>
          <div class="money"><span>Total <b>S/ {{ pedido.total | number:'1.2-2' }}</b></span><span>Pagado <b class="paid">S/ {{ pedido.montoPagado | number:'1.2-2' }}</b></span><span>Saldo <b class="due">S/ {{ pedido.saldoPendiente | number:'1.2-2' }}</b></span></div>
          <ul><li *ngFor="let item of pedido.detalles">{{ item.cantidad }} x {{ item.torta }}</li></ul>
          <button class="primary" [disabled]="pedido.idEstadoVenta === 7" (click)="abrir(pedido)">{{ pedido.idEstadoVenta === 7 ? 'Pedido recogido' : 'Validar y entregar' }}</button>
        </article>
      </section>
    </main>
    <div class="backdrop" *ngIf="seleccionado" (click)="cerrar()"><section class="modal" (click)="$event.stopPropagation()">
      <button class="close" (click)="cerrar()">×</button><span class="eyebrow">Validación de entrega</span><h2>Pedido #{{ seleccionado?.id }}</h2>
      <p>Solicita al cliente su código y documento. El saldo se cobra únicamente en efectivo.</p>
      <label>Código de entrega<input [(ngModel)]="codigo" maxlength="6" autocomplete="off"></label>
      <label>DNI del cliente<input [(ngModel)]="documento" autocomplete="off"></label>
      <label>Saldo cobrado en efectivo<input type="number" min="0" step="0.01" [(ngModel)]="montoCobrado"></label>
      <p class="hint">Saldo esperado: <b>S/ {{ seleccionado?.saldoPendiente | number:'1.2-2' }}</b></p>
      <button class="primary" [disabled]="procesando" (click)="confirmar()">{{ procesando ? 'Validando...' : 'Confirmar recojo' }}</button>
    </section></div>
  `,
  styles: [`
    :host{display:block;background:#fffaf5;min-height:100vh;color:#3e2922}.pickup-page{max-width:1100px;margin:auto;padding:2.5rem 1.25rem}header{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:2rem}h1{font:700 clamp(2rem,5vw,3rem) Georgia,serif;margin:.2rem 0}.eyebrow{color:#b95743;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem;font-weight:800}header p{color:#765f53;margin:.5rem 0 0}button{border:0;border-radius:.7rem;padding:.7rem 1rem;font-weight:700;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}.card{background:#fff;border:1px solid #eadbca;border-radius:1.1rem;padding:1.15rem;box-shadow:0 8px 25px #3e29220d}.top{display:flex;justify-content:space-between;gap:.5rem}.top span{font-size:.7rem;padding:.3rem .55rem;border-radius:99px;background:#fff1d6;color:#9a6415}.top span.done{background:#ddf7e7;color:#177545}.card h2{font:700 1.2rem Georgia,serif;margin:1rem 0 .15rem}.doc{margin:0;color:#765f53;font-size:.82rem}.code{background:#3e2922;color:#fff4df;border-radius:.8rem;text-align:center;padding:.8rem;margin:1rem 0}.code small,.code b{display:block}.code small{font-size:.65rem;text-transform:uppercase;letter-spacing:.12em;opacity:.75}.code b{font:700 1.65rem monospace;letter-spacing:.18em;margin-top:.25rem}.money{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;font-size:.7rem;color:#765f53}.money b{display:block;color:#3e2922;margin-top:.2rem}.money .paid{color:#16845b}.money .due{color:#c2410c}.card ul{padding-left:1.1rem;min-height:2.5rem;color:#765f53;font-size:.82rem}.primary{width:100%;background:#b95743;color:#fff}.primary:disabled{opacity:.55;cursor:not-allowed}.state,.empty{text-align:center;padding:3rem;color:#765f53}.backdrop{position:fixed;inset:0;background:#24161180;display:grid;place-items:center;padding:1rem;z-index:20}.modal{position:relative;background:#fffdf9;border-radius:1.2rem;padding:1.5rem;width:min(100%,420px);box-shadow:0 20px 60px #0004}.modal h2{font:700 1.7rem Georgia,serif;margin:.35rem 0}.modal p{color:#765f53;font-size:.85rem;line-height:1.5}.close{position:absolute;right:1rem;top:.8rem;background:none;font-size:1.5rem;padding:.2rem}.modal label{display:block;font-size:.75rem;font-weight:700;margin:.85rem 0}.modal input{display:block;width:100%;box-sizing:border-box;margin-top:.35rem;padding:.7rem;border:1px solid #decdbd;border-radius:.6rem;font:inherit}.hint{background:#fff1d6;padding:.65rem;border-radius:.5rem}.hint b{color:#9a6415}@media(max-width:560px){header{align-items:start;flex-direction:column}.money{font-size:.65rem}}
  `]
})
export class AdminRecojoComponent implements OnInit {
  pedidos = signal<Recojo[]>([]);
  cargando = false;
  seleccionado: Recojo | null = null;
  codigo = '';
  documento = '';
  montoCobrado = 0;
  procesando = false;

  constructor(private ventas: VentaService) {}
  ngOnInit(): void { this.cargar(); }
  cargar(): void { this.cargando = true; this.ventas.obtenerRecojos().subscribe({ next: data => { this.pedidos.set(data || []); this.cargando = false; }, error: () => this.cargando = false }); }
  abrir(pedido: Recojo): void { this.seleccionado = pedido; this.codigo = ''; this.documento = ''; this.montoCobrado = pedido.saldoPendiente || 0; }
  cerrar(): void { if (!this.procesando) this.seleccionado = null; }
  confirmar(): void {
    if (!this.seleccionado || !this.codigo.trim() || !this.documento.trim()) return;
    this.procesando = true;
    this.ventas.completarRecojo({ idVenta: this.seleccionado.id, codigoEntrega: this.codigo.trim(), documentoCliente: this.documento.trim(), montoCobrado: Number(this.montoCobrado) || 0, idMetodoPago: 1, usuario: 'admin' }).subscribe({
      next: () => { this.procesando = false; this.seleccionado = null; this.cargar(); },
      error: error => { this.procesando = false; alert(error.message || 'No se pudo validar el recojo.'); }
    });
  }
  estado(pedido: Recojo): string { return pedido.idEstadoVenta === 7 ? 'Recogido' : pedido.idEstadoVenta === 2 ? 'Pago por validar' : pedido.idEstadoVenta === 3 ? 'Pago parcial validado' : pedido.idEstadoVenta === 5 ? 'Pagado' : 'Pendiente de pago'; }
  estadoClase(pedido: Recojo): string { return pedido.idEstadoVenta === 7 ? 'done' : ''; }
}
