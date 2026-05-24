/**
 * @file produccion-crear-modal.component.ts
 * @description Modal para crear una nueva producción.
 *
 * Flujo:
 *  1. Cargar combo de tortas (con su stock actual)
 *  2. Al seleccionar torta → cargar receta + calcular insumos totales para N unidades
 *  3. Mostrar preview de insumos necesarios (multiplicados por cantidad)
 *  4. Si el backend rechaza por stock insuficiente → mostrar error exacto
 *  5. Al éxito → emitir (creado) con mensaje
 *
 * ⚠️ El backend valida stock FIFO por vencimiento — el frontend solo muestra la receta
 * como orientación visual, no hace la validación real.
 */

import {
  Component, OnInit, OnDestroy,
  Output, EventEmitter, HostListener, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize, switchMap } from 'rxjs/operators';
import { RecetaTortaItemDTO, TortaComboDTO } from '../../../../models/produccion-dto';
import { ProduccionService } from '../../../../services/produccion.service';


const ESTILOS_MODAL = `
:host{--vino:#550F26;--vino-h:#6d1430;--vino-g:rgba(85,15,38,.12);--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88) translateY(12px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.ph{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;border-bottom:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.ph-l{display:flex;align-items:center;gap:11px}
.ph-ico{width:33px;height:33px;background:var(--vino);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ph-ico svg{width:14px;height:14px}
.ph-t{font-size:14px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.ph-s{font-size:11px;color:var(--dim);margin:2px 0 0}
.px{width:27px;height:27px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.px:hover:not(:disabled){background:var(--db);border-color:var(--dbd);color:var(--danger)}
.px:disabled{opacity:.4;cursor:not-allowed}
.body{padding:20px;display:flex;flex-direction:column;gap:15px;overflow-y:auto;flex:1}
.body::-webkit-scrollbar{width:5px}.body::-webkit-scrollbar-thumb{background:var(--borde);border-radius:3px}
.footer{display:flex;justify-content:flex-end;gap:10px;padding:13px 20px;border-top:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.campo{display:flex;flex-direction:column;gap:5px}
.campo-g{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.campo--err .inp,.campo--err .sel{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
.lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
.req{color:var(--danger)}
.inp,.sel{width:100%;padding:9px 11px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;-webkit-appearance:none;transition:border-color .14s;box-sizing:border-box}
.inp::placeholder{color:var(--dim);font-size:12px}
.inp:focus,.sel:focus{border-color:var(--vino);box-shadow:0 0 0 3px var(--vino-g)}
.inp:disabled,.sel:disabled{opacity:.5;cursor:not-allowed;background:#faf8f6}
.sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
.hint{font-size:11px;color:var(--dim)}
.err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px;animation:ei .15s ease}
.err-msg::before{content:'⚠';font-size:10px}
@keyframes ei{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
/* Receta preview */
.receta-box{background:var(--crema);border:1px solid var(--borde);border-radius:var(--r);overflow:hidden}
.receta-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 13px;border-bottom:1px solid var(--borde);background:rgba(85,15,38,.04)}
.receta-titulo{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mid)}
.receta-total{font-size:11px;color:var(--mid)}
.receta-fila{display:flex;justify-content:space-between;align-items:center;padding:7px 13px;border-bottom:1px solid var(--borde);font-size:12px}
.receta-fila:last-child{border-bottom:none}
.receta-insumo{font-weight:600;color:var(--txt)}
.receta-cant{color:#7a1f45;font-weight:700;background:#fdf0f8;padding:2px 7px;border-radius:4px;font-size:11px;font-family:monospace}
.receta-empty{padding:12px 13px;font-size:12px;color:var(--dim);text-align:center}
/* torta stock chip */
.stock-ok{font-size:11px;font-weight:600;color:#166534;background:#f0faf4;padding:2px 7px;border-radius:4px;margin-left:6px}
.stock-warn{font-size:11px;font-weight:600;color:#92400e;background:#fffbeb;padding:2px 7px;border-radius:4px;margin-left:6px}
/* Alerta API */
.alerta-err{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;background:var(--db);border:1px solid var(--dbd);border-radius:var(--r)}
.ae-ico{width:19px;height:19px;background:var(--dbd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--danger);flex-shrink:0}
.ae-txt{font-size:12px;color:#9f3a2e;line-height:1.45;margin:0}
/* Skeleton */
.sk-c{display:flex;flex-direction:column;gap:6px}
.sk{display:block;border-radius:5px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
.sk-l{height:11px;width:60px}.sk-i{height:40px;width:100%}
@keyframes sh{to{background-position:-200% 0}}
/* Botones */
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r);border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .14s,transform .1s;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-pri{background:var(--vino);color:#fff}.btn-pri:hover:not(:disabled){background:var(--vino-h)}
.btn-sec{background:#fff;color:var(--mid);border:1px solid var(--borde)}.btn-sec:hover:not(:disabled){border-color:#ddd4cd;color:var(--txt)}
.spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
@media(max-width:480px){.overlay{align-items:flex-end;padding:0}.panel{border-radius:16px 16px 0 0;max-height:95vh}.campo-g{grid-template-columns:1fr}.footer{flex-direction:column-reverse}.btn{width:100%;justify-content:center}}
`;

