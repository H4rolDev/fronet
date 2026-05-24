import { Component, OnInit, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { forkJoin, Subject, from } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ProveedorListadoDTO, EntradaInsumoRequestDTO, EntradaInsumoDetalleRequestDTO } from '../../../../models/entrada-insumo-dto';
import { InsumoListadoDTO } from '../../../../models/insumo-dto';
import { EntradaInsumoService, ProveedorService } from '../../../../services/entrada-insumo.service';
import { InsumoService } from '../../../../services/insumo.service';

interface DetalleEntrada {
  idInsumo: number | null;
  insumoNombre: string;
  cantidad: number | null;
  precioUnitario: number | null;
  fechaVencimiento: string | null;
}

@Component({
  selector: 'app-entrada-insumo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
<div class="overlay" role="dialog" aria-modal="true" (click)="onOverlay($event)">
<div class="panel">

  <header class="panel__hdr">
    <div class="panel__hdr-l">
      <div class="panel__ico">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <div>
        <h2 class="panel__titulo">Registrar Entrada de Insumos</h2>
        <p class="panel__sub">Completa los datos del documento y los insumos</p>
      </div>
    </div>
    <button class="panel__x" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
  </header>

  @if (cargando()) {
    <div class="panel__body">
      @for (i of [1,2,3]; track i) {
        <div class="sk-campo"><span class="sk sk-lbl"></span><span class="sk sk-inp"></span></div>
      }
    </div>
  }

  @if (!cargando()) {
  <div class="panel__body" [formGroup]="form">
    <div class="sec-titulo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
      Datos del Documento
    </div>

    <div class="campo-grid">
      <div class="campo">
        <label class="campo-lbl" for="prov">Proveedor</label>
        <select id="prov" class="sel" formControlName="idProveedor">
          <option [ngValue]="null">— Seleccionar —</option>
          @for (p of proveedores(); track p.id) {
            <option [ngValue]="p.id">{{ p.nombre }} {{ p.ruc ? '· RUC: ' + p.ruc : '' }}</option>
          }
        </select>
      </div>
      <div class="campo">
        <label class="campo-lbl" for="tipodoc">Tipo Documento <span class="req">*</span></label>
        <select id="tipodoc" class="sel" formControlName="tipoDocumento" [class.campo--err]="err('tipoDocumento')">
          <option value="">— Seleccionar —</option>
          <option value="Factura">Factura</option>
          <option value="Boleta">Boleta</option>
          <option value="Guía de remisión">Guía de remisión</option>
          <option value="Nota de pedido">Nota de pedido</option>
          <option value="Otro">Otro</option>
        </select>
        @if (err('tipoDocumento')) { <p class="err-msg">Obligatorio.</p> }
      </div>
      <div class="campo">
        <label class="campo-lbl" for="numdoc">Número Documento <span class="req">*</span></label>
        <input id="numdoc" type="text" class="inp" formControlName="numeroDocumento" 
               placeholder="Ej: F001-12345" maxlength="50" [class.campo--err]="err('numeroDocumento')" />
        @if (err('numeroDocumento')) { <p class="err-msg">Obligatorio.</p> }
      </div>
      <div class="campo">
        <label class="campo-lbl" for="fecdoc">Fecha Documento</label>
        <input id="fecdoc" type="date" class="inp" formControlName="fechaDocumento" />
      </div>
    </div>

    <div class="campo full">
      <label class="campo-lbl" for="obs">Observaciones</label>
      <textarea id="obs" class="inp" formControlName="observaciones" rows="2" 
                placeholder="Notas adicionales sobre la entrada..." maxlength="500"></textarea>
    </div>

    <div class="sec-titulo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L20 12V4a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        <path d="M9.5 12.5l3-3M14 5l4 4"/>
      </svg>
      Imagen del Documento <span class="req">*</span>
    </div>

    <div class="imagen-box" [class.imagen-box--error]="imagenRequerida && form.touched">
      @if (!imagenPreview()) {
        <label class="imagen-drop" [class.imagen-drop--error]="imagenRequerida && form.touched">
          <input type="file" accept="image/*" (change)="onFileSelected($event)" hidden #fileInput />
          <div class="imagen-drop__content" (click)="fileInput.click()">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b8a9a0" stroke-width="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L20 12V4a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              <path d="M9.5 12.5l3-3M14 5l4 4"/>
            </svg>
            <span>Click para subir imagen</span>
            <small>PNG, JPG, JPEG (máx 5MB)</small>
          </div>
        </label>
      }
      @if (imagenPreview()) {
        <div class="imagen-preview">
          <img [src]="imagenPreview()" alt="Vista previa" />
          <button type="button" class="imagen-preview__x" (click)="eliminarImagen()">✕</button>
        </div>
      }
      @if (imagenRequerida && form.touched) {
        <p class="err-msg">La imagen del documento es obligatoria.</p>
      }
    </div>

    <div class="sec-titulo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
      Insumos <span class="count">{{ detalles().length }}</span>
    </div>

    <div class="detalle-form">
      <div class="df-row">
        <div class="campo" style="flex:2">
          <label class="campo-lbl">Insumo</label>
          <select class="sel" [(ngModel)]="detalleForm.idInsumo" [ngModelOptions]="{standalone:true}">
            <option [ngValue]="null">— Seleccionar insumo —</option>
            @for (i of insumos(); track i.id) {
              <option [ngValue]="i.id">{{ i.nombre }}</option>
            }
          </select>
        </div>
        <div class="campo">
          <label class="campo-lbl">Cantidad</label>
          <input type="number" class="inp" [(ngModel)]="detalleForm.cantidad" [ngModelOptions]="{standalone:true}"
                 placeholder="0" min="0.01" step="0.01" />
        </div>
        <div class="campo">
          <label class="campo-lbl">Precio (S/.)</label>
          <input type="number" class="inp" [(ngModel)]="detalleForm.precioUnitario" [ngModelOptions]="{standalone:true}"
                 placeholder="0.00" min="0.01" step="0.01" />
        </div>
        <div class="campo">
          <label class="campo-lbl">F. Vencimiento <span class="req">*</span></label>
          <input type="date" class="inp" [(ngModel)]="detalleForm.fechaVencimiento" [ngModelOptions]="{standalone:true}" />
        </div>
        <button type="button" class="btn-add" (click)="agregarDetalle()" [disabled]="!detalleForm.idInsumo || !detalleForm.fechaVencimiento">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    @if (detalles().length > 0) {
      <div class="detalle-tabla">
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>F. Vencimiento</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (d of detalles(); track $index) {
              <tr>
                <td>{{ d.insumoNombre }}</td>
                <td>{{ d.cantidad }}</td>
                <td>S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                <td>{{ d.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
                <td>S/ {{ (d.cantidad! * d.precioUnitario!) | number:'1.2-2' }}</td>
                <td>
                  <button type="button" class="btn-del" (click)="eliminarDetalle($index)">✕</button>
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="total-label">Total</td>
              <td class="total-value">S/ {{ total() | number:'1.2-2' }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    }

    @if (detalles().length === 0) {
      <div class="empty-detalles">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
        </svg>
        <p>Agrega al menos un insumo</p>
      </div>
    }

    @if (errorApi()) {
      <div class="alerta-err" role="alert">
        <div class="alerta-err__ico">✕</div>
        <p class="alerta-err__txt">{{ errorApi() }}</p>
      </div>
    }
  </div>

  <footer class="panel__footer">
    <button type="button" class="btn btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
    <button type="button" class="btn btn-pri" (click)="submit()" [disabled]="guardando() || cargando() || detalles().length === 0">
      @if (guardando()) { <span class="spinner"></span> Guardando... }
      @else { + Crear Solicitud }
    </button>
  </footer>
  }
</div>
</div>
  `,
  styles: [`
    :host{--vino:#550F26;--vino-h:#6d1430;--vino-g:rgba(85,15,38,.12);--crema:#f7f3ef;--borde:#ede8e3;--txt:#2c1810;--dim:#b8a9a0;--mid:#8b6e65;--success:#059669;--danger:#c0392b;--db:#fdf0ef;--dbd:#fecaca;--r:8px}
    .overlay{position:fixed;inset:0;background:rgba(44,24,16,.45);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .2s ease}
    @keyframes fi{from{opacity:0}to{opacity:1}}
    .panel{background:#fff;border:1px solid var(--borde);border-radius:16px;width:100%;max-width:680px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(85,15,38,.14);animation:pi .28s cubic-bezier(.34,1.56,.64,1)}
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
    .sec-titulo{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);padding-bottom:7px;border-bottom:1px solid var(--borde)}
    .count{background:var(--vino);color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:4px}
    .campo-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px}
    .campo{display:flex;flex-direction:column;gap:4px}
    .campo.full{grid-column:span 3}
    .campo--err .inp,.campo--err .sel,.campo--err textarea{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
    .campo-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);display:flex;align-items:center;gap:3px}
    .req{color:var(--danger)}
    .inp,.sel,textarea{width:100%;padding:9px 11px;border:1px solid var(--borde);border-radius:var(--r);font-size:13px;color:var(--txt);background:#fff;font-family:inherit;outline:none;-webkit-appearance:none;transition:border-color .14s,box-shadow .14s;box-sizing:border-box}
    textarea{resize:vertical;min-height:60px}
    .inp::placeholder{color:var(--dim);font-size:12px}
    .inp:focus,.sel:focus,textarea:focus{border-color:var(--vino);box-shadow:0 0 0 3px var(--vino-g)}
    .sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
    .detalle-form{background:#faf8f6;padding:12px;border-radius:var(--r);border:1px solid var(--borde)}
    .df-row{display:flex;gap:10px;align-items:flex-end}
    .df-row .campo{flex:1}
    .btn-add{width:36px;height:36px;background:var(--vino);color:#fff;border:none;border-radius:var(--r);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s;flex-shrink:0}
    .btn-add:hover:not(:disabled){background:var(--vino-h)}
    .btn-add:disabled{opacity:.5;cursor:not-allowed}
    .detalle-tabla{overflow-x:auto}
    .detalle-tabla table{width:100%;border-collapse:collapse;font-size:13px}
    .detalle-tabla th{text-align:left;padding:8px 12px;background:#f3f0eb;color:var(--mid);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--borde)}
    .detalle-tabla td{padding:10px 12px;border-bottom:1px solid var(--borde);color:var(--txt)}
    .detalle-tabla tfoot td{background:#f7f3ef;font-weight:700;border-top:2px solid var(--borde)}
    .total-label{text-align:right}
    .total-value{color:var(--vino);font-size:15px}
    .imagen-box{width:100%;margin-top:5px}
    .imagen-box--error .imagen-drop,.imagen-box--error .imagen-drop--error{border-color:var(--danger);box-shadow:0 0 0 2px rgba(192,57,43,.1)}
    .imagen-drop{width:100%;padding:25px;border:2px dashed var(--borde);border-radius:var(--r);cursor:pointer;transition:border-color .14s,background .14s}
    .imagen-drop:hover{background:#faf8f6;border-color:var(--mid)}
    .imagen-drop__content{display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--dim)}
    .imagen-drop__content span{font-size:13px;font-weight:500}
    .imagen-drop__content small{font-size:11px}
    .imagen-preview{position:relative;width:100%;max-width:200px;border-radius:var(--r);overflow:hidden;border:1px solid var(--borde)}
    .imagen-preview img{width:100%;height:auto;display:block}
    .imagen-preview__x{position:absolute;top:6px;right:6px;width:22px;height:22px;background:rgba(0,0,0,.6);border:none;border-radius:50%;color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .imagen-preview__x:hover{background:rgba(192,57,43,.9)}
    .btn-del{width:24px;height:24px;background:transparent;border:1px solid var(--borde);border-radius:4px;color:var(--dim);cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;transition:all .12s}
    .btn-del:hover{background:var(--db);border-color:var(--dbd);color:var(--danger)}
    .empty-detalles{text-align:center;padding:30px;color:var(--dim);background:#faf8f6;border-radius:var(--r);border:1px dashed var(--borde)}
    .empty-detalles svg{margin-bottom:8px}
    .empty-detalles p{margin:0;font-size:13px}
    .err-msg{font-size:11px;color:var(--danger);display:flex;align-items:center;gap:3px;animation:ei .15s ease}
    .err-msg::before{content:'⚠';font-size:10px}
    @keyframes ei{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
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
    @media(max-width:640px){.overlay{align-items:flex-end;padding:0}.panel{border-radius:16px 16px 0 0;max-height:95vh}.campo-grid{grid-template-columns:1fr}.campo.full{grid-column:span 1}.df-row{flex-wrap:wrap}.df-row .campo{flex:1 1 100%}}
  `]
})
export class EntradaInsumoModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<string>();

  cargando = signal(false);
  guardando = signal(false);
  errorApi = signal<string | null>(null);

  proveedores = signal<ProveedorListadoDTO[]>([]);
  insumos = signal<InsumoListadoDTO[]>([]);
  detalles = signal<DetalleEntrada[]>([]);

  imagenFile = signal<File | null>(null);
  imagenPreview = signal<string | null>(null);

  detalleForm = { idInsumo: null as number | null, cantidad: null as number | null, precioUnitario: null as number | null, fechaVencimiento: null as string | null };

  form!: FormGroup;
  private destroy$ = new Subject<void>();

  total = signal(0);

  constructor(
    private fb: FormBuilder,
    private entradaSvc: EntradaInsumoService,
    private proveedorSvc: ProveedorService,
    private insumoSvc: InsumoService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (!this.guardando()) this.cerrar.emit(); }

  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.guardando()) this.cerrar.emit();
  }

  private initForm(): void {
    this.form = this.fb.group({
      idProveedor: [null],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      fechaDocumento: [null],
      observaciones: ['']
    });
  }

  private cargarCombos(): void {
    this.cargando.set(true);
    forkJoin({
      proveedores: this.proveedorSvc.obtenerListado(),
      insumos: this.insumoSvc.obtenerListado()
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
    .subscribe({
      next: (data) => {
        this.proveedores.set(data.proveedores.filter(p => p.activo));
        this.insumos.set(data.insumos.filter(i => i.activo));
      },
      error: (e: Error) => this.errorApi.set(e.message)
    });
  }

  agregarDetalle(): void {
    if (!this.detalleForm.idInsumo || !this.detalleForm.cantidad || !this.detalleForm.precioUnitario || !this.detalleForm.fechaVencimiento) return;
    
    const insumo = this.insumos().find(i => i.id === this.detalleForm.idInsumo);
    if (!insumo) return;

    const nuevo: DetalleEntrada = {
      idInsumo: this.detalleForm.idInsumo,
      insumoNombre: insumo.nombre,
      cantidad: this.detalleForm.cantidad,
      precioUnitario: this.detalleForm.precioUnitario,
      fechaVencimiento: this.detalleForm.fechaVencimiento
    };

    this.detalles.update(d => [...d, nuevo]);
    this.calcularTotal();
    this.detalleForm = { idInsumo: null, cantidad: null, precioUnitario: null, fechaVencimiento: null };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.errorApi.set('La imagen no puede superar 5MB');
      return;
    }

    this.imagenFile.set(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  eliminarImagen(): void {
    this.imagenFile.set(null);
    this.imagenPreview.set(null);
  }

  private async getBase64Value(): Promise<string | null> {
    const file = this.imagenFile();
    if (!file) return null;
    
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  }

  eliminarDetalle(index: number): void {
    this.detalles.update(d => d.filter((_, i) => i !== index));
    this.calcularTotal();
  }

  private calcularTotal(): void {
    const tot = this.detalles().reduce((sum, d) => sum + (d.cantidad! * d.precioUnitario!), 0);
    this.total.set(tot);
  }

  err(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  get imagenRequerida(): boolean {
    return !this.imagenFile() && !this.imagenPreview();
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.imagenRequerida) {
      this.errorApi.set('La imagen del documento es obligatoria.');
      return;
    }

    if (this.form.invalid || this.detalles().length === 0) return;

    this.errorApi.set(null);
    this.guardando.set(true);

    const f = this.form.value;

    this.getBase64Value().then(base64 => {
      const dto: any = {
        idProveedor: f.idProveedor || null,
        tipoDocumento: f.tipoDocumento,
        numeroDocumento: f.numeroDocumento,
        fechaDocumento: f.fechaDocumento ? new Date(f.fechaDocumento).toISOString() : undefined,
        imagenBase64: base64 || undefined,
        observaciones: f.observaciones || null,
        usuario: this.getUsuario(),
        detalles: this.detalles().map(d => ({
          idInsumo: d.idInsumo!,
          cantidad: d.cantidad!,
          precioUnitario: d.precioUnitario!,
          fechaVencimiento: d.fechaVencimiento ? new Date(d.fechaVencimiento).toISOString() : null
        }))
      };

      this.entradaSvc.registrar(dto)
        .pipe(takeUntil(this.destroy$), finalize(() => this.guardando.set(false)))
        .subscribe({
          next: (id) => {
            this.guardado.emit(`Entrada #${id} creada. Pendiente de aprobación.`);
          },
          error: (e: Error) => this.errorApi.set(e.message)
        });
    });
  }

  private getUsuario(): string {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.username || 'sistema';
    }
    return 'sistema';
  }
}