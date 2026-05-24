/**
 * @file insumo-detalle-lotes.component.ts
 * @description Modal con la tabla de lotes de un insumo.
 *
 * Funcionalidades:
 *  • Tabla de lotes del insumo (GET ObtenerLotesPorInsumo)
 *  • Paginación de 5 lotes por página
 *  • Por cada lote ACTIVO:    Editar | Desactivar
 *  • Por cada lote INACTIVO:  Activar
 *  • Validación UX: no desactivar si cantidadDisponible > 0
 *  • Editar lote: campos cantidadInicial, cantidadDisponible, costoUnitario, fechaVencimiento
 *  • Botón "Nuevo lote" abre el modal de crear con el insumo pre-seleccionado
 *  • Emite (cambio) al padre para recargar el listado de insumos
 */

import {
  Component, OnInit, OnDestroy,
  Input, Output, EventEmitter, HostListener, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { InsumoListadoDTO, InsumoLoteDTO } from '../../../../models/insumo-dto';
import { InsumoService } from '../../../../services/insumo.service';

const POR_PAGINA = 5;

function validarDisp(): ValidatorFn {
  return (g: AbstractControl) => {
    const ini = +g.get('cantidadInicial')?.value;
    const dis = +g.get('cantidadDisponible')?.value;
    if (!ini || dis == null) return null;
    return dis > ini ? { superaInicial: true } : null;
  };
}

@Component({
  selector: 'app-insumo-detalle-lotes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="overlay" role="dialog" (click)="onOverlay($event)">
<div class="panel">

  <!-- HEADER -->
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>
      <div><h2 class="ph-t">Lotes del insumo</h2><p class="ph-s">Gestión de stock por lote</p></div>
    </div>
    <button class="px" (click)="cerrar.emit()" [disabled]="procesando()">✕</button>
  </header>

  <div class="panel-body">

    <!-- Strip del insumo -->
    <div class="istrip">
      <div class="istrip-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>
      <div>
        <div class="istrip-n">{{ insumo.nombre }}</div>
        <div class="istrip-s">{{ insumo.nombreUnidadMedida }} ({{ insumo.abreviatura }}) · Stock total:
          <strong>{{ insumo.stockDisponible }}</strong>
        </div>
      </div>
      <button class="btn-nl" (click)="abrirNuevoLote()" [disabled]="procesando()">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo lote
      </button>
    </div>

    <!-- Tabla de lotes -->
    @if (cargandoLotes()) {
      <div class="sk-tabla">
        @for (i of [1,2,3]; track i) {
          <div class="sk-fila">
            <span class="sk sk-md"></span><span class="sk sk-sm"></span>
            <span class="sk sk-sm"></span><span class="sk sk-sm"></span>
            <span class="sk sk-sm"></span><span class="sk sk-sm"></span>
          </div>
        }
      </div>
    } @else if (lotes().length === 0) {
      <div class="vacio">
        <div class="vacio-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/></svg></div>
        <p>No hay lotes registrados para este insumo.</p>
        <button class="btn-nl" (click)="abrirNuevoLote()">+ Registrar primer lote</button>
      </div>
    } @else {
      <div class="lt-wrap">
        <table class="lt">
          <thead><tr>
            <th>N° Lote</th><th class="num">Disponible</th><th class="num">Costo</th>
            <th>Vencimiento</th><th>Estado</th><th class="centro">Acciones</th>
          </tr></thead>
          <tbody>
            @for (lote of paginaActual(); track lote.id) {
              <tr [class.fila-inac]="!lote.activo">
                <td><span class="badge-lote">{{ lote.numeroLote }}</span></td>
                <td class="num">
                  @if (lote.cantidadDisponible > 0) {
                    <span class="chip chip-ok">{{ lote.cantidadDisponible }}</span>
                  } @else {
                    <span class="chip chip-0">0</span>
                  }
                </td>
                <td class="num cv">S/. {{ lote.costoUnitario.toFixed(2) }}</td>
                <td>
                  @if (lote.fechaVencimiento) {
                    <span [class]="claseVenc(lote)">{{ fmtFecha(lote.fechaVencimiento) }}</span>
                    @if (estadoVenc(lote) === 'vencido') { <span class="tag-venc">Vencido</span> }
                    @if (estadoVenc(lote) === 'proximo') { <span class="tag-prox">{{ diasVenc(lote.fechaVencimiento) }}d</span> }
                  } @else {
                    <span class="dim">—</span>
                  }
                </td>
                <td>
                  @if (lote.activo) {
                    <span class="b-act"><span class="dot dot-g"></span>Activo</span>
                  } @else {
                    <span class="b-ina"><span class="dot dot-r"></span>Inactivo</span>
                  }
                </td>
                <td class="centro">
                  <div class="acs">
                    @if (lote.activo) {
                      <button class="ba ba-e" (click)="abrirEditarLote(lote)" title="Editar lote">✎</button>
                      <button class="ba ba-d" (click)="iniciarDesactivarLote(lote)" title="Desactivar lote">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </button>
                    } @else {
                      <button class="ba ba-a" (click)="iniciarActivarLote(lote)" title="Activar lote">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Activar
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      @if (totalPaginas() > 1) {
        <div class="pag">
          <button class="pag-btn" (click)="irPagina(paginaNum() - 1)" [disabled]="paginaNum() === 1">‹</button>
          @for (p of pageArr(); track p) {
            <button class="pag-btn" [class.pag-btn--act]="p === paginaNum()" (click)="irPagina(p)">{{ p }}</button>
          }
          <button class="pag-btn" (click)="irPagina(paginaNum() + 1)" [disabled]="paginaNum() === totalPaginas()">›</button>
          <span class="pag-info">{{ paginaNum() }}/{{ totalPaginas() }}</span>
        </div>
      }

      <!-- Advertencia UX -->
      <div class="warn-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Solo puedes desactivar un lote si su cantidad disponible es 0. Para activar un lote, el insumo debe estar activo y el lote no puede estar vencido.
      </div>
    }

    <!-- Toast interno -->
    @if (toastMsg()) {
      <div class="mini-toast" [class.mini-toast--err]="toastErr()">
        {{ toastMsg() }}
      </div>
    }

  </div><!-- panel-body -->
</div><!-- panel -->
</div><!-- overlay -->

<!-- CONFIRMACIÓN DESACTIVAR LOTE -->
@if (loteDesact()) {
  <div class="overlay2" role="dialog">
    <div class="dial">
      <div class="dial-body">
        <div class="dial-ico dial-ico--warn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <h3>¿Desactivar lote?</h3>
        <p>Lote <strong>{{ loteDesact()!.numeroLote }}</strong>. Esta acción es reversible.</p>
      </div>
      <div class="dial-footer">
        <button class="btn btn-sec" (click)="loteDesact.set(null)" [disabled]="procesando()">Cancelar</button>
        <button class="btn btn-warn" (click)="confirmarDesactivarLote()" [disabled]="procesando()">
          @if (procesando()) { <span class="spinner"></span> } @else { Desactivar }
        </button>
      </div>
    </div>
  </div>
}

<!-- SUB-MODAL: NUEVO LOTE PARA ESTE INSUMO -->
@if (mostrarNuevoLote()) {
  <div class="overlay2" role="dialog" aria-label="Nuevo lote">
    <div class="dial dial--lg">
      <div class="dial-hdr">
        <div class="dl">
          <div class="dl-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
          <div>
            <h3 style="font-family:Georgia,serif;font-size:14px;margin:0;color:#2c1810">Nuevo Lote</h3>
            <p style="font-size:11px;color:#b8a9a0;margin:2px 0 0">Para el insumo: <strong style="color:#550F26">{{ insumo.nombre }}</strong></p>
          </div>
        </div>
        <button class="px" (click)="mostrarNuevoLote.set(false)" [disabled]="guardandoNuevo()">✕</button>
      </div>

      <!-- Info del insumo (solo lectura) -->
      <div class="info-fija" style="margin:14px 16px 0">
        <div class="if-item"><div class="if-lbl">Insumo</div><div class="if-val">{{ insumo.nombre }}</div></div>
        <div class="if-item"><div class="if-lbl">Unidad</div><div class="if-val">{{ insumo.nombreUnidadMedida }} ({{ insumo.abreviatura }})</div></div>
      </div>

      <div class="dial-form" [formGroup]="formNuevoLote">
        <p style="font-size:11px;color:#b8a9a0;margin-top:-6px">El N° de lote se genera automáticamente (LOT-XXXXXX).</p>
        <div class="campo-g">
          <!-- Cantidad inicial -->
          <div class="campo" [class.campo--err]="errNL('cantidadInicial')">
            <label class="campo-lbl">Cantidad inicial <span class="req">*</span></label>
            <input type="number" class="inp" formControlName="cantidadInicial" placeholder="0" min="0.01" step="0.01" />
            @if (errNL('cantidadInicial')) { <p class="err-msg">{{ errMsgNL('cantidadInicial') }}</p> }
          </div>
          <!-- Cantidad disponible -->
          <div class="campo" [class.campo--err]="errNL('cantidadDisponible') || errDispNuevo">
            <label class="campo-lbl">Cantidad disponible <span class="req">*</span></label>
            <input type="number" class="inp" formControlName="cantidadDisponible" placeholder="0" min="0.01" step="0.01" />
            @if (errNL('cantidadDisponible')) { <p class="err-msg">{{ errMsgNL('cantidadDisponible') }}</p> }
            @if (errDispNuevo) { <p class="err-msg">No puede superar la cantidad inicial.</p> }
          </div>
          <!-- Costo unitario -->
          <div class="campo" [class.campo--err]="errNL('costoUnitario')">
            <label class="campo-lbl">Costo unit. (S/.) <span class="req">*</span></label>
            <div class="prefix-w"><span class="prefix">S/.</span><input type="number" class="inp inp--pfx" formControlName="costoUnitario" placeholder="0.00" min="0.01" step="0.01" /></div>
            @if (errNL('costoUnitario')) { <p class="err-msg">{{ errMsgNL('costoUnitario') }}</p> }
          </div>
          <!-- Fecha vencimiento -->
          <div class="campo">
            <label class="campo-lbl">Fecha vencimiento</label>
            <input type="date" class="inp" formControlName="fechaVencimiento" />
            <span style="font-size:11px;color:#b8a9a0">Opcional</span>
          </div>
        </div>

        @if (errorNuevoLote()) {
          <div class="alerta-err" role="alert">
            <div class="alerta-err__ico">✕</div>
            <p class="alerta-err__txt">{{ errorNuevoLote() }}</p>
          </div>
        }
      </div>

      <div class="dial-footer">
        <button class="btn btn-sec" (click)="mostrarNuevoLote.set(false)" [disabled]="guardandoNuevo()">Cancelar</button>
        <button class="btn btn-pri" (click)="submitNuevoLote()" [disabled]="guardandoNuevo()">
          @if (guardandoNuevo()) { <span class="spinner"></span> Registrando... }
          @else { + Registrar lote }
        </button>
      </div>
    </div>
  </div>
}

<!-- CONFIRMACIÓN ACTIVAR LOTE -->
@if (loteAct()) {
  <div class="overlay2" role="dialog">
    <div class="dial">
      <div class="dial-body">
        <div class="dial-ico dial-ico--ok"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h3>¿Activar lote?</h3>
        <p>Lote <strong>{{ loteAct()!.numeroLote }}</strong>. Se verificará que no esté vencido.</p>
      </div>
      <div class="dial-footer">
        <button class="btn btn-sec" (click)="loteAct.set(null)" [disabled]="procesando()">Cancelar</button>
        <button class="btn btn-ok" (click)="confirmarActivarLote()" [disabled]="procesando()">
          @if (procesando()) { <span class="spinner"></span> } @else { Activar }
        </button>
      </div>
    </div>
  </div>
}

<!-- MODAL EDITAR LOTE (inline) -->
@if (loteEditando()) {
  <div class="overlay2" role="dialog">
    <div class="dial dial--lg">
      <div class="dial-hdr">
        <div class="dl"><div class="dl-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><div><h3 style="font-family:Georgia,serif;font-size:14px;margin:0;color:#2c1810">Editar Lote</h3><p style="font-size:11px;color:#b8a9a0;margin:2px 0 0">Solo modifica stock, costo y vencimiento</p></div></div>
        <button class="px" (click)="loteEditando.set(null)" [disabled]="guardandoLote()">✕</button>
      </div>
      <!-- Info fija -->
      <div class="info-fija">
        <div class="if-item"><div class="if-lbl">N° Lote</div><div class="if-val if-val--lote">{{ loteEditando()!.numeroLote }}</div></div>
        <div class="if-item"><div class="if-lbl">Insumo</div><div class="if-val">{{ insumo.nombre }}</div></div>
      </div>
      <div class="dial-form" [formGroup]="formLote">
        <div class="campo-g">
          <div class="campo" [class.campo--err]="errL('cantidadInicial')">
            <label class="campo-lbl">Cant. inicial <span class="req">*</span></label>
            <input type="number" class="inp" formControlName="cantidadInicial" min="0.01" step="0.01" />
            @if (errL('cantidadInicial')) { <p class="err-msg">{{ errMsgL('cantidadInicial') }}</p> }
          </div>
          <div class="campo" [class.campo--err]="errL('cantidadDisponible') || errDispLote">
            <label class="campo-lbl">Cant. disponible <span class="req">*</span></label>
            <input type="number" class="inp" formControlName="cantidadDisponible" min="0" step="0.01" />
            @if (errL('cantidadDisponible')) { <p class="err-msg">{{ errMsgL('cantidadDisponible') }}</p> }
            @if (errDispLote) { <p class="err-msg">No puede superar la cantidad inicial.</p> }
          </div>
          <div class="campo" [class.campo--err]="errL('costoUnitario')">
            <label class="campo-lbl">Costo unit. (S/.) <span class="req">*</span></label>
            <div class="prefix-w"><span class="prefix">S/.</span><input type="number" class="inp inp--pfx" formControlName="costoUnitario" min="0.01" step="0.01" /></div>
            @if (errL('costoUnitario')) { <p class="err-msg">{{ errMsgL('costoUnitario') }}</p> }
          </div>
          <div class="campo">
            <label class="campo-lbl">Fecha vencimiento</label>
            <input type="date" class="inp" formControlName="fechaVencimiento" />
          </div>
        </div>
        @if (errorLote()) {
          <div class="alerta-err" role="alert"><div class="alerta-err__ico">✕</div><p class="alerta-err__txt">{{ errorLote() }}</p></div>
        }
      </div>
      <div class="dial-footer">
        <button class="btn btn-sec" (click)="loteEditando.set(null)" [disabled]="guardandoLote()">Cancelar</button>
        <button class="btn btn-pri" (click)="submitLote()" [disabled]="guardandoLote()">
          @if (guardandoLote()) { <span class="spinner"></span> Guardando... } @else { ✓ Guardar }
        </button>
      </div>
    </div>
  </div>
}
`,
  styles: [`
:host{--vino:#550F26;--vino-h:#6d1430;--vino-g:rgba(85,15,38,.12);--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--ok-txt:#166534;--ok-bg:#f0faf4;--ok-bd:#bbf7d0;--warn:#f59e0b;--warn-bg:#fffbeb;--warn-bd:#fde68a;--warn-txt:#92400e;--info-bg:#e6f1fb;--info-bd:#b5d4f4;--info:#185fa5;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:260;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
.overlay2{position:fixed;inset:0;background:rgba(44,24,16,.55);z-index:270;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:620px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88) translateY(12px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.ph-l{display:flex;align-items:center;gap:11px}
.ph-ico{width:32px;height:32px;background:var(--vino);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ph-ico svg{width:14px;height:14px}
.ph-t{font-size:14px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.ph-s{font-size:11px;color:var(--dim);margin:2px 0 0}
.px{width:27px;height:27px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.px:hover:not(:disabled){background:var(--db);border-color:var(--dbd);color:var(--danger)}
.px:disabled{opacity:.4;cursor:not-allowed}
.panel-body{padding:18px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;flex:1}
.panel-body::-webkit-scrollbar{width:5px}.panel-body::-webkit-scrollbar-thumb{background:var(--borde);border-radius:3px}
/* istrip */
.istrip{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--crema);border:1px solid var(--borde);border-radius:9px}
.istrip-ico{width:30px;height:30px;background:var(--vino);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.istrip-ico svg{width:13px;height:13px}
.istrip-n{font-size:13px;font-weight:700;font-family:Georgia,serif;color:var(--txt)}
.istrip-s{font-size:11px;color:var(--dim);margin-top:1px}
.btn-nl{margin-left:auto;display:flex;align-items:center;gap:5px;padding:5px 11px;background:var(--vino);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:background .12s;font-family:inherit}
.btn-nl:hover:not(:disabled){background:var(--vino-h)}
.btn-nl:disabled{opacity:.5;cursor:not-allowed}
/* tabla lotes */
.lt-wrap{border:1px solid var(--borde);border-radius:var(--r);overflow:hidden}
.lt{width:100%;border-collapse:collapse;font-size:12px}
.lt thead{background:#faf8f6}
.lt th{padding:8px 11px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);border-bottom:1px solid var(--borde);white-space:nowrap}
.lt th.num{text-align:right}.lt th.centro{text-align:center}
.lt tr{border-bottom:1px solid #f5f1ee;transition:background .1s}
.lt tr:last-child{border-bottom:none}.lt tr:hover td{background:#fdf9f8}
.lt td{padding:10px 11px;vertical-align:middle}
.lt td.num{text-align:right}.lt td.centro{text-align:center}
.fila-inac td{opacity:.6}
.badge-lote{font-family:monospace;font-size:11px;font-weight:700;color:#7a1f45;background:#fdf0f8;border:1px solid #f5cfe6;padding:2px 7px;border-radius:4px;display:inline-block;white-space:nowrap}
.chip{display:inline-block;font-weight:700;font-size:12px;padding:2px 7px;border-radius:5px}
.chip-ok{color:var(--ok-txt);background:var(--ok-bg)}.chip-0{color:#9f3a2e;background:var(--db);font-style:italic}
.cv{font-weight:600;font-family:Georgia,serif;color:var(--txt)}
.dim{color:var(--dim)}
/* vencimiento */
.v-ok{font-size:11px;color:var(--ok-txt)}.v-prox{font-size:11px;color:var(--warn-txt);font-weight:600}.v-venc{font-size:11px;color:var(--danger);font-weight:700}
.tag-venc{font-size:9px;font-weight:700;background:var(--db);color:var(--danger);border:1px solid var(--dbd);border-radius:4px;padding:1px 5px;margin-left:4px}
.tag-prox{font-size:9px;font-weight:700;background:var(--warn-bg);color:var(--warn-txt);border:1px solid var(--warn-bd);border-radius:4px;padding:1px 5px;margin-left:4px}
/* badges */
.b-act{display:inline-flex;align-items:center;gap:4px;background:var(--ok-bg);color:var(--ok-txt);border:1px solid var(--ok-bd);border-radius:999px;padding:2px 7px;font-size:10px;font-weight:700}
.b-ina{display:inline-flex;align-items:center;gap:4px;background:var(--db);color:#9f3a2e;border:1px solid var(--dbd);border-radius:999px;padding:2px 7px;font-size:10px;font-weight:700}
.dot{display:inline-block;width:6px;height:6px;border-radius:50%}.dot-g{background:var(--ok)}.dot-r{background:var(--danger)}
/* botones acción lote */
.acs{display:flex;justify-content:center;gap:4px}
.ba{height:26px;border-radius:6px;border:1px solid;cursor:pointer;font-size:11px;background:#fff;display:flex;align-items:center;justify-content:center;gap:3px;transition:all .1s;padding:0 7px;min-width:26px;font-family:inherit;font-weight:600}
.ba:active{transform:scale(.9)}
.ba-e{border-color:#e8d8cc;color:#8b4513}.ba-e:hover{background:#fdf0e8;border-color:#c8916a}
.ba-d{border-color:var(--dbd);color:var(--danger)}.ba-d:hover{background:var(--db);border-color:#e07060}
.ba-a{border-color:var(--ok-bd);color:var(--ok-txt);font-size:10px}.ba-a:hover{background:var(--ok-bg);border-color:var(--ok)}
/* paginación */
.pag{display:flex;align-items:center;gap:4px;justify-content:center;padding:6px 0}
.pag-btn{width:28px;height:28px;border-radius:6px;border:1px solid var(--borde);background:#fff;color:var(--mid);cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;transition:all .12s}
.pag-btn:hover:not(:disabled){border-color:var(--vino);color:var(--vino)}
.pag-btn--act{background:var(--vino);color:#fff;border-color:var(--vino)}
.pag-btn:disabled{opacity:.35;cursor:not-allowed}
.pag-info{font-size:11px;color:var(--dim);margin-left:4px}
/* warn box */
.warn-box{display:flex;align-items:flex-start;gap:7px;padding:9px 12px;background:var(--warn-bg);border:1px solid var(--warn-bd);border-radius:var(--r);font-size:12px;color:var(--warn-txt);line-height:1.4}
.warn-box svg{flex-shrink:0;margin-top:1px}
/* skeleton tabla */
.sk-tabla{display:flex;flex-direction:column;gap:8px;border:1px solid var(--borde);border-radius:var(--r);padding:12px}
.sk-fila{display:flex;align-items:center;gap:10px}
.sk{display:block;border-radius:4px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite;height:13px}
.sk-sm{width:55px}.sk-md{width:90px}
@keyframes sh{to{background-position:-200% 0}}
/* vacío */
.vacio{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 0;color:var(--dim)}
.vacio-ico{width:44px;height:44px;background:#faf3f0;border:1px solid #f0e4de;border-radius:50%;display:flex;align-items:center;justify-content:center}
.vacio-ico svg{width:18px;height:18px;stroke:#c4b5ad}
.vacio p{font-size:13px;margin:0;color:var(--mid)}
/* mini toast */
.mini-toast{padding:8px 14px;background:var(--ok-bg);border:1px solid var(--ok-bd);border-radius:var(--r);font-size:12px;color:var(--ok-txt);text-align:center;animation:fi .2s ease}
.mini-toast--err{background:var(--db);border-color:var(--dbd);color:var(--danger)}
/* diálogos */
.dial{background:#fff;border:1px solid var(--borde);border-radius:14px;max-width:360px;width:100%;overflow:hidden;box-shadow:0 8px 32px rgba(85,15,38,.12);animation:pi .25s cubic-bezier(.34,1.56,.64,1)}
.dial--lg{max-width:480px}
.dial-body{padding:24px 22px 18px;text-align:center}
.dial-hdr{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--borde);background:var(--crema)}
.dl{display:flex;align-items:center;gap:10px}
.dl-ico{width:30px;height:30px;background:var(--vino);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.dl-ico svg{width:13px;height:13px}
.dial-ico{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border-width:1px;border-style:solid}
.dial-ico--warn{background:var(--warn-bg);border-color:var(--warn-bd)}
.dial-ico--warn svg{width:20px;height:20px;stroke:var(--warn)}
.dial-ico--ok{background:var(--ok-bg);border-color:var(--ok-bd)}
.dial-ico--ok svg{width:20px;height:20px;stroke:var(--ok-txt)}
.dial-body h3{font-size:15px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin-bottom:7px}
.dial-body p{font-size:13px;color:var(--dim);line-height:1.45}
.dial-body strong{color:var(--vino)}
.dial-footer{display:flex;gap:9px;padding:13px 16px;border-top:1px solid var(--borde);background:var(--crema)}
.dial-form{padding:16px;display:flex;flex-direction:column;gap:14px}
/* info fija lote */
.info-fija{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--borde);border-radius:9px;overflow:hidden;margin:0 16px}
.if-item{padding:9px 13px;border-right:1px solid var(--borde);border-bottom:1px solid var(--borde)}
.if-item:nth-child(even){border-right:none}
.if-item:nth-last-child(-n+2){border-bottom:none}
.if-lbl{font-size:10px;color:var(--dim);margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em}
.if-val{font-size:13px;font-weight:700;color:var(--txt)}
.if-val--lote{font-family:monospace;color:#7a1f45}
/* campos diálogo */
.campo-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.campo{display:flex;flex-direction:column;gap:4px}
.campo--err .inp{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
.campo-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
.req{color:var(--danger)}
.inp{width:100%;padding:8px 10px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;transition:border-color .14s;box-sizing:border-box}
.inp:focus{border-color:var(--vino);box-shadow:0 0 0 3px var(--vino-g)}
.prefix-w{position:relative;display:flex;align-items:center}
.prefix{position:absolute;left:9px;font-size:12px;font-weight:600;color:var(--mid);pointer-events:none}
.inp--pfx{padding-left:30px}
.err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px}
.err-msg::before{content:'⚠';font-size:10px}
.alerta-err{display:flex;align-items:flex-start;gap:9px;padding:10px 13px;background:var(--db);border:1px solid var(--dbd);border-radius:var(--r)}
.alerta-err__ico{width:18px;height:18px;background:var(--dbd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--danger);flex-shrink:0}
.alerta-err__txt{font-size:12px;color:#9f3a2e;line-height:1.4;margin:0}
/* botones */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 15px;border-radius:var(--r);border:none;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .14s,transform .1s;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-pri{background:var(--vino);color:#fff;flex:1;justify-content:center}.btn-pri:hover:not(:disabled){background:var(--vino-h)}
.btn-sec{background:#fff;color:var(--mid);border:1px solid var(--borde);flex:1;justify-content:center}.btn-sec:hover:not(:disabled){border-color:#ddd4cd}
.btn-warn{background:var(--warn);color:#fff;flex:1;justify-content:center}.btn-warn:hover:not(:disabled){background:#d97706}
.btn-ok{background:#16a34a;color:#fff;flex:1;justify-content:center}.btn-ok:hover:not(:disabled){background:#15803d}
.spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
@media(max-width:520px){.campo-g{grid-template-columns:1fr}.info-fija{grid-template-columns:1fr}.if-item{border-right:none}}
  `],
})
export class InsumoDetalleLotesComponent implements OnInit, OnDestroy {

  @Input({ required: true }) insumo!: InsumoListadoDTO;
  @Output() cerrar = new EventEmitter<void>();
  @Output() cambio = new EventEmitter<void>();

  lotes = signal<InsumoLoteDTO[]>([]);
  cargandoLotes = signal<boolean>(false);
  procesando = signal<boolean>(false);
  guardandoLote = signal<boolean>(false);
  toastMsg = signal<string | null>(null);
  toastErr = signal<boolean>(false);
  loteDesact = signal<InsumoLoteDTO | null>(null);
  loteAct = signal<InsumoLoteDTO | null>(null);
  loteEditando = signal<InsumoLoteDTO | null>(null);
  errorLote = signal<string | null>(null);
  paginaNum = signal<number>(1);
  // ── Sub-modal: nuevo lote ─────────────────────────────────────────────────
  mostrarNuevoLote = signal<boolean>(false);
  guardandoNuevo = signal<boolean>(false);
  errorNuevoLote = signal<string | null>(null);
  formNuevoLote!: FormGroup;

  formLote!: FormGroup;

  paginaActual = computed(() => {
    const inicio = (this.paginaNum() - 1) * POR_PAGINA;
    return this.lotes().slice(inicio, inicio + POR_PAGINA);
  });
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.lotes().length / POR_PAGINA)));
  pageArr = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  get errDispLote(): boolean {
    return !!this.formLote?.errors?.['superaInicial'] && this.formLote?.get('cantidadDisponible')!.touched;
  }

  private destroy$ = new Subject<void>();
  private toastTimer: any = null;

  constructor(private fb: FormBuilder, private svc: InsumoService) { }

  ngOnInit(): void { this.cargarLotes(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); if (this.toastTimer) clearTimeout(this.toastTimer); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.procesando() && !this.guardandoLote()) this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.procesando() && !this.guardandoLote()) this.cerrar.emit();
  }

  cargarLotes(): void {
    this.cargandoLotes.set(true);
    this.svc.obtenerLotesPorInsumo(this.insumo.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoLotes.set(false)))
      .subscribe({ next: d => this.lotes.set(d), error: (e: Error) => this.showToast(e.message, true) });
  }

  abrirNuevoLote(): void {
    // Abre el sub-modal de nuevo lote SIN cerrar el modal de detalle
    this.errorNuevoLote.set(null);
    this.formNuevoLote = this.fb.group({
      cantidadInicial: [null, [Validators.required, Validators.min(0.01)]],
      cantidadDisponible: [null, [Validators.required, Validators.min(0.01)]],
      costoUnitario: [null, [Validators.required, Validators.min(0.01)]],
      fechaVencimiento: [null],
    }, { validators: validarDisp() });
    this.mostrarNuevoLote.set(true);
  }

  get errDispNuevo(): boolean {
    return !!this.formNuevoLote?.errors?.['superaInicial']
      && this.formNuevoLote?.get('cantidadDisponible')!.touched;
  }

  submitNuevoLote(): void {
    this.formNuevoLote.markAllAsTouched();
    if (this.formNuevoLote.invalid) return;
    this.errorNuevoLote.set(null);
    this.guardandoNuevo.set(true);
    const f = this.formNuevoLote.value;
    this.svc.insertarLote({
      idInsumo: this.insumo.id,
      nombre: '',
      idUnidadMedida: 0,
      cantidadInicial: +f.cantidadInicial,
      cantidadDisponible: +f.cantidadDisponible,
      costoUnitario: +f.costoUnitario,
      fechaVencimiento: f.fechaVencimiento ? new Date(f.fechaVencimiento).toISOString() : null,
    })
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardandoNuevo.set(false)))
      .subscribe({
        next: (idLote) => {
          this.mostrarNuevoLote.set(false);
          this.cargarLotes();          // recarga la tabla de lotes
          this.cambio.emit();          // notifica al padre para actualizar stockDisponible
          this.showToast(`Nuevo lote LOT-${String(idLote).padStart(6, '0')} creado correctamente.`, false);
        },
        error: (e: Error) => this.errorNuevoLote.set(e.message),
      });
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) this.paginaNum.set(p);
  }

  // ── Desactivar lote ────────────────────────────────────────────────────────
  iniciarDesactivarLote(lote: InsumoLoteDTO): void {
    if (lote.cantidadDisponible > 0) {
      this.showToast(`No puedes desactivar el lote "${lote.numeroLote}" porque tiene stock disponible (${lote.cantidadDisponible}). Debe estar en 0.`, true);
      return;
    }
    this.loteDesact.set(lote);
  }

  confirmarDesactivarLote(): void {
    const lote = this.loteDesact();
    if (!lote) return;
    this.procesando.set(true);
    this.svc.desactivarLote(lote.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => { this.loteDesact.set(null); this.cargarLotes(); this.cambio.emit(); this.showToast(`Lote "${lote.numeroLote}" desactivado.`, false); },
        error: (e: Error) => { this.loteDesact.set(null); this.showToast(e.message, true); },
      });
  }

  // ── Activar lote ──────────────────────────────────────────────────────────
  iniciarActivarLote(lote: InsumoLoteDTO): void { this.loteAct.set(lote); }

  confirmarActivarLote(): void {
    const lote = this.loteAct();
    if (!lote) return;
    this.procesando.set(true);
    this.svc.activarLote(lote.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => { this.loteAct.set(null); this.cargarLotes(); this.cambio.emit(); this.showToast(`Lote "${lote.numeroLote}" activado.`, false); },
        error: (e: Error) => { this.loteAct.set(null); this.showToast(e.message, true); },
      });
  }

  // ── Editar lote ──────────────────────────────────────────────────────────
  abrirEditarLote(lote: InsumoLoteDTO): void {
    this.loteEditando.set(lote);
    this.errorLote.set(null);
    this.formLote = this.fb.group({
      cantidadInicial: [lote.cantidadInicial, [Validators.required, Validators.min(0.01)]],
      cantidadDisponible: [lote.cantidadDisponible, [Validators.required, Validators.min(0)]],
      costoUnitario: [lote.costoUnitario, [Validators.required, Validators.min(0.01)]],
      fechaVencimiento: [lote.fechaVencimiento ? lote.fechaVencimiento.split('T')[0] : null],
    }, { validators: validarDisp() });
  }

  submitLote(): void {
    this.formLote.markAllAsTouched();
    if (this.formLote.invalid) return;
    this.errorLote.set(null);
    this.guardandoLote.set(true);
    const f = this.formLote.value;
    const lote = this.loteEditando()!;
    this.svc.actualizarLote(lote, {
      cantidadInicial: +f.cantidadInicial,
      cantidadDisponible: +f.cantidadDisponible,
      costoUnitario: +f.costoUnitario,
      fechaVencimiento: f.fechaVencimiento ? new Date(f.fechaVencimiento).toISOString() : null,
    })
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardandoLote.set(false)))
      .subscribe({
        next: () => { this.loteEditando.set(null); this.cargarLotes(); this.cambio.emit(); this.showToast(`Lote "${lote.numeroLote}" actualizado correctamente.`, false); },
        error: (e: Error) => this.errorLote.set(e.message),
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  estadoVenc(lote: InsumoLoteDTO): string {
    if (!lote.fechaVencimiento) return 'sin-fecha';
    const dias = Math.floor((new Date(lote.fechaVencimiento).getTime() - Date.now()) / 86400000);
    if (dias < 0) return 'vencido';
    if (dias <= 30) return 'proximo';
    return 'ok';
  }
  claseVenc(lote: InsumoLoteDTO): string {
    const ev = this.estadoVenc(lote);
    if (ev === 'vencido') return 'v-venc';
    if (ev === 'proximo') return 'v-prox';
    return 'v-ok';
  }
  diasVenc(fecha: string): number { return Math.floor((new Date(fecha).getTime() - Date.now()) / 86400000); }
  fmtFecha(f: string): string { return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

  errL(c: string): boolean { const x = this.formLote?.get(c); return !!(x?.invalid && x?.touched); }
  errMsgL(c: string): string {
    const e = this.formLote?.get(c)?.errors;
    if (!e) return '';
    if (e['required']) return 'Obligatorio.';
    if (e['min']) return `Mínimo ${e['min'].min}.`;
    return 'Inválido.';
  }

  errNL(c: string): boolean { const x = this.formNuevoLote?.get(c); return !!(x?.invalid && x?.touched); }
  errMsgNL(c: string): string {
    const e = this.formNuevoLote?.get(c)?.errors;
    if (!e) return '';
    if (e['required']) return 'Obligatorio.';
    if (e['min']) return `Mínimo ${e['min'].min}.`;
    return 'Inválido.';
  }

  showToast(msg: string, isErr: boolean): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg.set(msg);
    this.toastErr.set(isErr);
    this.toastTimer = setTimeout(() => this.toastMsg.set(null), 4500);
  }
}
