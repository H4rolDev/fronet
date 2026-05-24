/**
 * @file venta-detalle-modal.component.ts
 * @description Modal de solo lectura con el detalle completo de una venta.
 * Muestra cabecera, tortas, pagos y delivery (si aplica).
 */

import {
  Component, OnInit, OnDestroy,
  Input, Output, EventEmitter, HostListener, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';


const ESTILOS = `
:host{--vino:#550F26;--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--ok-bg:#f0faf4;--ok-bd:#bbf7d0;--ok-txt:#166534;--warn-bg:#fffbeb;--warn-bd:#fde68a;--warn-txt:#92400e;--info-bg:#e6f1fb;--info-bd:#b5d4f4;--info:#185fa5;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:260;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:800px;max-height:95vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88) translateY(12px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.ph-l{display:flex;align-items:center;gap:10px}
.ph-ico{width:32px;height:32px;background:#185fa5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ph-ico svg{width:14px;height:14px}
.ph-t{font-size:14px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.ph-s{font-size:11px;color:var(--dim);margin:2px 0 0}
.px{width:27px;height:27px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.px:hover{background:var(--db);border-color:var(--dbd);color:var(--danger)}
.body{overflow-y:auto;flex:1}
.body::-webkit-scrollbar{width:5px}.body::-webkit-scrollbar-thumb{background:var(--borde);border-radius:3px}
/* cabecera info */
.info-strip{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--borde)}
.is-item{padding:10px 18px;border-bottom:1px solid var(--borde);border-right:1px solid var(--borde)}
.is-item:nth-child(even){border-right:none}
.is-item:nth-last-child(-n+2){border-bottom:none}
.is-lbl{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.is-val{font-size:13px;font-weight:700;color:var(--txt)}
/* badges */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
.badge--pendiente{background:var(--warn-bg);color:var(--warn-txt);border:1px solid var(--warn-bd)}
.badge--completado{background:var(--ok-bg);color:var(--ok-txt);border:1px solid var(--ok-bd)}
.badge--cancelado{background:var(--db);color:var(--danger);border:1px solid var(--dbd)}
/* secciones */
.sec{border-bottom:1px solid var(--borde)}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 18px;background:#faf8f6;border-bottom:1px solid var(--borde)}
.sec-t{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid)}
.sec-sub{font-size:11px;color:var(--dim)}
/* tabla */
.lt{width:100%;border-collapse:collapse;font-size:12px}
.lt th{padding:7px 18px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);border-bottom:1px solid var(--borde)}
.lt th.num{text-align:right}
.lt tr{border-bottom:1px solid #f5f1ee}
.lt tr:last-child{border-bottom:none}
.lt td{padding:9px 18px;vertical-align:middle}
.lt td.num{text-align:right;font-weight:700;font-family:Georgia,serif;color:#7a1f45;font-size:13px}
/* delivery */
.del-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0}
.del-item{padding:9px 18px;border-bottom:1px solid var(--borde);border-right:1px solid var(--borde)}
.del-item:nth-child(even){border-right:none}
.del-item:last-child,.del-item:nth-last-child(2){border-bottom:none}
.del-lbl{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.del-val{font-size:12px;font-weight:700;color:var(--txt)}
/* total */
.total-row{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:12px 18px;background:var(--crema);border-top:1px solid var(--borde)}
.tr-lbl{font-size:12px;color:var(--mid)}
.tr-val{font-size:18px;font-weight:700;font-family:Georgia,serif;color:#7a1f45}
/* footer */
.mf{padding:12px 18px;border-top:1px solid var(--borde);background:var(--crema);display:flex;justify-content:flex-end}
.btn{padding:8px 16px;border-radius:8px;border:1px solid var(--borde);background:#fff;color:var(--mid);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.btn:hover{border-color:#ddd4cd;color:var(--txt)}
/* skeleton */
.sk-wrap{padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.sk{display:block;height:13px;border-radius:4px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
@keyframes sh{to{background-position:-200% 0}}
`;

@Component({
  selector: 'app-venta-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
      <div><h2 class="ph-t">Detalle Venta #{{ idVenta }}</h2><p class="ph-s">Vista completa de la venta</p></div>
    </div>
    <button class="px" (click)="cerrar.emit()">✕</button>
  </header>

  <div class="body">
    @if (cargando()) {
      <div class="sk-wrap">
        @for (i of [1,2,3,4,5]; track i) { <div class="sk" [style.width]="i%2===0?'60%':'100%'"></div> }
      </div>
    } @else if (detalle()) {

      <!-- Cabecera -->
      <div class="info-strip">
        <div class="is-item"><div class="is-lbl">Fecha</div><div class="is-val">{{ fmt(detalle()!.venta.fechaVenta) }}</div></div>
        <div class="is-item"><div class="is-lbl">Estado</div>
          <span class="badge" [ngClass]="ESTADO_CLASE[detalle()!.venta.idEstadoVenta]">{{ ESTADO_LABEL[detalle()!.venta.idEstadoVenta] }}</span>
        </div>
        <div class="is-item"><div class="is-lbl">Tipo entrega</div><div class="is-val">{{ ENTREGA_LABEL[detalle()!.venta.idTipoEntrega] }}</div></div>
        <div class="is-item"><div class="is-lbl">Total</div><div class="is-val" style="color:#7a1f45">S/. {{ detalle()!.venta.total.toFixed(2) }}</div></div>
        <div class="is-item"><div class="is-lbl">Cliente</div><div class="is-val">{{ detalle()!.cliente?.nombre || '—' }}</div></div>
        <div class="is-item"><div class="is-lbl">Documento</div><div class="is-val">{{ detalle()!.cliente?.documento || '—' }}</div></div>
        @if (detalle()!.comprobante) {
          <div class="is-item"><div class="is-lbl">Serie</div><div class="is-val">{{ detalle()!.comprobante!.serie }}</div></div>
          <div class="is-item"><div class="is-lbl">Número</div><div class="is-val">{{ detalle()!.comprobante!.numero }}</div></div>
        }
      </div>

      <!-- Tortas -->
      <div class="sec">
        <div class="sec-hdr">
          <span class="sec-t">Tortas</span>
          <span class="sec-sub">{{ detalle()!.detalles.length }} ítem(s)</span>
        </div>
        <table class="lt">
          <thead><tr><th>Torta</th><th>Cant.</th><th class="num">Base</th><th class="num">Personal.</th><th class="num">Total</th></tr></thead>
          <tbody>
            @for (d of detalle()!.detalles; track d.idTorta) {
              <tr>
                <td>
                  <div style="font-weight:700;font-size:13px;font-family:Georgia,serif">{{ d.torta }}</div>
                  @if (d.mensaje) { <div style="font-size:11px;color:var(--dim)">{{ d.mensaje }}</div> }
                </td>
                <td>{{ d.cantidad }}</td>
                <td class="num" style="font-size:12px;color:var(--mid)">S/. {{ d.precioBase.toFixed(2) }}</td>
                <td class="num" style="font-size:12px;color:var(--mid)">{{ d.precioPersonalizacion > 0 ? 'S/. ' + d.precioPersonalizacion.toFixed(2) : '—' }}</td>
                <td class="num" style="font-weight:700;color:#7a1f45">S/. {{ d.subTotal.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagos -->
      <div class="sec">
        <div class="sec-hdr"><span class="sec-t">Pagos</span></div>
        <table class="lt">
          <thead><tr><th>Método</th><th class="num">Monto</th></tr></thead>
          <tbody>
            @for (p of detalle()!.pagos; track p.idMetodoPago) {
              <tr>
                <td>{{ p.nombreMetodo }}</td>
                <td class="num">S/. {{ p.monto.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Delivery (condicional) -->
      @if (detalle()!.delivery) {
        <div class="sec">
          <div class="sec-hdr"><span class="sec-t">Datos de Delivery</span></div>
          <div class="del-grid">
            <div class="del-item"><div class="del-lbl">Dirección</div><div class="del-val">{{ detalle()!.delivery!.direccion }}</div></div>
            <div class="del-item"><div class="del-lbl">Teléfono</div><div class="del-val">{{ detalle()!.delivery!.telefono }}</div></div>
            @if (detalle()!.delivery!.nombreRepartidor) {
              <div class="del-item"><div class="del-lbl">Repartidor</div><div class="del-val">{{ detalle()!.delivery!.nombreRepartidor }}</div></div>
            }
            <div class="del-item"><div class="del-lbl">Costo delivery</div><div class="del-val">S/. {{ detalle()!.delivery!.costoDelivery.toFixed(2) }}</div></div>
          </div>
        </div>
      }

      <div class="total-row">
        <span class="tr-lbl">Total de la venta</span>
        <span class="tr-val">S/. {{ detalle()!.venta.total.toFixed(2) }}</span>
      </div>
    }
  </div>

  <div class="mf">
    <button class="btn" style="background:var(--vino);color:#fff" (click)="abrirComprobante.emit(idVenta)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Imprimir
    </button>
    <button class="btn" (click)="cerrar.emit()">Cerrar</button>
  </div>
</div>
</div>`,
  styles: [ESTILOS],
})
export class VentaDetalleModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) idVenta!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() abrirComprobante = new EventEmitter<number>();

  cargando = signal<boolean>(false);
  detalle  = signal<VentaDetalleDTO | null>(null);

  readonly ESTADO_LABEL  = ESTADO_LABEL;
  readonly ESTADO_CLASE  = ESTADO_CLASE;
  readonly ENTREGA_LABEL = ENTREGA_LABEL;

  private destroy$ = new Subject<void>();

  constructor(private svc: VentaService) {}

  ngOnInit(): void {
    this.cargando.set(true);
    this.svc.obtenerDetalle(this.idVenta)
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({ next: d => this.detalle.set(d), error: () => {} });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape') onEsc(): void { this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.cerrar.emit();
  }

  fmt(f: string): string {
    if (!f) return '—';
    const d = f.split('T')[0].split('-');
    return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : f;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODAL COMPROBANTE (TICKET PARA IMPRIMIR)
// ═══════════════════════════════════════════════════════════════════════════════

import { ComprobanteDTO, ENTREGA_LABEL, ESTADO_CLASE, ESTADO_LABEL, VentaDetalleDTO } from '../../../../models/venta-dto';
import { VentaService } from '../../../../services/venta.service';

const ESTILOS_TICKET = `
:host{--vino:#550F26;--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:260;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:400px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
.ph{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.ph-l{display:flex;align-items:center;gap:9px}
.ph-ico{width:30px;height:30px;background:var(--ok-txt, #166534);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ph-ico svg{width:13px;height:13px}
.ph-t{font-size:13px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.ph-s{font-size:10px;color:var(--dim);margin:2px 0 0}
.px{width:26px;height:26px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.px:hover{background:var(--db);border-color:var(--dbd);color:var(--danger)}
.body{padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;align-items:center}
.body::-webkit-scrollbar{width:5px}.body::-webkit-scrollbar-thumb{background:var(--borde);border-radius:3px}
/* TICKET */
.ticket{width:100%;max-width:300px;background:#fff;border:1px dashed #ccc;border-radius:4px;padding:16px;font-family:monospace;font-size:11px;color:#1a1a1a}
.t-logo{text-align:center;font-family:Georgia,serif;font-size:16px;font-weight:700;color:var(--vino);margin-bottom:3px}
.t-sub{text-align:center;font-size:9px;color:#666;margin-bottom:2px}
.t-sep{border:none;border-top:1px dashed #ccc;margin:8px 0}
.t-row{display:flex;justify-content:space-between;padding:2px 0;font-size:10px}
.t-row.bold{font-weight:700;font-size:11px}
.t-total{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;font-weight:700;color:var(--vino)}
.t-center{text-align:center;color:#666;font-size:9px;margin-top:6px}
.t-det-hdr{display:flex;justify-content:space-between;font-weight:700;font-size:10px;padding:2px 0;border-bottom:1px solid #ccc}
/* skeleton */
.sk-wrap{width:100%;display:flex;flex-direction:column;gap:8px;padding:10px}
.sk{display:block;height:12px;border-radius:4px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
@keyframes sh{to{background-position:-200% 0}}
/* footer */
.mf{display:flex;gap:10px;padding:12px 16px;border-top:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.btn-print{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;background:var(--vino);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .12s}
.btn-print:hover{background:var(--vino-h)}
.btn-close{padding:9px 16px;background:#fff;border:1px solid var(--borde);border-radius:8px;color:var(--mid);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
`;

@Component({
  selector: 'app-venta-comprobante-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico" style="background:#166534"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></div>
      <div><h2 class="ph-t">Comprobante de Venta</h2><p class="ph-s">Venta #{{ idVenta }} · listo para imprimir</p></div>
    </div>
    <button class="px" (click)="cerrar.emit()">✕</button>
  </header>

  <div class="body">
    @if (cargando()) {
      <div class="sk-wrap">
        @for (i of [1,2,3,4,5,6]; track i) { <div class="sk" [style.width]="i%2===0?'60%':'100%'"></div> }
      </div>
    } @else if (comp()) {
      <!-- TICKET -->
      <div class="ticket" id="ticket-print">
        <div class="t-logo">Dulce &amp; Co.</div>
        <div class="t-sub">RUC: 20123456789</div>
        <div class="t-sub">Jr. Las Flores 123, Lima</div>
        <div class="t-sep"></div>
        <div class="t-row bold"><span>{{ comp()!.tipoComprobante }}</span><span>{{ comp()!.serieNumero }}</span></div>
        <div class="t-row"><span>Fecha:</span><span>{{ fmt(comp()!.fecha) }}</span></div>
        <div class="t-row"><span>Cliente:</span><span>{{ comp()!.cliente }}</span></div>
        <div class="t-row"><span>Entrega:</span><span>{{ comp()!.tipoEntrega }}</span></div>
        @if (comp()!.direccion) {
          <div class="t-row"><span>Dirección:</span><span style="max-width:150px;text-align:right">{{ comp()!.direccion }}</span></div>
        }
        <div class="t-sep"></div>
        <div class="t-det-hdr"><span>Producto</span><span>Total</span></div>
        <div class="t-sep" style="margin:4px 0"></div>
        @for (d of comp()!.detalles; track d.torta) {
          <div class="t-row">
            <span>{{ d.torta }} x{{ d.cantidad }}</span>
            <span>S/. {{ d.subTotal.toFixed(2) }}</span>
          </div>
        }
        <div class="t-sep"></div>
        <div class="t-row"><span>Subtotal:</span><span>S/. {{ comp()!.subTotal.toFixed(2) }}</span></div>
        <div class="t-total"><span>TOTAL:</span><span>S/. {{ comp()!.total.toFixed(2) }}</span></div>
        <div class="t-sep"></div>
        @for (p of comp()!.pagos; track p.metodo) {
          <div class="t-row"><span>{{ p.metodo }}</span><span>S/. {{ p.monto.toFixed(2) }}</span></div>
        }
        <div class="t-sep"></div>
        <div class="t-center">¡Gracias por su compra!</div>
        <div class="t-center">Dulce &amp; Co. — Tortas artesanales 🎂</div>
      </div>
    }
  </div>

  <div class="mf">
    <button class="btn-close" (click)="cerrar.emit()">Cerrar</button>
    @if (comp()) {
      <button class="btn-print" (click)="imprimir()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir Ticket
      </button>
    }
  </div>
</div>
</div>`,
  styles: [ESTILOS_TICKET],
})
export class VentaComprobanteModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) idVenta!: number;
  @Output() cerrar = new EventEmitter<void>();

  cargando = signal<boolean>(false);
  comp     = signal<ComprobanteDTO | null>(null);

  private destroy$ = new Subject<void>();

  constructor(private svc: VentaService) {}

  ngOnInit(): void {
    this.cargando.set(true);
    this.svc.obtenerComprobante(this.idVenta)
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({ next: c => this.comp.set(c), error: () => {} });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape') onEsc(): void { this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.cerrar.emit();
  }

  /** Imprime en formato A4 profesional */
  imprimir(): void {
    const c = this.comp();
    if (!c) return;
    
    const totalPagado = c.pagos.reduce((acc, p) => acc + p.monto, 0);
    const vuelto = totalPagado - c.total;
    
    const ventana = window.open('', '_blank', 'width=800,height=900');
    if (!ventana) return;
    
    ventana.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Comprobante - Tortas Yane</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; background: #fff; }
          .comprobante { max-width: 700px; margin: 0 auto; border: 2px solid #550F26; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #550F26 0%, #7a1f45 100%); color: white; padding: 25px; text-align: center; }
          .header h1 { margin: 0; font-family: Georgia, serif; font-size: 28px; letter-spacing: 1px; }
          .header .sub { font-size: 11px; opacity: 0.9; margin-top: 5px; }
          .empresa-info { padding: 15px 25px; background: #faf8f6; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; }
          .seccion { padding: 15px 25px; }
          .seccion-title { font-size: 11px; font-weight: 700; color: #550F26; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
          .info-item label { font-size: 10px; color: #888; display: block; }
          .info-item span { font-weight: 600; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #faf8f6; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 10px; color: #550F26; border-bottom: 2px solid #550F26; }
          th.num { text-align: right; }
          td { padding: 8px 12px; border-bottom: 1px solid #eee; }
          td.num { text-align: right; font-weight: 600; }
          .total-row { background: #faf8f6; padding: 12px 25px; display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; color: #550F26; border-top: 2px solid #550F26; }
          .pagos { margin-top: 15px; }
          .pago-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ccc; }
          .footer { background: #faf8f6; padding: 15px 25px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; }
          .btn-print { display: none; }
          @media print { 
            body { padding: 0; } 
            .comprobante { border: none; }
          }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">IMPRIMIR</button>
        <div class="comprobante">
          <div class="header">
            <h1>TORTAŞ YANE</h1>
            <div class="sub">Tortas Artesanales Personalizadas</div>
          </div>
          <div class="empresa-info">
            <div>RUC: 10789234567</div>
            <div>Av. Los Geranios 456, Lima</div>
            <div>Telf: 987 654 321</div>
          </div>
          <div class="seccion">
            <div class="seccion-title">Datos de la Venta</div>
            <div class="info-grid">
              <div class="info-item"><label>N° Comprobante</label><span>${c.serieNumero || '—'}</span></div>
              <div class="info-item"><label>Fecha</label><span>${this.fmt(c.fecha)}</span></div>
              <div class="info-item"><label>Cliente</label><span>${c.cliente}</span></div>
              <div class="info-item"><label>Tipo Entrega</label><span>${c.tipoEntrega}</span></div>
            </div>
          </div>
          <div class="seccion">
            <div class="seccion-title">Detalle de Productos</div>
            <table>
              <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">P. Unit.</th><th class="num">Subtotal</th></tr></thead>
              <tbody>
                ${c.detalles.map(d => `
                  <tr>
                    <td>${d.torta}</td>
                    <td class="num">${d.cantidad}</td>
                    <td class="num">S/. ${d.precioUnitario.toFixed(2)}</td>
                    <td class="num">S/. ${d.subTotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-row">
              <span>TOTAL</span>
              <span>S/. ${c.total.toFixed(2)}</span>
            </div>
          </div>
          <div class="seccion pagos">
            <div class="seccion-title">Métodos de Pago</div>
            ${c.pagos.map(p => `
              <div class="pago-item">
                <span>${p.metodo}</span>
                <span>S/. ${p.monto.toFixed(2)}</span>
              </div>
            `).join('')}
            ${vuelto > 0 ? `
              <div class="pago-item" style="color: #16a34a; font-weight: 700;">
                <span>VUELTO</span>
                <span>S/. ${vuelto.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>¡Gracias por su preferencia!</p>
            <p>Tortas Yane - Deliciosos momentos mereces un dulce finale</p>
          </div>
        </div>
        <script>window.onload=()=>{ window.print(); }<\/script>
      </body>
      </html>
    `);
    ventana.document.close();
  }

  fmt(f: string): string {
    if (!f) return '—';
    const d = f.split('T')[0].split('-');
    return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : f;
  }
}