@Component({
  selector: 'app-produccion-crear-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="overlay" (click)="onOverlay($event)">
<div class="panel">
  <header class="ph">
    <div class="ph-l">
      <div class="ph-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
      <div><h2 class="ph-t">Nueva Producción</h2><p class="ph-s">El stock de insumos se descontará automáticamente</p></div>
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

    <!-- Selección de torta -->
    <div class="campo" [class.campo--err]="err('idTorta')">
      <label class="lbl" for="p-torta">Torta <span class="req">*</span></label>
      <select id="p-torta" class="sel" formControlName="idTorta" (change)="onTortaCambio()">
        <option [ngValue]="null">— Seleccionar torta —</option>
        @for (t of tortas(); track t.id) {
          <option [ngValue]="t.id">{{ t.nombre }}</option>
        }
      </select>
      @if (tortaSeleccionada()) {
        <div style="margin-top:5px;display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;color:var(--mid)">Stock actual:</span>
          <span [class]="tortaSeleccionada()!.stockDisponible > 0 ? 'stock-ok' : 'stock-warn'">
            {{ tortaSeleccionada()!.stockDisponible }} unidades
          </span>
        </div>
      }
      @if (err('idTorta')) { <p class="err-msg">Selecciona una torta.</p> }
    </div>

    <!-- Preview de receta -->
    <div class="receta-box">
      <div class="receta-hdr">
        <span class="receta-titulo">Receta · insumos necesarios</span>
        <span class="receta-total">para {{ form.get('cantidadProducida')?.value || 1 }} unidad(es)</span>
      </div>
      @if (cargandoReceta()) {
        <div class="receta-empty">Cargando receta...</div>
      } @else if (receta().length === 0) {
        <div class="receta-empty">
          {{ form.get('idTorta')?.value ? 'Esta torta no tiene receta.' : 'Selecciona una torta para ver su receta.' }}
        </div>
      } @else {
        @for (item of recetaCalculada(); track item.idInsumo) {
          <div class="receta-fila">
            <span class="receta-insumo">{{ item.nombreInsumo }}</span>
            <span class="receta-cant">{{ item.cantidadTotal }} {{ item.unidadMedida }}</span>
          </div>
        }
      }
    </div>

    <!-- Cantidad + Observación -->
    <div class="campo-g">
      <div class="campo" [class.campo--err]="err('cantidadProducida')">
        <label class="lbl" for="p-cant">Cantidad a producir <span class="req">*</span></label>
        <input id="p-cant" type="number" class="inp" formControlName="cantidadProducida" placeholder="1" min="1" step="1" (input)="onCantidadCambio()" />
        @if (err('cantidadProducida')) { <p class="err-msg">{{ errMsg('cantidadProducida') }}</p> }
      </div>
      <div class="campo">
        <label class="lbl" for="p-obs">Observación</label>
        <input id="p-obs" type="text" class="inp" formControlName="observacion" placeholder="Opcional..." maxlength="300" />
      </div>
    </div>

    @if (errorApi()) {
      <div class="alerta-err" role="alert"><div class="ae-ico">✕</div><p class="ae-txt">{{ errorApi() }}</p></div>
    }
  </div>
  <footer class="footer">
    <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
    <button type="button" class="btn btn-pri" (click)="submit()" [disabled]="guardando() || cargando()">
      @if (guardando()) { <span class="spinner"></span> Registrando... } @else { + Registrar producción }
    </button>
  </footer>
  }
</div>
</div>`,
  styles: [ESTILOS_MODAL],
})
export class ProduccionCrearModalComponent implements OnInit, OnDestroy {

  @Output() cerrar  = new EventEmitter<void>();
  @Output() creado  = new EventEmitter<string>();

  cargando        = signal<boolean>(false);
  cargandoReceta  = signal<boolean>(false);
  guardando       = signal<boolean>(false);
  errorApi        = signal<string | null>(null);
  tortas          = signal<TortaComboDTO[]>([]);
  receta          = signal<RecetaTortaItemDTO[]>([]);
  tortaSeleccionada = signal<TortaComboDTO | null>(null);
  cantidadActual  = signal<number>(1);

  recetaCalculada = computed(() =>
    this.receta().map(r => ({
      ...r,
      cantidadTotal: +(r.cantidadRequerida * this.cantidadActual()).toFixed(3),
    }))
  );

  form!: ReturnType<FormBuilder['group']>;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private svc: ProduccionService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      idTorta:           [null, [Validators.required, Validators.min(1)]],
      cantidadProducida: [1,    [Validators.required, Validators.min(1)]],
      observacion:       [null],
    });
    this.cargarTortas();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  private cargarTortas(): void {
    this.cargando.set(true);
    this.svc.obtenerComboTortas()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({ next: t => this.tortas.set(t), error: (e: Error) => this.errorApi.set(e.message) });
  }

  onTortaCambio(): void {
    const id = this.form.get('idTorta')?.value;
    this.tortaSeleccionada.set(this.tortas().find(t => t.id === +id) ?? null);
    if (!id) { this.receta.set([]); return; }
    this.cargandoReceta.set(true);
    this.svc.obtenerRecetaPorTorta(+id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoReceta.set(false)))
      .subscribe({ next: r => this.receta.set(r), error: () => this.receta.set([]) });
  }

  onCantidadCambio(): void {
    const v = +this.form.get('cantidadProducida')?.value;
    this.cantidadActual.set(isNaN(v) || v < 1 ? 1 : v);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.errorApi.set(null);
    this.guardando.set(true);
    const f = this.form.value;
    this.svc.insertarProduccion({
      idTorta:           +f.idTorta,
      cantidadProducida: +f.cantidadProducida,
      observacion:       f.observacion,
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
    .subscribe({
      next: (id) => this.creado.emit(`Producción #${id} registrada. ${f.cantidadProducida} "${this.tortaSeleccionada()?.nombre}" producidas.`),
      error: (e: Error) => this.errorApi.set(e.message),
    });
  }

  err(c: string): boolean { const x = this.form.get(c); return !!(x?.invalid && x?.touched); }
  errMsg(c: string): string {
    const e = this.form.get(c)?.errors;
    if (!e) return '';
    if (e['required']) return 'Obligatorio.';
    if (e['min'])      return `Mínimo ${e['min'].min}.`;
    return 'Inválido.';
  }
}
