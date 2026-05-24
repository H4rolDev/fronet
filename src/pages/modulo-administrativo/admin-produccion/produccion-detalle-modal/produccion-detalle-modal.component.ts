/**
 * @file produccion-detalle-modal.component.ts
 * @description Modal de solo lectura para ver el detalle de una producción.
 * Muestra: info de la torta (imagen, categoría, stock, precio) +
 *          header de la producción + tabla de insumos usados.
 */

import {
  Component, OnInit, OnDestroy,
  Input, Output, EventEmitter, HostListener, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';


const ESTILOS_DET = `
:host{--vino:#550F26;--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--ok-bg:#f0faf4;--ok-bd:#bbf7d0;--ok-txt:#166534;--info-bg:#e6f1fb;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
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
/* Torta card */
.torta-card{display:flex;gap:14px;padding:16px 18px;background:var(--crema);border-bottom:1px solid var(--borde)}
.torta-img{width:64px;height:64px;border-radius:10px;background:#f0e4de;border:1px solid #e8d0c8;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.torta-img img{width:100%;height:100%;object-fit:cover;border-radius:10px}
.torta-img svg{width:28px;height:28px;fill:none;stroke:#c8906a;stroke-width:1.4}
.torta-nombre{font-size:15px;font-weight:700;font-family:Georgia,serif;color:var(--txt)}
.torta-cat{font-size:11px;color:var(--mid);margin-top:2px}
.torta-chips{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}
.chip{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px}
.chip-stock{background:var(--ok-bg);color:var(--ok-txt);border:1px solid var(--ok-bd)}
.chip-precio{background:#fdf0f8;color:#7a1f45;border:1px solid #f5cfe6}
.chip-cant{background:var(--info-bg);color:#185fa5;border:1px solid #b5d4f4}
/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;margin:0;border-bottom:1px solid var(--borde)}
.ig{padding:9px 18px;border-bottom:1px solid var(--borde);border-right:1px solid var(--borde)}
.ig:nth-child(even){border-right:none}
.ig:nth-last-child(-n+2){border-bottom:none}
.ig-l{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.ig-v{font-size:13px;font-weight:700;color:var(--txt)}
/* Tabla insumos */
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:9px 18px;background:#faf8f6;border-bottom:1px solid var(--borde)}
.sec-t{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid)}
.lt{width:100%;border-collapse:collapse;font-size:12px}
.lt th{padding:8px 18px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);border-bottom:1px solid var(--borde)}
.lt th:last-child{text-align:right}
.lt tr{border-bottom:1px solid #f5f1ee}
.lt tr:last-child{border-bottom:none}
.lt td{padding:9px 18px;vertical-align:middle}
.lt td:last-child{text-align:right;font-weight:700;font-family:Georgia,serif;color:#7a1f45}
/* skeleton */
.sk-wrap{padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.sk{display:block;height:13px;border-radius:4px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
@keyframes sh{to{background-position:-200% 0}}
/* footer */
.mf{padding:13px 18px;border-top:1px solid var(--borde);background:var(--crema);display:flex;justify-content:flex-end}
.btn{padding:8px 16px;border-radius:var(--r);border:1px solid var(--borde);background:#fff;color:var(--mid);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.btn:hover{border-color:#ddd4cd;color:var(--txt)}
`;

@Component({
  selector: 'app-produccion-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
      <div>
        <h2 class="ph-t">Detalle de Producción #{{ cabecera.id }}</h2>
        <p class="ph-s">{{ formatFecha(cabecera.fechaProduccion) }} · {{ cabecera.usuarioCreacion }}</p>
      </div>
    </div>
    <button class="px" (click)="cerrar.emit()">✕</button>
  </header>

  <div class="body">
    @if (cargando()) {
      <div class="sk-wrap">
        <div class="sk" style="height:64px;width:100%;border-radius:10px"></div>
        <div class="sk" style="width:70%"></div>
        <div class="sk" style="width:50%"></div>
        <div class="sk" style="width:80%"></div>
        <div class="sk" style="width:60%"></div>
      </div>
    } @else {

      <!-- Card de la torta -->
      <div class="torta-card">
        <div class="torta-img">
          @if (torta()?.imagenUrl) {
            <img [src]="torta()!.imagenUrl" [alt]="torta()!.nombre" />
          } @else {
            <svg viewBox="0 0 24 24"><path d="M12 2C8 6 4 8 4 12h16c0-4-4-6-8-10z"/><rect x="2" y="12" width="20" height="4" rx="1"/><rect x="4" y="16" width="16" height="5" rx="1"/></svg>
          }
        </div>
        <div>
          <div class="torta-nombre">{{ cabecera.nombreTorta }}</div>
          <div class="torta-cat">{{ categoria()?.nombre ?? 'Sin categoría' }}</div>
          <div class="torta-chips">
            @if (torta()) {
              <span class="chip chip-stock">Stock: {{ torta()!.stockDisponible }}</span>
              @if (torta()!.precioVenta) {
                <span class="chip chip-precio">S/. {{ torta()!.precioVenta!.toFixed(2) }}</span>
              }
            }
            <span class="chip chip-cant">{{ cabecera.cantidadProducida }} producidas</span>
          </div>
        </div>
      </div>

      <!-- Info de la producción -->
      <div class="info-grid">
        <div class="ig"><div class="ig-l">Fecha</div><div class="ig-v">{{ formatFecha(cabecera.fechaProduccion) }}</div></div>
        <div class="ig"><div class="ig-l">Cantidad</div><div class="ig-v">{{ cabecera.cantidadProducida }} unidades</div></div>
        <div class="ig"><div class="ig-l">Usuario</div><div class="ig-v">{{ cabecera.usuarioCreacion }}</div></div>
        <div class="ig"><div class="ig-l">Observación</div><div class="ig-v">{{ cabecera.observacion || 'Sin observación' }}</div></div>
      </div>

      <!-- Tabla de insumos usados -->
      <div class="sec-hdr">
        <span class="sec-t">Insumos utilizados</span>
        <span style="font-size:11px;color:var(--mid)">{{ detalles().length }} insumos</span>
      </div>
      <table class="lt">
        <thead><tr><th>Insumo</th><th>Cant. usada</th></tr></thead>
        <tbody>
          @if (detalles().length === 0) {
            <tr><td colspan="2" style="padding:16px;text-align:center;color:var(--dim);font-size:12px">Sin detalle disponible</td></tr>
          } @else {
            @for (d of detalles(); track d.idInsumo) {
              <tr>
                <td>{{ d.nombreInsumo }}</td>
                <td>{{ d.cantidadUsada }} {{ d.unidadMedida ?? '' }}</td>
              </tr>
            }
          }
        </tbody>
      </table>
    }
  </div>

  <div class="mf">
    <button class="btn" (click)="cerrar.emit()">Cerrar</button>
  </div>
</div>
</div>`,
  styles: [ESTILOS_DET],
})
export class ProduccionDetalleModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) cabecera!: ProduccionCabeceraDTO;
  @Output() cerrar = new EventEmitter<void>();

  cargando  = signal<boolean>(false);
  torta     = signal<TortaDetalleDTO | null>(null);
  categoria = signal<CategoriaTortaDTO | null>(null);
  detalles  = signal<ProduccionDetalleInsumoDTO[]>([]);

  private destroy$ = new Subject<void>();

  constructor(private svc: ProduccionService) {}

  ngOnInit(): void {
    this.cargando.set(true);
    forkJoin({
      detalle: this.svc.obtenerDetalle(this.cabecera.id),
      torta:   this.svc.obtenerTortaPorId(this.cabecera.idTorta),
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
    .subscribe({
      next: ({ detalle, torta }) => {
        this.detalles.set(detalle);
        this.torta.set(torta);
        // Cargar categoría una vez que tenemos la torta
        if (torta.idCategoriaTorta) {
          this.svc.obtenerCategoria(torta.idCategoriaTorta)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: c => this.categoria.set(c), error: () => {} });
        }
      },
      error: () => {},
    });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.cerrar.emit();
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    const p = f.split('T')[0].split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODAL AJUSTE INSUMO
// ═══════════════════════════════════════════════════════════════════════════════

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

const ESTILOS_AJUSTE = `
:host{--vino:#550F26;--teal:#0f6e56;--teal-h:#085041;--amber:#854f0b;--amber-h:#633806;--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--borde);background:var(--crema)}
.ph-l{display:flex;align-items:center;gap:10px}
.ph-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ph-ico svg{width:14px;height:14px}
.ph-t{font-size:14px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.ph-s{font-size:11px;color:var(--dim);margin:2px 0 0}
.px{width:27px;height:27px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.px:hover:not(:disabled){background:var(--db);border-color:var(--dbd);color:var(--danger)}
.px:disabled{opacity:.4;cursor:not-allowed}
.body{padding:18px;display:flex;flex-direction:column;gap:14px}
.footer{display:flex;justify-content:flex-end;gap:10px;padding:13px 18px;border-top:1px solid var(--borde);background:var(--crema)}
/* toggle entrada/salida */
.toggle{display:flex;border:1px solid var(--borde);border-radius:var(--r);overflow:hidden;background:#faf8f6}
.t-btn{flex:1;padding:8px 12px;background:transparent;border:none;font-size:12px;font-weight:600;color:var(--mid);cursor:pointer;font-family:inherit;transition:background .12s,color .12s;display:flex;align-items:center;justify-content:center;gap:5px}
.t-btn:first-child{border-right:1px solid var(--borde)}
.t-btn--on-teal{background:var(--teal);color:#fff}
.t-btn--on-amber{background:var(--amber);color:#fff}
/* campos */
.campo{display:flex;flex-direction:column;gap:5px}
.campo-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.campo--err .inp,.campo--err .sel{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
.lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
.req{color:var(--danger)}
.inp,.sel{width:100%;padding:9px 11px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;-webkit-appearance:none;transition:border-color .14s;box-sizing:border-box}
.inp::placeholder{color:var(--dim);font-size:12px}
.inp:focus,.sel:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(15,110,86,.12)}
.inp:disabled,.sel:disabled{opacity:.5;cursor:not-allowed;background:#faf8f6}
.sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
.err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px}
.err-msg::before{content:'⚠';font-size:10px}
.alerta-err{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;background:var(--db);border:1px solid var(--dbd);border-radius:var(--r)}
.ae-ico{width:19px;height:19px;background:var(--dbd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--danger);flex-shrink:0}
.ae-txt{font-size:12px;color:#9f3a2e;line-height:1.45;margin:0}
.sk-c{display:flex;flex-direction:column;gap:6px}
.sk{display:block;border-radius:5px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
.sk-l{height:11px;width:60px}.sk-i{height:40px;width:100%}
@keyframes sh{to{background-position:-200% 0}}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r);border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .14s,transform .1s;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-teal{background:var(--teal);color:#fff}.btn-teal:hover:not(:disabled){background:var(--teal-h)}
.btn-amber{background:var(--amber);color:#fff}.btn-amber:hover:not(:disabled){background:var(--amber-h)}
.btn-sec{background:#fff;color:var(--mid);border:1px solid var(--borde)}.btn-sec:hover:not(:disabled){border-color:#ddd4cd;color:var(--txt)}
.spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
`;

@Component({
  selector: 'app-produccion-ajuste-insumo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico" style="background:#0f6e56"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>
      <div><h2 class="ph-t">Ajuste de Insumo</h2><p class="ph-s">Corrección manual del stock de un insumo</p></div>
    </div>
    <button class="px" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
  </header>

  @if (cargando()) {
    <div class="body">
      @for (i of [1,2,3]; track i) { <div class="sk-c"><span class="sk sk-l"></span><span class="sk sk-i"></span></div> }
    </div>
  }

  @if (!cargando()) {
  <div class="body" [formGroup]="form">
    <!-- Toggle entrada / salida -->
    <div class="toggle">
      <button type="button" class="t-btn" [class.t-btn--on-teal]="esEntrada()" (click)="setEntrada(true)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Entrada (suma)
      </button>
      <button type="button" class="t-btn" [class.t-btn--on-amber]="!esEntrada()" (click)="setEntrada(false)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Salida (resta)
      </button>
    </div>

    <div class="campo" [class.campo--err]="err('idInsumo')">
      <label class="lbl" for="ai-ins">Insumo <span class="req">*</span></label>
      <select id="ai-ins" class="sel" formControlName="idInsumo">
        <option [ngValue]="null">— Seleccionar —</option>
        @for (i of insumos(); track i.id) {
          <option [ngValue]="i.id">{{ i.nombre }} · Stock: {{ i.stockDisponible }} {{ i.abreviatura }}</option>
        }
      </select>
      @if (err('idInsumo')) { <p class="err-msg">Selecciona un insumo.</p> }
    </div>

    <div class="campo-g">
      <div class="campo" [class.campo--err]="err('cantidad')">
        <label class="lbl" for="ai-cant">Cantidad <span class="req">*</span></label>
        <input id="ai-cant" type="number" class="inp" formControlName="cantidad" placeholder="0" min="0.01" step="0.01" [style.border-color]="esEntrada() ? '#0f6e56' : '#854f0b'" />
        @if (err('cantidad')) { <p class="err-msg">{{ errMsg('cantidad') }}</p> }
      </div>
      <div class="campo">
        <label class="lbl" for="ai-obs">Observación</label>
        <input id="ai-obs" type="text" class="inp" formControlName="observacion" placeholder="Motivo del ajuste..." />
      </div>
    </div>

    @if (errorApi()) {
      <div class="alerta-err" role="alert"><div class="ae-ico">✕</div><p class="ae-txt">{{ errorApi() }}</p></div>
    }
  </div>
  <footer class="footer">
    <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
    <button type="button" [class]="esEntrada() ? 'btn btn-teal' : 'btn btn-amber'" (click)="submit()" [disabled]="guardando()">
      @if (guardando()) { <span class="spinner"></span> Aplicando... } @else { Aplicar ajuste }
    </button>
  </footer>
  }
</div>
</div>`,
  styles: [ESTILOS_AJUSTE],
})
export class ProduccionAjusteInsumoComponent implements OnInit, OnDestroy {

  @Output() cerrar   = new EventEmitter<void>();
  @Output() ajustado = new EventEmitter<string>();

  cargando  = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorApi  = signal<string | null>(null);
  esEntrada = signal<boolean>(true);
  insumos   = signal<InsumoComboDTO[]>([]);
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private svc: ProduccionService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      idInsumo:    [null, [Validators.required, Validators.min(1)]],
      cantidad:    [null, [Validators.required, Validators.min(0.01)]],
      observacion: [null],
    });
    this.cargando.set(true);
    this.svc.obtenerComboInsumos()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({ next: d => this.insumos.set(d.filter(i => i.activo)), error: (e: Error) => this.errorApi.set(e.message) });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  setEntrada(v: boolean): void { this.esEntrada.set(v); this.errorApi.set(null); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.errorApi.set(null);
    this.guardando.set(true);
    const f = this.form.value;
    const ins = this.insumos().find(i => i.id === +f.idInsumo);
    this.svc.ajustarInsumo({ idInsumo: +f.idInsumo, cantidad: +f.cantidad, esEntrada: this.esEntrada(), observacion: f.observacion })
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => this.ajustado.emit(`Ajuste de ${this.esEntrada() ? 'entrada' : 'salida'} de ${f.cantidad} aplicado a "${ins?.nombre}".`),
        error: (e: Error) => this.errorApi.set(e.message),
      });
  }

  err(c: string): boolean { const x = this.form.get(c); return !!(x?.invalid && x?.touched); }
  errMsg(c: string): string {
    const e = this.form.get(c)?.errors;
    if (!e) return '';
    if (e['required']) return 'Obligatorio.'; if (e['min']) return `Mínimo ${e['min'].min}.`; return 'Inválido.';
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODAL AJUSTE TORTA
// ═══════════════════════════════════════════════════════════════════════════════

import { CategoriaTortaDTO, InsumoComboDTO, ProduccionCabeceraDTO, ProduccionDetalleInsumoDTO, TortaComboDTO, TortaDetalleDTO } from '../../../../models/produccion-dto';
import { ProduccionService } from '../../../../services/produccion.service';
import { TortaListadoDTO } from '../../../../models/torta-dto';

@Component({
  selector: 'app-produccion-ajuste-torta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico" style="background:#854f0b"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M12 2C8 6 4 8 4 12h16c0-4-4-6-8-10z"/><rect x="2" y="12" width="20" height="4" rx="1"/><rect x="4" y="16" width="16" height="5" rx="1"/></svg></div>
      <div><h2 class="ph-t">Ajuste de Torta</h2><p class="ph-s">Corrección manual del stock de una torta</p></div>
    </div>
    <button class="px" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
  </header>

  @if (cargando()) {
    <div class="body">
      @for (i of [1,2,3]; track i) { <div class="sk-c"><span class="sk sk-l"></span><span class="sk sk-i"></span></div> }
    </div>
  }

  @if (!cargando()) {
  <div class="body" [formGroup]="form">
    <div class="toggle">
      <button type="button" class="t-btn" [class.t-btn--on-teal]="esEntrada()" (click)="setEntrada(true)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Entrada (suma)
      </button>
      <button type="button" class="t-btn" [class.t-btn--on-amber]="!esEntrada()" (click)="setEntrada(false)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Salida (resta)
      </button>
    </div>

    <div class="campo" [class.campo--err]="err('idTorta')">
      <label class="lbl" for="at-t">Torta <span class="req">*</span></label>
      <select id="at-t" class="sel" formControlName="idTorta">
        <option [ngValue]="null">— Seleccionar —</option>
        @for (t of tortas(); track t.id) {
          <option [ngValue]="t.id">{{ t.nombre }} · Stock: {{ t.stockDisponible }}</option>
        }
      </select>
      @if (err('idTorta')) { <p class="err-msg">Selecciona una torta.</p> }
    </div>

    <div class="campo-g">
      <div class="campo" [class.campo--err]="err('cantidad')">
        <label class="lbl" for="at-cant">Cantidad <span class="req">*</span></label>
        <input id="at-cant" type="number" class="inp" formControlName="cantidad" placeholder="0" min="1" step="1" />
        @if (err('cantidad')) { <p class="err-msg">{{ errMsg('cantidad') }}</p> }
      </div>
      <div class="campo">
        <label class="lbl" for="at-obs">Observación</label>
        <input id="at-obs" type="text" class="inp" formControlName="observacion" placeholder="Motivo del ajuste..." />
      </div>
    </div>

    @if (errorApi()) {
      <div class="alerta-err" role="alert"><div class="ae-ico">✕</div><p class="ae-txt">{{ errorApi() }}</p></div>
    }
  </div>
  <footer class="footer">
    <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
    <button type="button" [class]="esEntrada() ? 'btn btn-teal' : 'btn btn-amber'" (click)="submit()" [disabled]="guardando()">
      @if (guardando()) { <span class="spinner"></span> Aplicando... } @else { Aplicar ajuste }
    </button>
  </footer>
  }
</div>
</div>`,
  styles: [ESTILOS_AJUSTE],
})
export class ProduccionAjusteTortaComponent implements OnInit, OnDestroy {

  @Output() cerrar   = new EventEmitter<void>();
  @Output() ajustado = new EventEmitter<string>();

  cargando  = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorApi  = signal<string | null>(null);
  esEntrada = signal<boolean>(true);
  tortas    = signal<TortaComboDTO[]>([]);
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private svc: ProduccionService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      idTorta:     [null, [Validators.required, Validators.min(1)]],
      cantidad:    [null, [Validators.required, Validators.min(1)]],
      observacion: [null],
    });
    this.cargando.set(true);
    this.svc.obtenerComboTortas()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({ next: t => this.tortas.set(t), error: (e: Error) => this.errorApi.set(e.message) });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  setEntrada(v: boolean): void { this.esEntrada.set(v); this.errorApi.set(null); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.errorApi.set(null);
    this.guardando.set(true);
    const f = this.form.value;
    const torta = this.tortas().find(t => t.id === +f.idTorta);
    this.svc.ajustarTorta({ idTorta: +f.idTorta, cantidad: +f.cantidad, esEntrada: this.esEntrada(), observacion: f.observacion })
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => this.ajustado.emit(`Ajuste de ${this.esEntrada() ? 'entrada' : 'salida'} de ${f.cantidad} aplicado a "${torta?.nombre}".`),
        error: (e: Error) => this.errorApi.set(e.message),
      });
  }

  err(c: string): boolean { const x = this.form.get(c); return !!(x?.invalid && x?.touched); }
  errMsg(c: string): string {
    const e = this.form.get(c)?.errors;
    if (!e) return '';
    if (e['required']) return 'Obligatorio.'; if (e['min']) return `Mínimo ${e['min'].min}.`; return 'Inválido.';
  }
}
