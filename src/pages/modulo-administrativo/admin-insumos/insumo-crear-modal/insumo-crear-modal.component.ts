/**
 * @file insumo-crear-modal.component.ts
 * @description Modal para crear un insumo nuevo con su primer lote,
 *              o agregar un lote a un insumo existente.
 *
 * Flujo A — Insumo nuevo:
 *   nombre + idUnidadMedida → idInsumo = 0 en el payload
 *   El backend valida que no exista otro insumo activo con el mismo nombre.
 *
 * Flujo B — Insumo existente:
 *   Se selecciona de la lista → idInsumo > 0 en el payload
 *   nombre e idUnidadMedida son ignorados por el backend.
 *
 * Campos del lote: cantidadInicial, cantidadDisponible, costoUnitario, fechaVencimiento.
 * Validación cruzada: cantidadDisponible <= cantidadInicial.
 */

import {
  Component, OnInit, OnDestroy,
  Output, EventEmitter, HostListener, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidatorFn,
} from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UnidadMedidaListadoDTO } from '../../../../models/unidad-medida-dto';
import { InsumoListadoDTO } from '../../../../models/insumo-dto';
import { InsumoService } from '../../../../services/insumo.service';
import { UnidadMedidaService } from '../../../../services/unidad-medida.service';


function validarDisponible(): ValidatorFn {
  return (g: AbstractControl) => {
    const ini = +g.get('cantidadInicial')?.value;
    const dis = +g.get('cantidadDisponible')?.value;
    if (!ini || !dis) return null;
    return dis > ini ? { disponibleSuperaInicial: true } : null;
  };
}

