/**
 * @file venta-crear-modal.component.ts
 * @description Formulario completo para crear una venta.
 *
 * ─── SECCIONES DEL FORMULARIO ────────────────────────────────────────────────
 *  1. Cliente      → select de personas
 *  2. Tipo entrega → toggle Recojo (1) / Delivery (2)
 *  3. Tortas       → tabla dinámica de detalles (add/remove)
 *  4. Pagos        → tabla dinámica de pagos (add/remove)
 *  5. Delivery     → solo visible si tipoEntrega = 2
 *  6. Comprobante  → tipo, serie, número (obligatorios)
 *
 * ─── VALIDACIONES UX ─────────────────────────────────────────────────────────
 *  ✅ Al menos 1 torta con stock > 0
 *  ✅ Cantidades > 0
 *  ✅ Al menos 1 pago
 *  ✅ Suma de pagos >= total de la venta
 *  ✅ Delivery requerido si tipoEntrega = 2
 *  ✅ Serie y número de comprobante obligatorios
 *  ✅ No puede haber insumos duplicados en detalles
 *  ✅ Resumen en tiempo real con computed()
 */

import {
  Component, OnInit, OnDestroy,
  Output, EventEmitter, HostListener, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { FilaDetalle, FilaPago, MetodoPagoDTO, PersonaComboDTO, RegistrarVentaDTO, RepartidorDTO, TipoComprobanteDTO, TortaVentaDTO } from '../../../../models/venta-dto';
import { VentaService } from '../../../../services/venta.service';


let uid = 0;
const nextUid = () => ++uid;

@Component({
  selector: 'app-venta-crear-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">

  <!-- HEADER -->
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
      <div><h2 class="ph-t">Nueva Venta</h2><p class="ph-s">Completa todos los datos para registrar la venta</p></div>
    </div>
    <button class="px" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
  </header>

  @if (cargando()) {
    <div class="body">
      @for (i of [1,2,3,4]; track i) { <div class="sk-c"><span class="sk sk-l"></span><span class="sk sk-i"></span></div> }
    </div>
  }

  @if (!cargando()) {
  <div class="body">

    <!-- ══ 1. CLIENTE ══ -->
    <div class="seccion">
      <div class="sec-t">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Cliente
      </div>
      <div class="campo" [class.campo--err]="validado() && !idPersona()">
        <label class="lbl" for="v-persona">Persona / Cliente <span class="req">*</span></label>
        <select id="v-persona" class="sel" [ngModel]="idPersona()" (ngModelChange)="idPersona.set(+$event || null)">
          <option [ngValue]="null">— Seleccionar cliente —</option>
          @for (p of personas(); track p.id) {
            <option [ngValue]="p.id">{{ p.nombre }} · {{ p.numeroDocumento }}</option>
          }
        </select>
        @if (validado() && !idPersona()) { <p class="err-msg">Selecciona un cliente.</p> }
      </div>
    </div>

    <!-- ══ 2. TIPO ENTREGA ══ -->
    <div class="seccion">
      <div class="sec-t">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 21H1M13 21l4-4M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5M17 17l-4-4"/></svg>
        Tipo de entrega
      </div>
      <div class="toggle">
        <button type="button" class="t-btn" [class.t-btn--on]="tipoEntrega() === 1" (click)="tipoEntrega.set(1); onCambioTipoEntrega()">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Recojo en tienda
        </button>
        <button type="button" class="t-btn" [class.t-btn--on]="tipoEntrega() === 2" (click)="tipoEntrega.set(2); onCambioTipoEntrega()">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
          Delivery
        </button>
      </div>
    </div>

    <!-- ══ 3. TORTAS ══ -->
    <div class="seccion">
      <div class="sec-t">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 4 8 4 12h16c0-4-4-6-8-10z"/><rect x="2" y="12" width="20" height="4" rx="1"/><rect x="4" y="16" width="16" height="5" rx="1"/></svg>
        Tortas
        <button type="button" class="btn-add-fila" (click)="agregarTorta()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar
        </button>
      </div>

      @if (validado() && detalles().length === 0) {
        <p class="err-msg">Agrega al menos una torta.</p>
      }

      @if (detalles().length > 0) {
        <div class="tabla-det">
          <table>
            <thead><tr>
              <th>Torta</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">P. Pers.</th><th class="num">Sub.</th><th style="width:30px"></th>
            </tr></thead>
            <tbody>
              @for (fila of detalles(); track fila._uid) {
                <tr [class.fila-err]="esTortaDuplicada(fila._uid, fila.idTorta)">
                  <td>
                    <select class="sel-inline" [ngModel]="fila.idTorta" (ngModelChange)="onCambioTorta(fila._uid, $event)">
                      <option [ngValue]="null">— Seleccionar —</option>
                      @for (t of tortas(); track t.id) {
                        <option [ngValue]="t.id">{{ t.nombre }} (Stock: {{ t.stockDisponible }})</option>
                      }
                    </select>
                    @if (esTortaDuplicada(fila._uid, fila.idTorta)) {
                      <div class="fila-err-txt">Torta duplicada</div>
                    }
                  </td>
                  <td class="num">
                    <input type="number" class="inp-num" [ngModel]="fila.cantidad" (ngModelChange)="onCambioDetalle(fila._uid, 'cantidad', $event)" min="1" step="1" />
                  </td>
                  <td class="num">
                    <input type="number" class="inp-num" [ngModel]="fila.precioBase" (ngModelChange)="onCambioDetalle(fila._uid, 'precioBase', $event)" min="0" step="0.01" />
                  </td>
                  <td class="num">
                    <input type="number" class="inp-num" [ngModel]="fila.precioPersonalizacion" (ngModelChange)="onCambioDetalle(fila._uid, 'precioPersonalizacion', $event)" min="0" step="0.01" />
                  </td>
                  <td class="num" style="font-weight:700;font-family:Georgia,serif;color:#7a1f45;font-size:12px">
                    S/. {{ fila.subtotal.toFixed(2) }}
                  </td>
                  <td>
                    <button type="button" class="btn-del-fila" (click)="eliminarTorta(fila._uid)">✕</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ══ 4. PAGOS ══ -->
    <div class="seccion">
      <div class="sec-t">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        Pagos
        <button type="button" class="btn-add-fila" (click)="agregarPago()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar
        </button>
      </div>

      <!-- Resumen -->
      <div class="resumen-pago">
        <div class="rp-item">
          <span class="rp-lbl">Total venta</span>
          <span class="rp-val">S/. {{ totalVenta().toFixed(2) }}</span>
        </div>
        <div class="rp-item">
          <span class="rp-lbl">Total pagado</span>
          <span class="rp-val" [class.rp-insuf]="totalPagado() < totalVenta()">S/. {{ totalPagado().toFixed(2) }}</span>
        </div>
        @if (totalPagado() > totalVenta()) {
          <div class="rp-item">
            <span class="rp-lbl">Vuelto</span>
            <span class="rp-val rp-vuelto">S/. {{ (totalPagado() - totalVenta()).toFixed(2) }}</span>
          </div>
        }
      </div>

      @if (validado() && pagos().length === 0) { <p class="err-msg">Agrega al menos un pago.</p> }
      @if (validado() && totalPagado() < totalVenta() && pagos().length > 0) {
        <p class="err-msg">El pago total (S/. {{ totalPagado().toFixed(2) }}) es menor al total de la venta.</p>
      }

      @if (pagos().length > 0) {
        <div class="tabla-det">
          <table>
            <thead><tr><th>Método</th><th class="num">Monto</th><th>N° Operación</th><th style="width:30px"></th></tr></thead>
            <tbody>
              @for (pago of pagos(); track pago._uid) {
                <tr>
                  <td>
                    <select class="sel-inline" [ngModel]="pago.idMetodoPago" (ngModelChange)="onCambioPago(pago._uid, 'idMetodoPago', $event)">
                      <option [ngValue]="null">— Método —</option>
                      @for (m of metodosPago(); track m.id) {
                        <option [ngValue]="m.id">{{ m.nombre }}</option>
                      }
                    </select>
                  </td>
                  <td class="num">
                    <input type="number" class="inp-num" [ngModel]="pago.monto" (ngModelChange)="onCambioPago(pago._uid, 'monto', $event)" min="0.01" step="0.01" />
                  </td>
                  <td>
                    <input type="text" class="inp-inline" [ngModel]="pago.numeroOperacion" (ngModelChange)="onCambioPago(pago._uid, 'numeroOperacion', $event)" placeholder="Opcional" />
                  </td>
                  <td>
                    <button type="button" class="btn-del-fila" (click)="eliminarPago(pago._uid)">✕</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ══ 5. DELIVERY (condicional) ══ -->
    @if (tipoEntrega() === 2) {
      <div class="seccion seccion--delivery">
        <div class="sec-t">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 001.3 0C13 21.5 20 15.4 20 10a8 8 0 00-8-8z"/></svg>
          Datos de Delivery
        </div>
        <div class="campo-g">
          <div class="campo" [class.campo--err]="validado() && tipoEntrega()===2 && !delivery.direccion">
            <label class="lbl">Dirección <span class="req">*</span></label>
            <input class="inp" type="text" [(ngModel)]="delivery.direccion" placeholder="Av. Los Pinos 123..." />
            @if (validado() && tipoEntrega()===2 && !delivery.direccion) { <p class="err-msg">Ingresa la dirección.</p> }
          </div>
          <div class="campo" [class.campo--err]="validado() && tipoEntrega()===2 && !delivery.telefono">
            <label class="lbl">Teléfono de contacto <span class="req">*</span></label>
            <input class="inp" type="tel" [(ngModel)]="delivery.telefono" placeholder="999 888 777" />
            @if (validado() && tipoEntrega()===2 && !delivery.telefono) { <p class="err-msg">Ingresa el teléfono.</p> }
          </div>
          <div class="campo">
            <label class="lbl">Nombre de contacto</label>
            <input class="inp" type="text" [(ngModel)]="delivery.nombreContacto" placeholder="Nombre de quien recibe" />
          </div>
          <div class="campo">
            <label class="lbl">Referencia</label>
            <input class="inp" type="text" [(ngModel)]="delivery.referencia" placeholder="Referencia del lugar" />
          </div>
          <div class="campo">
            <label class="lbl">Repartidor</label>
            <select class="sel" [(ngModel)]="delivery.idRepartidor">
              <option [ngValue]="null">— Sin asignar —</option>
              @for (r of repartidores(); track r.id) {
                <option [ngValue]="r.id">{{ r.nombre }}</option>
              }
            </select>
          </div>
          <div class="campo">
            <label class="lbl">Costo delivery (S/.)</label>
            <input class="inp" type="number" [(ngModel)]="delivery.costoDelivery" min="0" step="0.50" />
          </div>
        </div>
      </div>
    }

    <!-- ══ 6. COMPROBANTE (Auto-generado) ══ -->
    <div class="seccion">
      <div class="sec-t">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Comprobante
      </div>
      <div class="campo-g">
        <div class="campo">
          <label class="lbl">Tipo</label>
          <select class="sel" [(ngModel)]="comprobante.idTipo" [disabled]="true">
            <option [ngValue]="1">Boleta</option>
            <option [ngValue]="2">Factura</option>
          </select>
        </div>
        <div class="campo">
          <label class="lbl">Serie</label>
          <input class="inp" type="text" [value]="comprobante.serie" readonly style="background:#f5f5f5" />
        </div>
        <div class="campo">
          <label class="lbl">Número</label>
          <input class="inp" type="text" [value]="comprobante.numero" readonly style="background:#f5f5f5" />
        </div>
      </div>
    </div>

    <!-- Error API -->
    @if (errorApi()) {
      <div class="alerta-err" role="alert" style="background:#fef2f2;border-color:#ef4444;">
        <div class="ae-ico" style="background:#ef4444;">⚠</div>
        <p class="ae-txt" style="color:#b91c1c;">{{ errorApi() }}</p>
      </div>
    }

  </div><!-- /body -->

  <!-- FOOTER -->
  <footer class="panel__footer">
    <div class="footer-resumen">
      <span class="fr-label">Total:</span>
      <span class="fr-val">S/. {{ totalVenta().toFixed(2) }}</span>
      @if (tipoEntrega() === 2 && delivery.costoDelivery > 0) {
        <span class="fr-del">+ S/. {{ delivery.costoDelivery.toFixed(2) }} delivery</span>
      }
    </div>
    <div class="footer-btns">
      <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
      <button type="button" class="btn btn-pri" (click)="submit()" [disabled]="guardando()">
        @if (guardando()) { <span class="spinner"></span> Registrando... }
        @else { Registrar Venta }
      </button>
    </div>
  </footer>
  }

</div>
</div>`,
  styles: [`
:host{--vino:#550F26;--vino-h:#6d1430;--vino-g:rgba(85,15,38,.12);--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--ok-txt:#166534;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:680px;max-height:94vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.9) translateY(14px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.ph-l{display:flex;align-items:center;gap:11px}
.ph-ico{width:33px;height:33px;background:var(--vino);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ph-ico svg{width:14px;height:14px}
.ph-t{font-size:14px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.ph-s{font-size:11px;color:var(--dim);margin:2px 0 0}
.px{width:27px;height:27px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.px:hover:not(:disabled){background:var(--db);border-color:var(--dbd);color:var(--danger)}
.px:disabled{opacity:.4;cursor:not-allowed}
.body{padding:18px 20px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;flex:1}
.body::-webkit-scrollbar{width:5px}.body::-webkit-scrollbar-thumb{background:var(--borde);border-radius:3px}
/* secciones */
.seccion{display:flex;flex-direction:column;gap:12px}
.seccion--delivery{background:#f0f7f4;border:1px solid #b5d4f4;border-radius:var(--r);padding:14px}
.sec-t{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);padding-bottom:8px;border-bottom:1px solid var(--borde)}
.sec-t svg{stroke:var(--vino)}
.btn-add-fila{margin-left:auto;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--vino);color:#fff;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
.btn-add-fila:hover{background:var(--vino-h)}
/* toggle */
.toggle{display:flex;border:1px solid var(--borde);border-radius:var(--r);overflow:hidden;background:#faf8f6}
.t-btn{flex:1;padding:9px 12px;background:transparent;border:none;font-size:12px;font-weight:600;color:var(--mid);cursor:pointer;font-family:inherit;transition:background .12s,color .12s;display:flex;align-items:center;justify-content:center;gap:5px}
.t-btn:first-child{border-right:1px solid var(--borde)}
.t-btn--on{background:var(--vino);color:#fff}
/* campos */
.campo{display:flex;flex-direction:column;gap:4px}
.campo-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.campo--err .inp,.campo--err .sel{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
.lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
.req{color:var(--danger)}
.inp,.sel{width:100%;padding:8px 11px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;-webkit-appearance:none;transition:border-color .14s;box-sizing:border-box}
.inp::placeholder{color:var(--dim);font-size:12px}
.inp:focus,.sel:focus{border-color:var(--vino);box-shadow:0 0 0 3px var(--vino-g)}
.sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;padding-right:28px;cursor:pointer}
.err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px;animation:ei .15s ease}
.err-msg::before{content:'⚠';font-size:10px}
@keyframes ei{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
/* tabla de detalles */
.tabla-det{border:1px solid var(--borde);border-radius:var(--r);overflow:hidden}
.tabla-det table{width:100%;border-collapse:collapse;font-size:12px}
.tabla-det thead{background:#faf8f6}
.tabla-det th{padding:7px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);border-bottom:1px solid var(--borde)}
.tabla-det th.num{text-align:right}
.tabla-det tr{border-bottom:1px solid #f5f1ee;transition:background .1s}
.tabla-det tr:last-child{border-bottom:none}
.tabla-det td{padding:7px 10px;vertical-align:middle}
.tabla-det td.num{text-align:right}
.fila-err{background:#fffbeb}
.fila-err-txt{font-size:10px;color:var(--danger);margin-top:3px}
.sel-inline{width:100%;padding:5px 22px 5px 8px;border:1px solid var(--borde);border-radius:6px;font-size:12px;color:var(--txt);background:#fff;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;font-family:inherit;outline:none;-webkit-appearance:none;cursor:pointer}
.sel-inline:focus{border-color:var(--vino)}
.inp-num{width:65px;padding:5px 7px;border:1px solid var(--borde);border-radius:6px;font-size:12px;color:var(--txt);text-align:right;font-family:inherit;outline:none;background:#fff}
.inp-num:focus{border-color:var(--vino)}
.inp-inline{width:100%;padding:5px 8px;border:1px solid var(--borde);border-radius:6px;font-size:12px;color:var(--txt);font-family:inherit;outline:none;background:#fff}
.inp-inline::placeholder{color:var(--dim)}
.inp-inline:focus{border-color:var(--vino)}
.btn-del-fila{width:24px;height:24px;border-radius:5px;background:var(--db);border:1px solid var(--dbd);color:var(--danger);cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;transition:all .1s}
.btn-del-fila:hover{background:#fecaca}
/* resumen pago */
.resumen-pago{display:flex;align-items:center;gap:16px;padding:8px 12px;background:var(--crema);border:1px solid var(--borde);border-radius:var(--r);flex-wrap:wrap}
.rp-item{display:flex;align-items:center;gap:6px}
.rp-lbl{font-size:11px;color:var(--dim)}
.rp-val{font-size:13px;font-weight:700;font-family:Georgia,serif;color:#7a1f45}
.rp-insuf{color:var(--danger)}
.rp-vuelto{color:var(--ok-txt)}
/* alerta error api */
.alerta-err{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;background:var(--db);border:1px solid var(--dbd);border-radius:var(--r)}
.ae-ico{width:19px;height:19px;background:var(--dbd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--danger);flex-shrink:0}
.ae-txt{font-size:12px;color:#9f3a2e;line-height:1.45;margin:0}
/* footer */
.panel__footer{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-top:1px solid var(--borde);background:var(--crema);flex-shrink:0;gap:12px;flex-wrap:wrap}
.footer-resumen{display:flex;align-items:center;gap:8px}
.fr-label{font-size:12px;color:var(--dim)}
.fr-val{font-size:18px;font-weight:700;font-family:Georgia,serif;color:#7a1f45}
.fr-del{font-size:11px;color:var(--mid)}
.footer-btns{display:flex;gap:10px}
/* skeleton */
.sk-c{display:flex;flex-direction:column;gap:6px}
.sk{display:block;border-radius:5px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
.sk-l{height:11px;width:60px}.sk-i{height:40px;width:100%}
@keyframes sh{to{background-position:-200% 0}}
/* botones footer */
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r);border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .14s,transform .1s;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-pri{background:var(--vino);color:#fff}.btn-pri:hover:not(:disabled){background:var(--vino-h)}
.btn-sec{background:#fff;color:var(--mid);border:1px solid var(--borde)}.btn-sec:hover:not(:disabled){border-color:#ddd4cd;color:var(--txt)}
.spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
@media(max-width:580px){.overlay{align-items:flex-end;padding:0}.panel{border-radius:16px 16px 0 0;max-height:95vh}.campo-g{grid-template-columns:1fr}.panel__footer{flex-direction:column;align-items:stretch}.footer-btns{flex-direction:column-reverse}.btn{justify-content:center}}
  `],
})
export class VentaCrearModalComponent implements OnInit, OnDestroy {

  @Output() cerrar      = new EventEmitter<void>();
  @Output() ventaCreada = new EventEmitter<string>();

  // ── Estado ─────────────────────────────────────────────────────────────────
  cargando  = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorApi  = signal<string | null>(null);
  validado  = signal<boolean>(false);

  // Catálogos
  tortas           = signal<TortaVentaDTO[]>([]);
  personas         = signal<PersonaComboDTO[]>([]);
  metodosPago      = signal<MetodoPagoDTO[]>([]);
  tiposComprobante = signal<TipoComprobanteDTO[]>([]);
  repartidores     = signal<RepartidorDTO[]>([]);

  // Formulario
  idPersona   = signal<number | null>(null);
  tipoEntrega = signal<1 | 2>(1);
  detalles    = signal<FilaDetalle[]>([]);
  pagos       = signal<FilaPago[]>([]);

  delivery = { idRepartidor: null as number | null, direccion: '', referencia: '', telefono: '', nombreContacto: '', costoDelivery: 0 };
  comprobante = { idTipo: null as number | null, serie: '', numero: '' };

  // ── Computados ─────────────────────────────────────────────────────────────
  totalVenta = computed(() => {
    const productos = this.detalles().reduce((acc, d) => acc + d.subtotal, 0);
    return productos + (this.tipoEntrega() === 2 ? this.delivery.costoDelivery : 0);
  });

  totalPagado = computed(() =>
    this.pagos().reduce((acc, p) => acc + (p.monto || 0), 0)
  );

  private destroy$ = new Subject<void>();

  constructor(private svc: VentaService) {}

  ngOnInit(): void {
    this.cargando.set(true);
    // Generar serie y número automático
    const anio = new Date().getFullYear().toString().slice(-2);
    const numero = Date.now().toString().slice(-8).padStart(8, '0');
    this.comprobante.serie = 'B' + anio;
    this.comprobante.numero = numero;
    this.comprobante.idTipo = 1; // Boleta por defecto

    forkJoin({
      tortas:           this.svc.obtenerTortas(),
      personas:         this.svc.obtenerClientes(),
      metodosPago:      this.svc.obtenerMetodosPago(),
      repartidores:     this.svc.obtenerRepartidores(),
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
    .subscribe({
      next: ({ tortas, personas, metodosPago, repartidores }) => {
        this.tortas.set(tortas.filter(t => t.stockDisponible > 0));
        this.personas.set(personas);
        this.metodosPago.set(metodosPago);
        this.repartidores.set(repartidores);
        // Fila inicial
        this.agregarTorta();
        this.agregarPago();
      },
      error: (e: Error) => this.errorApi.set(e.message),
    });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  onCambioTipoEntrega(): void {
    if (this.tipoEntrega() === 1) {
      this.delivery = { idRepartidor: null, direccion: '', referencia: '', telefono: '', nombreContacto: '', costoDelivery: 0 };
    }
  }

  // ── Gestión de filas ───────────────────────────────────────────────────────

  agregarTorta(): void {
    this.detalles.update(d => [...d, {
      _uid: nextUid(), idTorta: null, cantidad: 1,
      precioBase: 0, precioPersonalizacion: 0, subtotal: 0, mensaje: '',
    }]);
  }

  eliminarTorta(uid: number): void {
    if (this.detalles().length === 1) return;
    this.detalles.update(d => d.filter(f => f._uid !== uid));
  }

  onCambioTorta(uid: number, idTorta: any): void {
    const torta = this.tortas().find(t => t.id === +idTorta);
    this.detalles.update(d => d.map(f => {
      if (f._uid !== uid) return f;
      const precioBase = torta?.precioVenta ?? 0;
      const subtotal   = (precioBase + f.precioPersonalizacion) * f.cantidad;
      return { ...f, idTorta: +idTorta || null, precioBase, subtotal };
    }));
  }

  onCambioDetalle(uid: number, campo: keyof FilaDetalle, valor: any): void {
    this.detalles.update(d => d.map(f => {
      if (f._uid !== uid) return f;
      const updated = { ...f, [campo]: +valor || 0 };
      updated.subtotal = (updated.precioBase + updated.precioPersonalizacion) * updated.cantidad;
      return updated;
    }));
  }

  esTortaDuplicada(uid: number, idTorta: number | null): boolean {
    if (!idTorta) return false;
    const otras = this.detalles().filter(f => f._uid !== uid);
    return otras.some(f => f.idTorta === idTorta);
  }

  agregarPago(): void {
    this.pagos.update(p => [...p, { _uid: nextUid(), idMetodoPago: null, monto: 0, numeroOperacion: '' }]);
  }

  eliminarPago(uid: number): void {
    if (this.pagos().length === 1) return;
    this.pagos.update(p => p.filter(f => f._uid !== uid));
  }

  onCambioPago(uid: number, campo: keyof FilaPago, valor: any): void {
    this.pagos.update(p => p.map(f =>
      f._uid === uid ? { ...f, [campo]: campo === 'monto' ? +valor || 0 : campo === 'idMetodoPago' ? +valor || null : valor } : f
    ));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  submit(): void {
    this.validado.set(true);
    this.errorApi.set(null);

    // Validaciones específicas por campo
    if (!this.idPersona()) {
      this.errorApi.set('⚠️ Selecciona un cliente'); return;
    }

    const detalles = this.detalles();
    if (detalles.length === 0) {
      this.errorApi.set('⚠️ Agrega al menos una torta'); return;
    }

    const tortaSinSeleccionar = detalles.filter(d => !d.idTorta);
    if (tortaSinSeleccionar.length > 0) {
      this.errorApi.set('⚠️ Hay tortas sin seleccionar'); return;
    }

    const cantidadInvalida = detalles.filter(d => !d.cantidad || d.cantidad <= 0);
    if (cantidadInvalida.length > 0) {
      this.errorApi.set('⚠️ La cantidad debe ser mayor a 0'); return;
    }

    const duplicadas = detalles.filter((d, i) => detalles.findIndex(x => x.idTorta === d.idTorta) !== i);
    if (duplicadas.length > 0) {
      this.errorApi.set('⚠️ Hay tortas duplicadas'); return;
    }

    const pagos = this.pagos();
    if (pagos.length === 0) {
      this.errorApi.set('⚠️ Agrega al menos un método de pago'); return;
    }

    const pagoSinMetodo = pagos.filter(p => !p.idMetodoPago);
    if (pagoSinMetodo.length > 0) {
      this.errorApi.set('⚠️ Selecciona el método de pago'); return;
    }

    const montoInvalido = pagos.filter(p => !p.monto || p.monto <= 0);
    if (montoInvalido.length > 0) {
      this.errorApi.set('⚠️ El monto debe ser mayor a 0'); return;
    }

    if (this.totalPagado() < this.totalVenta()) {
      this.errorApi.set(`⚠️ Pago insuficiente: S/. ${this.totalPagado().toFixed(2)} < S/. ${this.totalVenta().toFixed(2)}`); return;
    }

    // Validación de delivery
    if (this.tipoEntrega() === 2) {
      if (!this.delivery.direccion.trim()) {
        this.errorApi.set('⚠️ Ingresa la dirección de entrega'); return;
      }
      if (!this.delivery.telefono.trim()) {
        this.errorApi.set('⚠️ Ingresa el teléfono de contacto'); return;
      }
    }

    this.guardando.set(true);

    const payload: RegistrarVentaDTO = {
      idPersona:     this.idPersona()!,
      idTipoEntrega: this.tipoEntrega(),
      usuario:       'admin',
      detalles: this.detalles().map(d => ({
        idTorta:                d.idTorta!,
        cantidad:               d.cantidad,
        precioBase:             d.precioBase,
        precioPersonalizacion:  d.precioPersonalizacion,
        mensaje:                d.mensaje,
      })),
      pagos: this.pagos().map(p => ({
        idMetodoPago:    p.idMetodoPago!,
        monto:           p.monto,
        numeroOperacion: p.numeroOperacion,
      })),
      entrega: this.tipoEntrega() === 2 ? {
        idPersonalRepartidor: this.delivery.idRepartidor || 0,
        direccion:            this.delivery.direccion,
        referencia:            this.delivery.referencia,
        telefono:             this.delivery.telefono,
        nombreContacto:       this.delivery.nombreContacto,
        costoDelivery:        this.delivery.costoDelivery,
      } : null,
      comprobante: {
        idTipoComprobante: this.comprobante.idTipo!,
        serie:             this.comprobante.serie,
        numero:            this.comprobante.numero,
      },
    };

    this.svc.registrar(payload)
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (id) => this.ventaCreada.emit(`Venta #${id} registrada correctamente por S/. ${this.totalVenta().toFixed(2)}.`),
        error: (e: Error) => this.errorApi.set(e.message),
      });
  }
}
