/**
 * @file proveedor-editar-modal.component.ts
 * @description Modal para editar un proveedor existente con búsqueda SUNAT
 */

import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProveedorService } from '../../../../services/proveedor.service';
import { ProveedorListadoDTO, ProveedorRequestDTO } from '../../../../models/entrada-insumo-dto';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiUrl;

interface SunatData {
  razon_social?: string;
  razonSocial?: string;
  numero_documento?: string;
  direccion?: string;
  full_name?: string;
}

interface SunatResponse {
  success: boolean;
  mensaje?: string;
  data?: SunatData;
}

@Component({
  selector: 'app-proveedor-editar-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="modal-overlay" (click)="onOverlay($event)">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2 class="modal-titulo">Editar Proveedor</h2>
      <button class="modal-cerrar" (click)="cerrar.emit()" [disabled]="guardando()">✕</button>
    </div>
    
    @if (cargando()) {
      <div class="modal-form">
        <div class="skeleton-form">
          <div class="sk-line"></div>
          <div class="sk-line"></div>
          <div class="sk-line"></div>
          <div class="sk-line"></div>
        </div>
      </div>
    }
    
    @if (!cargando()) {
      <form class="modal-form" [formGroup]="form" (ngSubmit)="guardar()">
        <div class="form-grid">
          <div class="form-group">
            <label class="lbl">Nombre *</label>
            <input type="text" class="inp" formControlName="nombre" name="nombre" 
                   placeholder="Nombre del proveedor" [class.inp--error]="form.get('nombre')?.invalid && form.get('nombre')?.touched" />
            @if (form.get('nombre')?.invalid && form.get('nombre')?.touched) {
              <span class="msg-error">El nombre es requerido</span>
            }
          </div>

          <div class="form-group">
            <label class="lbl">Tipo Documento</label>
            <select class="inp sel" formControlName="tipoDocumento">
              <option value="RUC">RUC</option>
              <option value="DNI">DNI</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="lbl">Número Documento</label>
            <div class="input-with-btn">
              <input type="text" class="inp" formControlName="numeroDocumento" 
                     placeholder="Ingrese número" maxlength="11" />
              <button type="button" class="btn-buscar" (click)="consultarSunat()" 
                      [disabled]="consultandoSunat() || !puedeBuscar">
                @if (consultandoSunat()) {
                  <span class="spinner-sm"></span>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                }
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="lbl">Teléfono</label>
            <input type="text" class="inp" formControlName="telefono" name="telefono" placeholder="Teléfono" />
          </div>
          
          <div class="form-group">
            <label class="lbl">Contacto</label>
            <input type="text" class="inp" formControlName="contacto" name="contacto" placeholder="Persona de contacto" />
          </div>
          
          <div class="form-group span-2">
            <label class="lbl">Dirección</label>
            <input type="text" class="inp" formControlName="direccion" name="direccion" placeholder="Dirección" />
          </div>
        </div>

        @if (errorSunat()) {
          <div class="alert-error">{{ errorSunat() }}</div>
        }
        
        <div class="modal-footer">
          <button type="button" class="btn-sec" (click)="cerrar.emit()" [disabled]="guardando()">Cancelar</button>
          <button type="submit" class="btn-prim" [disabled]="form.invalid || guardando()">
            @if (guardando()) { <span class="spinner"></span> }
            Guardar Cambios
          </button>
        </div>
      </form>
    }
  </div>
</div>
  `,
  styles: [`
    :host { --vino: #550F26; --vino-h: #6d1430; --borde: #ede8e3; --texto: #2c1810; --texto-dim: #b8a9a0; --texto-mid: #8b6e65; --exito: #22c55e; --peligro: #c0392b; --radio: 8px; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-content { background: #fff; border-radius: var(--radio); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; animation: modalIn .2s ease; }
    @keyframes modalIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--borde); }
    .modal-titulo { font-size: 18px; font-weight: 600; color: var(--texto); margin: 0; font-family: Georgia, serif; }
    .modal-cerrar { background: none; border: none; font-size: 20px; color: var(--texto-dim); cursor: pointer; padding: 4px; border-radius: 4px; }
    .modal-cerrar:hover { color: var(--texto); }
    .modal-form { padding: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .span-2 { grid-column: span 2; }
    .lbl { font-size: 12px; font-weight: 600; color: var(--texto-mid); }
    .inp { padding: 10px 12px; border: 1px solid var(--borde); border-radius: var(--radio); font-size: 13px; transition: border-color .15s; }
    .inp:focus { outline: none; border-color: var(--vino); }
    .inp--error { border-color: var(--peligro); }
    .sel { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer; }
    .msg-error { font-size: 11px; color: var(--peligro); }
    .input-with-btn { display: flex; gap: 8px; }
    .input-with-btn .inp { flex: 1; }
    .btn-buscar { width: 38px; height: 38px; background: var(--vino); border: none; border-radius: var(--radio); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .15s; }
    .btn-buscar:hover:not(:disabled) { background: var(--vino-h); }
    .btn-buscar:disabled { opacity: .5; cursor: not-allowed; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px 12px; border-radius: var(--radio); font-size: 12px; margin-bottom: 16px; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid var(--borde); }
    .btn-sec, .btn-prim { padding: 10px 20px; border-radius: var(--radio); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .btn-sec { background: #f5f5f4; color: var(--texto); border: 1px solid var(--borde); }
    .btn-sec:hover { background: #e8e7e4; }
    .btn-prim { background: var(--vino); color: #fff; border: none; }
    .btn-prim:hover { background: var(--vino-h); }
    .btn-prim:disabled { opacity: .6; cursor: not-allowed; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .skeleton-form { display: flex; flex-direction: column; gap: 16px; padding: 10px; }
    .sk-line { height: 40px; background: linear-gradient(90deg, #f0efed 25%, #e8e6e3 50%, #f0efed 75%); background-size: 200% 100%; animation: skeleton 1.5s ease-in-out infinite; border-radius: 8px; }
    @keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `]
})
export class ProveedorEditarModalComponent implements OnInit {
  @Input() proveedor!: ProveedorListadoDTO;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  guardando = signal(false);
  cargando = signal(true);
  consultandoSunat = signal(false);
  errorSunat = signal<string | null>(null);

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private proveedorSvc: ProveedorService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipoDocumento: ['RUC'],
      numeroDocumento: [''],
      telefono: [''],
      contacto: [''],
      direccion: ['']
    });
  }

  ngOnInit() {
    this.cargarProveedor();
  }

  private esRuc(): boolean {
    return this.form.value.tipoDocumento === 'RUC';
  }

  get puedeBuscar(): boolean {
    const doc = this.form.value.numeroDocumento?.trim() || '';
    const esRuc = this.esRuc();
    if (!doc) return false;
    if (esRuc) return doc.length === 11 && /^\d+$/.test(doc);
    return doc.length === 8 && /^\d+$/.test(doc);
  }

  private validarDocumento(): string | null {
    const doc = this.form.value.numeroDocumento?.trim() || '';
    const esRuc = this.esRuc();
    
    if (!doc) return 'Ingrese un número de documento';
    if (esRuc && doc.length !== 11) return 'El RUC debe tener 11 dígitos';
    if (!esRuc && doc.length !== 8) return 'El DNI debe tener 8 dígitos';
    if (!/^\d+$/.test(doc)) return 'El documento debe contener solo números';
    
    return null;
  }

  consultarSunat() {
    const error = this.validarDocumento();
    if (error) {
      this.errorSunat.set(error);
      return;
    }

    this.errorSunat.set(null);
    this.consultandoSunat.set(true);
    
    const doc = this.form.value.numeroDocumento.trim();
    const esRuc = this.esRuc();
    const url = esRuc 
      ? `${BASE}/Sunat/ruc?numero=${doc}` 
      : `${BASE}/Sunat/dni?numero=${doc}`;

    this.http.get<SunatResponse>(url).subscribe({
      next: res => {
        this.consultandoSunat.set(false);
        if (res.success && res.data) {
          const data = res.data;
          if (esRuc) {
            this.form.patchValue({
              nombre: data.razon_social || data.razonSocial || this.form.value.nombre,
              direccion: data.direccion || ''
            });
          } else {
            this.form.patchValue({
              nombre: data.full_name || '',
              direccion: ''
            });
          }
          this.errorSunat.set(null);
        } else {
          this.errorSunat.set(res.mensaje || 'No se encontró información');
        }
      },
      error: () => {
        this.consultandoSunat.set(false);
        this.errorSunat.set('Error al consultar SUNAT');
      }
    });
  }

  cargarProveedor() {
    this.proveedorSvc.obtenerPorId(this.proveedor.id).subscribe({
      next: (data) => {
        const esRuc = data.ruc && data.ruc.length === 11;
        this.form.patchValue({
          nombre: data.nombre,
          tipoDocumento: esRuc ? 'RUC' : 'DNI',
          numeroDocumento: data.ruc || '',
          telefono: data.telefono || '',
          contacto: data.contacto || '',
          direccion: data.direccion || ''
        });
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar proveedor:', err);
        this.cargando.set(false);
      }
    });
  }

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar.emit();
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);

    const numeroDoc = this.form.value.numeroDocumento?.trim() || undefined;

    const data: ProveedorRequestDTO = {
      id: this.proveedor.id,
      nombre: this.form.value.nombre,
      ruc: numeroDoc,
      telefono: this.form.value.telefono || undefined,
      direccion: this.form.value.direccion || undefined,
      contacto: this.form.value.contacto || undefined,
      usuario: 'admin'
    };

    this.proveedorSvc.actualizar(data).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardado.emit();
        this.cerrar.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        console.error('Error al actualizar proveedor:', err);
      }
    });
  }
}