@Component({
  selector: 'app-insumo-crear-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="overlay" role="dialog" aria-modal="true" (click)="onOverlay($event)">
<div class="panel">

  <!-- HEADER -->
  <header class="panel__hdr">
    <div class="panel__hdr-l">
      <div class="panel__ico">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <div>
        <h2 class="panel__titulo">Nuevo Insumo</h2>
        <p class="panel__sub">Registra el nombre del insumo. Para agregar stock, usa "Registrar Entrada".</p>
      </div>
    </div>
    <button class="panel__x" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
  </header>

  <!-- SKELETON -->
  @if (cargando()) {
    <div class="panel__body">
      @for (i of [1,2,3]; track i) {
        <div class="sk-campo"><span class="sk sk-lbl"></span><span class="sk sk-inp"></span></div>
      }
    </div>
  }

  @if (!cargando()) {
  <div class="panel__body" [formGroup]="form">

    <!-- Info: solo nuevo insumo -->
    <div class="info-box info-box--primary">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>
      <div>
        <strong>Solo se registra el insumo</strong>
        <p class="info-text">Para agregar stock (cantidad), usa el botón "Registrar Entrada" con su documento de respaldo.</p>
      </div>
    </div>

    <!-- Sección insumo -->
    <div class="sec-titulo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
      {{ modoNuevo() ? 'Datos del insumo' : 'Seleccionar insumo' }}
    </div>

    @if (modoNuevo()) {
      <div class="campo-grid">
        <div class="campo" [class.campo--err]="err('nombre')">
          <label class="campo-lbl" for="c-nom">Nombre <span class="req">*</span></label>
          <input id="c-nom" type="text" class="inp" formControlName="nombre" placeholder="Ej: Vainilla líquida" maxlength="100" />
          @if (err('nombre')) { <p class="err-msg">{{ errMsg('nombre') }}</p> }
        </div>
        <div class="campo" [class.campo--err]="err('idUnidadMedida')">
          <label class="campo-lbl" for="c-um">Unidad de medida <span class="req">*</span></label>
          <select id="c-um" class="sel" formControlName="idUnidadMedida">
            <option [ngValue]="null">— Seleccionar —</option>
            @for (u of unidades(); track u.id) { <option [ngValue]="u.id">{{ u.nombre }}</option> }
          </select>
          @if (err('idUnidadMedida')) { <p class="err-msg">{{ errMsg('idUnidadMedida') }}</p> }
        </div>
      </div>
    } @else {
      <div class="campo full" [class.campo--err]="err('idInsumo')">
        <label class="campo-lbl" for="c-ins">Insumo <span class="req">*</span></label>
        <select id="c-ins" class="sel" formControlName="idInsumo">
          <option [ngValue]="null">— Seleccionar insumo —</option>
          @for (i of insumosActivos(); track i.id) {
            <option [ngValue]="i.id">{{ i.nombre }} · {{ i.nombreUnidadMedida }}</option>
          }
        </select>
        @if (err('idInsumo')) { <p class="err-msg">{{ errMsg('idInsumo') }}</p> }
      </div>
    }

    <!-- Sección lote -->
    <div class="sec-titulo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
      Registro de stock
    </div>
    <div class="info-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <strong>Para registrar stock</strong>
        <p class="info-text">Usa el botón "Registrar Entrada" para agregar cantidades con documento de respaldo.</p>
      </div>
    </div>

    @if (errorApi()) {
      <div class="alerta-err" role="alert">
        <div class="alerta-err__ico">✕</div>
        <p class="alerta-err__txt">{{ errorApi() }}</p>
      </div>
    }

  </div><!-- body -->

  <footer class="panel__footer">
    <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
    <button type="button" class="btn btn-pri" (click)="submit()" [disabled]="guardando() || cargando()">
      @if (guardando()) { <span class="spinner"></span> Registrando... }
      @else { + Registrar insumo }
    </button>
  </footer>
  }

</div>
</div>`,
  styles: [`
:host{--vino:#550F26;--vino-h:#6d1430;--vino-g:rgba(85,15,38,.12);--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88) translateY(12px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.panel__hdr{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;border-bottom:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.panel__hdr-l{display:flex;align-items:center;gap:12px}
.panel__ico{width:34px;height:34px;background:var(--vino);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.panel__ico svg{width:15px;height:15px}
.panel__titulo{font-size:15px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.panel__sub{font-size:12px;color:var(--dim);margin:2px 0 0}
.panel__x{width:28px;height:28px;border-radius:7px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.panel__x:hover:not(:disabled){background:var(--db);border-color:var(--dbd);color:var(--danger)}
.panel__x:disabled{opacity:.4;cursor:not-allowed}
.panel__body{padding:20px;display:flex;flex-direction:column;gap:15px;overflow-y:auto;flex:1}
.panel__body::-webkit-scrollbar{width:5px}.panel__body::-webkit-scrollbar-thumb{background:var(--borde);border-radius:3px}
.panel__footer{display:flex;justify-content:flex-end;gap:10px;padding:13px 20px;border-top:1px solid var(--borde);background:var(--crema);flex-shrink:0}
.toggle{display:flex;border:1px solid var(--borde);border-radius:var(--r);overflow:hidden;background:#faf8f6}
.toggle__btn{flex:1;padding:8px 12px;background:transparent;border:none;font-size:12px;font-weight:600;color:var(--mid);cursor:pointer;font-family:inherit;transition:background .12s;display:flex;align-items:center;justify-content:center;gap:5px}
.toggle__btn:first-child{border-right:1px solid var(--borde)}
.toggle__btn--on{background:var(--vino);color:#fff}
.sec-titulo{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);padding-bottom:7px;border-bottom:1px solid var(--borde)}
.sec-hint{font-size:11px;color:var(--dim);margin-top:-8px}
.campo-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.campo{display:flex;flex-direction:column;gap:4px}
.campo.full{grid-column:span 2}
.campo--err .inp,.campo--err .sel{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
.campo-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
.req{color:var(--danger)}
.inp,.sel{width:100%;padding:9px 11px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;-webkit-appearance:none;transition:border-color .14s,box-shadow .14s;box-sizing:border-box}
.inp::placeholder{color:var(--dim);font-size:12px}
.inp:focus,.sel:focus{border-color:var(--vino);box-shadow:0 0 0 3px var(--vino-g)}
.inp:disabled,.sel:disabled{opacity:.5;cursor:not-allowed;background:#faf8f6}
.sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
.prefix-w{position:relative;display:flex;align-items:center}
.prefix{position:absolute;left:10px;font-size:12px;font-weight:600;color:var(--mid);pointer-events:none}
.inp--pfx{padding-left:32px}
.hint{font-size:11px;color:var(--dim)}
.err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px;animation:ei .15s ease}
.err-msg::before{content:'⚠';font-size:10px}
@keyframes ei{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
.info-box{display:flex;align-items:flex-start;gap:12px;padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:var(--r);color:#92400e}
.info-box svg{flex-shrink:0;margin-top:2px}
.info-text{font-size:12px;margin:4px 0 0;color:#b45309}
.info-box--primary{background:#e6f1fb;border-color:#b5d4f4;color:#185fa5}
.info-box--primary .info-text{color:#1e5877}
.alerta-err{display:flex;align-items:flex-start;gap:9px;padding:10px 13px;background:var(--db);border:1px solid var(--dbd);border-radius:var(--r)}
.alerta-err__ico{width:19px;height:19px;background:var(--dbd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--danger);flex-shrink:0}
.alerta-err__txt{font-size:12px;color:#9f3a2e;line-height:1.4;margin:0}
.sk-campo{display:flex;flex-direction:column;gap:6px}
.sk{display:block;border-radius:5px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
.sk-lbl{height:11px;width:60px}.sk-inp{height:40px;width:100%;border-radius:var(--r)}
@keyframes sh{to{background-position:-200% 0}}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r);border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .14s,transform .1s;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-pri{background:var(--vino);color:#fff}.btn-pri:hover:not(:disabled){background:var(--vino-h)}
.btn-sec{background:#fff;color:var(--mid);border:1px solid var(--borde)}.btn-sec:hover:not(:disabled){border-color:#ddd4cd;color:var(--txt)}
.spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
@media(max-width:480px){.overlay{align-items:flex-end;padding:0}.panel{border-radius:16px 16px 0 0;max-height:95vh}.campo-grid{grid-template-columns:1fr}.panel__footer{flex-direction:column-reverse}.btn{width:100%;justify-content:center}}
  `],
})
export class InsumoCrearModalComponent implements OnInit, OnDestroy {

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  cargando  = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorApi  = signal<string | null>(null);
  modoNuevo = signal<boolean>(true);

  unidades       = signal<UnidadMedidaListadoDTO[]>([]);
  insumosActivos = signal<InsumoListadoDTO[]>([]);

  form!: FormGroup;

  get errDisponible(): boolean {
    return !!this.form.errors?.['disponibleSuperaInicial'] && this.form.get('cantidadDisponible')!.touched;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private fb:    FormBuilder,
    private svc:   InsumoService,
    private umSvc: UnidadMedidaService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.actualizarValidators();
    this.cargarCombos();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }

  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  private initForm(): void {
    this.form = this.fb.group({
      idInsumo:           [null],
      nombre:             [''],
      idUnidadMedida:     [null],
      cantidadInicial:    [null],
      cantidadDisponible: [null],
      costoUnitario:      [null],
      fechaVencimiento:   [null],
    });
  }

  private actualizarValidators(): void {
    const esNuevo = this.modoNuevo();
    const nombreCtrl = this.form.get('nombre');
    const umCtrl = this.form.get('idUnidadMedida');

    if (esNuevo) {
      nombreCtrl?.setValidators([Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S+/)]);
      umCtrl?.setValidators([Validators.min(1)]);
    } else {
      nombreCtrl?.clearValidators();
      umCtrl?.clearValidators();
    }
    nombreCtrl?.updateValueAndValidity();
    umCtrl?.updateValueAndValidity();
  }

  private cargarCombos(): void {
    this.cargando.set(true);
    this.form.disable();
    forkJoin({ insumos: this.svc.obtenerListado(), unidades: this.umSvc.obtenerListado() })
      .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando.set(false); this.form.enable(); }))
      .subscribe({
        next: ({ insumos, unidades }) => {
          this.insumosActivos.set(insumos.filter(i => i.activo));
          this.unidades.set(unidades);
        },
        error: (e: Error) => this.errorApi.set(e.message),
      });
  }

  setModo(nuevo: boolean): void {
    this.modoNuevo.set(nuevo);
    this.form.patchValue({ idInsumo: null, nombre: '', idUnidadMedida: null });
    this.actualizarValidators();
    this.errorApi.set(null);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.errorApi.set(null);
    const f = this.form.value;
    const esNuevo = this.modoNuevo();

    if (esNuevo && (!f.nombre?.trim() || !f.idUnidadMedida)) {
      this.errorApi.set('Nombre y unidad de medida son obligatorios para un insumo nuevo.');
      return;
    }
    if (!esNuevo && !f.idInsumo) {
      this.errorApi.set('Debes seleccionar un insumo existente.');
      return;
    }

    this.guardando.set(true);
    this.svc.insertarLote({
      idInsumo:           esNuevo ? 0 : +f.idInsumo,
      nombre:             esNuevo ? f.nombre : '',
      idUnidadMedida:     esNuevo ? +f.idUnidadMedida : 0,
      cantidadInicial:    +f.cantidadInicial,
      cantidadDisponible: +f.cantidadDisponible,
      costoUnitario:      +f.costoUnitario,
      fechaVencimiento:   f.fechaVencimiento ? new Date(f.fechaVencimiento).toISOString() : null,
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
    .subscribe({
      next: () => this.guardado.emit(`Insumo${esNuevo ? ' "' + f.nombre + '"' : ''} registrado correctamente.`),
      error: (e: Error) => this.errorApi.set(e.message),
    });
  }

  err(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }
  errMsg(campo: string): string {
    const e = this.form.get(campo)?.errors;
    if (!e) return '';
    if (e['required'])  return 'Obligatorio.';
    if (e['pattern'])   return 'No puede ser solo espacios.';
    if (e['min'])       return `Mínimo ${e['min'].min}.`;
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Inválido.';
  }
}
