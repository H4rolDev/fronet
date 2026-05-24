/**
 * @file insumo-editar-modal.component.ts
 * @description Modal para editar nombre y unidad de medida de un insumo.
 * Carga el detalle via ObtenerListadoPorId para tener los valores actuales.
 */

import {
  Component, OnInit, OnDestroy,
  Input, Output, EventEmitter, HostListener, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { InsumoListadoDTO } from '../../../../models/insumo-dto';
import { UnidadMedidaListadoDTO } from '../../../../models/unidad-medida-dto';
import { InsumoService } from '../../../../services/insumo.service';
import { UnidadMedidaService } from '../../../../services/unidad-medida.service';


@Component({
  selector: 'app-insumo-editar-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="overlay" role="dialog" (click)="onOverlay($event)">
<div class="panel">
  <header class="panel__hdr">
    <div class="panel__hdr-l">
      <div class="panel__ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
      <div><h2 class="panel__titulo">Editar Insumo</h2><p class="panel__sub">Modifica nombre y unidad de medida</p></div>
    </div>
    <button class="panel__x" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
  </header>

  @if (cargando()) {
    <div class="panel__body">
      <div class="sk-c"><span class="sk sk-l"></span><span class="sk sk-i"></span></div>
      <div class="sk-c"><span class="sk sk-l"></span><span class="sk sk-i"></span></div>
    </div>
  }

  @if (!cargando()) {
  <div class="panel__body" [formGroup]="form">
    <div class="campo" [class.campo--err]="err('nombre')">
      <label class="campo-lbl" for="e-nom">Nombre <span class="req">*</span></label>
      <input id="e-nom" type="text" class="inp" formControlName="nombre" maxlength="100" />
      @if (err('nombre')) { <p class="err-msg">{{ errMsg('nombre') }}</p> }
    </div>
    <div class="campo" [class.campo--err]="err('idUnidadMedida')">
      <label class="campo-lbl" for="e-um">Unidad de medida <span class="req">*</span></label>
      <select id="e-um" class="sel" formControlName="idUnidadMedida">
        <option [ngValue]="null">— Seleccionar —</option>
        @for (u of unidades(); track u.id) { <option [ngValue]="u.id">{{ u.nombre }}</option> }
      </select>
      @if (err('idUnidadMedida')) { <p class="err-msg">{{ errMsg('idUnidadMedida') }}</p> }
    </div>
    @if (errorApi()) {
      <div class="alerta-err" role="alert">
        <div class="alerta-err__ico">✕</div><p class="alerta-err__txt">{{ errorApi() }}</p>
      </div>
    }
  </div>
  <footer class="panel__footer">
    <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
    <button type="button" class="btn btn-pri" (click)="submit()" [disabled]="guardando()">
      @if (guardando()) { <span class="spinner"></span> Guardando... } @else { ✓ Guardar cambios }
    </button>
  </footer>
  }
</div>
</div>`,
  styles: [`
:host{--vino:#550F26;--vino-h:#6d1430;--vino-g:rgba(85,15,38,.12);--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--r:8px}
.overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes pi{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
.panel__hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--borde);background:var(--crema)}
.panel__hdr-l{display:flex;align-items:center;gap:11px}
.panel__ico{width:32px;height:32px;background:var(--vino);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.panel__ico svg{width:14px;height:14px}
.panel__titulo{font-size:14px;font-weight:700;font-family:Georgia,serif;color:var(--txt);margin:0}
.panel__sub{font-size:11px;color:var(--dim);margin:2px 0 0}
.panel__x{width:27px;height:27px;border-radius:6px;background:transparent;border:1px solid var(--borde);color:var(--dim);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.panel__x:hover:not(:disabled){background:var(--db);border-color:var(--dbd);color:var(--danger)}
.panel__x:disabled{opacity:.4;cursor:not-allowed}
.panel__body{padding:20px;display:flex;flex-direction:column;gap:14px}
.panel__footer{display:flex;justify-content:flex-end;gap:9px;padding:13px 18px;border-top:1px solid var(--borde);background:var(--crema)}
.campo{display:flex;flex-direction:column;gap:5px}
.campo--err .inp,.campo--err .sel{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
.campo-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
.req{color:var(--danger)}
.inp,.sel{width:100%;padding:9px 11px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;-webkit-appearance:none;transition:border-color .14s}
.inp:focus,.sel:focus{border-color:var(--vino);box-shadow:0 0 0 3px var(--vino-g)}
.sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
.err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px}
.err-msg::before{content:'⚠';font-size:10px}
.alerta-err{display:flex;align-items:flex-start;gap:9px;padding:10px 13px;background:var(--db);border:1px solid var(--dbd);border-radius:var(--r)}
.alerta-err__ico{width:19px;height:19px;background:var(--dbd);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--danger);flex-shrink:0}
.alerta-err__txt{font-size:12px;color:#9f3a2e;line-height:1.4;margin:0}
.sk-c{display:flex;flex-direction:column;gap:6px}
.sk{display:block;border-radius:5px;background:linear-gradient(90deg,#f0ebe7 25%,#f8f5f3 50%,#f0ebe7 75%);background-size:200% 100%;animation:sh 1.4s infinite}
.sk-l{height:11px;width:60px}.sk-i{height:40px;width:100%}
@keyframes sh{to{background-position:-200% 0}}
.btn{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:var(--r);border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .14s,transform .1s;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-pri{background:var(--vino);color:#fff}.btn-pri:hover:not(:disabled){background:var(--vino-h)}
.btn-sec{background:#fff;color:var(--mid);border:1px solid var(--borde)}.btn-sec:hover:not(:disabled){border-color:#ddd4cd}
.spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
  `],
})
export class InsumoEditarModalComponent implements OnInit, OnDestroy {

  @Input({ required: true }) insumo!: InsumoListadoDTO;
  @Output() cerrar   = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  cargando  = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorApi  = signal<string | null>(null);
  unidades  = signal<UnidadMedidaListadoDTO[]>([]);
  form!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private svc: InsumoService,
    private umSvc: UnidadMedidaService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S+/)]],
      idUnidadMedida: [null, [Validators.required, Validators.min(1)]],
    });
    this.cargarDatos();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }
  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    this.form.disable();
    forkJoin({ detalle: this.svc.obtenerPorId(this.insumo.id), unidades: this.umSvc.obtenerListado() })
      .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando.set(false); this.form.enable(); }))
      .subscribe({
        next: ({ detalle, unidades }) => {
          this.unidades.set(unidades);
          this.form.patchValue({ nombre: detalle.nombre, idUnidadMedida: detalle.idUnidadMedida });
        },
        error: (e: Error) => this.errorApi.set(e.message),
      });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.errorApi.set(null);
    this.guardando.set(true);
    const f = this.form.value;
    let date = new Date();
    this.svc.actualizarInsumo(this.insumo.id, f.nombre, +f.idUnidadMedida, date.toISOString())
      .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => this.guardado.emit(`"${f.nombre}" actualizado correctamente.`),
        error: (e: Error) => this.errorApi.set(e.message),
      });
  }

  err(c: string): boolean { const x = this.form.get(c); return !!(x?.invalid && x?.touched); }
  errMsg(c: string): string {
    const e = this.form.get(c)?.errors;
    if (!e) return '';
    if (e['required'])  return 'Obligatorio.';
    if (e['pattern'])   return 'No puede ser solo espacios.';
    if (e['min'])       return `Mínimo ${e['min'].min}.`;
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Inválido.';
  }
}
