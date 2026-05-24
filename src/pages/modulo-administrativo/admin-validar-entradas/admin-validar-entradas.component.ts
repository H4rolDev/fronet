import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntradaInsumoService } from '../../../services/entrada-insumo.service';
import {
  EntradaInsumoListadoDTO,
  EntradaInsumoAprobarDTO,
  EntradaInsumoRechazarDTO
} from '../../../models/entrada-insumo-dto';

interface EntradaValidacion {
  id: number;
  proveedor?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  fechaDocumento?: string;
  imagenDocumento?: string;
  observaciones?: string;
  idEstado: number;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion: string;
  usuarioAprobacion?: string;
  fechaAprobacion?: string;
  usuarioRechazo?: string;
  fechaRechazo?: string;
  detalles: { id: number; idInsumo: number; insumo?: string; cantidad: number; precioUnitario: number }[];
}

interface HistorialItem {
  id: number;
  accion: string;
  observacion?: string;
  usuario: string;
  fecha: string;
}

@Component({
  selector: 'app-admin-validar-entradas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="validacion-page">
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Validar Entradas de Insumos</h2>
            <p class="ph-s">Revisa las entradas pendientes de aprobación</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="toggle-group">
            <button [class.active]="vistaActual() === 'pendientes'" (click)="cambiarVista('pendientes')">
              Pendientes
            </button>
            <button [class.active]="vistaActual() === 'todas'" (click)="cambiarVista('todas')">
              Todas
            </button>
          </div>
          <div class="count-pill">{{ entradasPendientes().length }} pendientes</div>
        </div>
      </header>

      @if (vistaActual() === 'todas') {
        <div class="filtros-section">
          <div class="filtros-row">
            <select [(ngModel)]="filtroEstado" (change)="cargarTodas()">
              <option [value]="null">Todos los estados</option>
              <option [value]="1">Pendiente</option>
              <option [value]="2">Aprobado</option>
              <option [value]="3">Rechazado</option>
            </select>
            <input type="date" [(ngModel)]="filtroFechaInicio" (change)="cargarTodas()" placeholder="Fecha inicio">
            <input type="date" [(ngModel)]="filtroFechaFin" (change)="cargarTodas()" placeholder="Fecha fin">
            <button class="btn-buscar" (click)="cargarTodas()">Buscar</button>
            <button class="btn-limpiar" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </div>
      }

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando entradas...</p>
        </div>
      }

      @if (!cargando() && entradasPendientes().length === 0 && vistaActual() === 'pendientes') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No hay entradas pendientes de validación</p>
        </div>
      }

      @if (!cargando() && vistaActual() === 'todas' && entradasTodas().length === 0) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No se encontraron entradas con los filtros aplicados</p>
        </div>
      }

      @if (!cargando() && entradasPendientes().length > 0) {
        <div class="cards-grid">
          @for (e of entradasPendientes(); track e.id) {
            <div class="card-validacion">
              <div class="card-header">
                <div class="card-id">
                  <span class="badge badge--warning">Esperando Validación</span>
                  <span class="entrada-id">Entrada #{{ e.id }}</span>
                </div>
                <span class="fecha">{{ formatFecha(e.fechaCreacion) }}</span>
              </div>

              <div class="card-body">
                <div class="info-section">
                  <h4>Datos del Documento</h4>
                  <div class="info-row">
                    <span class="label">Proveedor:</span>
                    <span class="value">{{ e.proveedor || 'Sin proveedor' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Documento:</span>
                    <span class="value">{{ e.tipoDocumento }} - {{ e.numeroDocumento || 'Sin número' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Usuario:</span>
                    <span class="value">{{ e.usuarioCreacion }}</span>
                  </div>
                </div>

                @if (e.imagenDocumento) {
                  <div class="info-section">
                    <h4>Imagen del Documento</h4>
                    <div class="comprobante-preview" (click)="abrirImagen(e.imagenDocumento!)">
                      <img [src]="e.imagenDocumento" alt="Documento">
                      <div class="overlay">
                        <span>Ampliar imagen</span>
                      </div>
                    </div>
                  </div>
                }

                @if (e.observaciones) {
                  <div class="info-section">
                    <h4>Observaciones</h4>
                    <p class="observaciones">{{ e.observaciones }}</p>
                  </div>
                }

                <div class="info-section">
                  <h4>Detalles del Insumo</h4>
                  @for (d of e.detalles; track d.id) {
                    <div class="detalle-item">
                      <span class="insumo-nombre">{{ d.insumo }}</span>
                      <span class="insumo-cant">{{ d.cantidad }} und</span>
                      <span class="insumo-precio">S/ {{ d.precioUnitario | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="card-actions">
                <button class="btn-aprobar" (click)="aprobarEntrada(e.id)" [style.display]="isAdmin() ? 'flex' : 'none'">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Aprobar
                </button>
                @if (!isAdmin()) {
                  <button class="btn-info" disabled>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Pendiente de aprobación
                  </button>
                }
                <button class="btn-rechazar" (click)="abrirModalRechazo(e.id)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                  Rechazar
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (!cargando() && entradasTodas().length > 0 && vistaActual() === 'todas') {
        <div class="cards-grid">
          @for (e of entradasTodas(); track e.id) {
            <div class="card-validacion">
              <div class="card-header">
                <div class="card-id">
                  <span [class]="getBadgeClass(e.idEstado)">{{ e.estado }}</span>
                  <span class="entrada-id">Entrada #{{ e.id }}</span>
                </div>
                <span class="fecha">{{ formatFecha(e.fechaCreacion) }}</span>
              </div>

              <div class="card-body">
                <div class="info-section">
                  <h4>Datos del Documento</h4>
                  <div class="info-row">
                    <span class="label">Proveedor:</span>
                    <span class="value">{{ e.proveedor || 'Sin proveedor' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Documento:</span>
                    <span class="value">{{ e.tipoDocumento }} - {{ e.numeroDocumento || 'Sin número' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Usuario:</span>
                    <span class="value">{{ e.usuarioCreacion }}</span>
                  </div>
                </div>

                @if (e.detalles && e.detalles.length > 0) {
                  <div class="info-section">
                    <h4>Detalles</h4>
                    @for (d of e.detalles; track d.id) {
                      <div class="detalle-item">
                        <span class="torta-nombre">{{ d.insumo }}</span>
                        <span class="torta-cant">x{{ d.cantidad }}</span>
                        <span class="torta-precio">S/. {{ (d.precioUnitario * d.cantidad).toFixed(2) }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="card-actions">
                <button class="btn-historial" (click)="verHistorial(e.id)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Ver Historial
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (showRechazoModal()) {
        <div class="modal-overlay" (click)="cerrarModalRechazo()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Rechazar Entrada</h3>
              <button class="modal-cerrar" (click)="cerrarModalRechazo()">×</button>
            </div>
            <div class="modal-body">
              <p>¿Por qué rechazas esta entrada?</p>
              <div class="form-group">
                <textarea [(ngModel)]="motivoRechazo" rows="4" placeholder="Motivo del rechazo..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-sec" (click)="cerrarModalRechazo()">Cancelar</button>
              <button class="btn-peligro" [disabled]="!motivoRechazo()" (click)="confirmarRechazo()">
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      }

      @if (imagenAmpliada()) {
        <div class="modal-imagen" (click)="cerrarImagen()">
          <img [src]="imagenAmpliada()!" alt="Documento">
          <button class="cerrar-imagen" (click)="cerrarImagen()">×</button>
        </div>
      }

      @if (showHistorialModal()) {
        <div class="modal-overlay" (click)="cerrarHistorialModal()">
          <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Historial de Cambios</h3>
              <button class="modal-cerrar" (click)="cerrarHistorialModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="historial-list">
                @for (h of historialActual(); track h.id) {
                  <div class="historial-item">
                    <div class="historial-icon" [class]="h.accion.toLowerCase()">
                      @if (h.accion === 'Registrado') { <span>📝</span> }
                      @else if (h.accion === 'Aprobado') { <span>✅</span> }
                      @else if (h.accion === 'Rechazado') { <span>❌</span> }
                      @else { <span>📋</span> }
                    </div>
                    <div class="historial-content">
                      <div class="historial-accion">{{ h.accion }}</div>
                      @if (h.observacion) {
                        <div class="historial-obs">{{ h.observacion }}</div>
                      }
                      <div class="historial-meta">
                        <span class="historial-user">{{ h.usuario }}</span>
                        <span class="historial-fecha">{{ formatFecha(h.fecha) }}</span>
                      </div>
                    </div>
                  </div>
                }
                @if (historialActual().length === 0) {
                  <p class="no-hay">No hay registros de auditoría</p>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .validacion-page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .toggle-group { display: flex; background: #f3f4f6; border-radius: 10px; padding: 4px; }
    .toggle-group button { padding: 8px 20px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-weight: 500; color: #6b7280; transition: all 0.2s; }
    .toggle-group button.active { background: white; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; }
    .filtros-section { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .filtros-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .filtros-row select, .filtros-row input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-width: 150px; }
    .filtros-row select:focus, .filtros-row input:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
    .btn-buscar { background: #059669; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-buscar:hover { background: #047857; }
    .btn-limpiar { background: #fff; color: #374151; border: 1px solid #d1d5db; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-limpiar:hover { background: #f9fafb; }
    .ph-l { display: flex; align-items: center; gap: 16px; }
    .ph-ico { width: 52px; height: 52px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
    .ph-ico svg { width: 26px; height: 26px; }
    .ph-t { margin: 0; font-size: 24px; font-weight: 700; color: #111; }
    .ph-s { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
    .count-pill { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 80px; color: #aaa; background: #f9fafb; border-radius: 16px; margin: 20px 0; }
    .empty-state svg { margin-bottom: 16px; opacity: 0.5; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; margin-top: 20px; }
    .card-validacion { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s; }
    .card-validacion:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); border-color: #d1d5db; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: linear-gradient(to right, #f9fafb, #fff); border-bottom: 1px solid #e5e7eb; }
    .card-id { display: flex; align-items: center; gap: 10px; }
    .badge { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .badge--warning { background: #fef3c7; color: #b45309; }
    .badge--success { background: #d1fae5; color: #047857; }
    .badge--danger { background: #fee2e2; color: #b91c1c; }
    .entrada-id { font-size: 14px; font-weight: 600; color: #374151; }
    .fecha { font-size: 13px; color: #6b7280; }
    .card-body { padding: 20px; }
    .info-section { margin-bottom: 20px; }
    .info-section h4 { margin: 0 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; }
    .info-row { display: flex; align-items: center; gap: 12px; color: #4b5563; font-size: 14px; margin-bottom: 8px; }
    .info-row .label { color: #6b7280; min-width: 90px; font-weight: 500; }
    .info-row .value { color: #111; font-weight: 500; }
    .observaciones { margin: 0; color: #4b5563; font-size: 14px; font-style: italic; }
    .comprobante-preview { position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px dashed #d1d5db; }
    .comprobante-preview img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
    .comprobante-preview .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.2s; }
    .comprobante-preview:hover .overlay { opacity: 1; }
    .detalle-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e5e7eb; font-size: 14px; }
    .detalle-item:last-child { border-bottom: none; }
    .insumo-nombre { flex: 1; color: #374151; font-weight: 500; }
    .insumo-cant { color: #6b7280; margin-right: 16px; }
    .insumo-precio { font-weight: 600; color: #059669; }
    .card-actions { display: flex; gap: 12px; padding: 16px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .btn-aprobar, .btn-rechazar, .btn-historial { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; justify-content: center; transition: all 0.2s; }
    .btn-aprobar { background: #059669; color: white; }
    .btn-aprobar:hover { background: #047857; transform: translateY(-1px); }
    .btn-rechazar { background: #fee2e2; color: #dc2626; }
    .btn-rechazar:hover { background: #fecaca; transform: translateY(-1px); }
    .btn-historial { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .btn-historial:hover { background: #e5e7eb; transform: translateY(-1px); }
    .btn-info { background: #fef3c7; color: #92400e; border: none; flex: 1; }
    .btn-info:disabled { opacity: 0.7; cursor: not-allowed; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: white; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #111; }
    .modal-cerrar { background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af; padding: 4px; line-height: 1; }
    .modal-cerrar:hover { color: #374151; }
    .modal-body { padding: 24px; }
    .modal-body p { margin: 0 0 16px; color: #4b5563; }
    .form-group textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; }
    .form-group textarea:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; border-radius: 0 0 16px 16px; }
    .btn-sec, .btn-peligro { padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-sec { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .btn-sec:hover { background: #f3f4f6; }
    .btn-peligro { background: #dc2626; color: white; border: none; }
    .btn-peligro:hover { background: #b91c1c; }
    .btn-peligro:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal-imagen { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 1001; backdrop-filter: blur(8px); }
    .modal-imagen img { max-width: 90vw; max-height: 90vh; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .cerrar-imagen { position: absolute; top: 20px; right: 20px; background: white; border: none; font-size: 24px; cursor: pointer; padding: 12px 20px; border-radius: 8px; font-weight: 600; }
    .cerrar-imagen:hover { background: #f3f4f6; }
    .historial-section { padding: 20px; background: white; border-radius: 12px; margin-top: 16px; border: 1px solid #e5e7eb; }
    .historial-list { display: flex; flex-direction: column; gap: 12px; }
    .historial-item { display: flex; gap: 14px; padding: 14px; background: #f9fafb; border-radius: 10px; transition: all 0.2s; }
    .historial-item:hover { background: #f3f4f6; }
    .historial-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; border-radius: 50%; }
    .historial-icon.registrado { background: #dbeafe; color: #2563eb; }
    .historial-icon.aprobado { background: #d1fae5; color: #059669; }
    .historial-icon.rechazado { background: #fee2e2; color: #dc2626; }
    .historial-content { flex: 1; }
    .historial-accion { font-weight: 600; color: #111; font-size: 14px; }
    .historial-obs { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .historial-meta { display: flex; gap: 12px; font-size: 12px; color: #9ca3af; margin-top: 8px; }
    .historial-user { font-weight: 500; color: #6b7280; }
    .no-hay { text-align: center; color: #9ca3af; padding: 24px; font-size: 14px; }
  `]
})
export class AdminValidarEntradasComponent implements OnInit {
entradasPendientes = signal<EntradaValidacion[]>([]);
  entradasTodas = signal<EntradaValidacion[]>([]);
  showRechazoModal = signal(false);
  idRechazando = signal<number | null>(null);
  motivoRechazo = signal('');
  procesando = signal(false);
  cargando = signal(false);
  imagenAmpliada = signal<string | null>(null);
  vistaActual = signal<'pendientes' | 'todas'>('pendientes');
  filtroEstado = signal<number | null>(null);
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');
  historialActual = signal<HistorialItem[]>([]);
  showHistorialModal = signal(false);
  idHistorial = signal<number | null>(null);

  constructor(private entradaService: EntradaInsumoService) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cambiarVista(vista: 'pendientes' | 'todas'): void {
    this.vistaActual.set(vista);
    if (vista === 'todas' && this.entradasTodas().length === 0) {
      this.cargarTodas();
    }
  }

  cargarTodas(): void {
    this.cargando.set(true);
    const filtro: any = {};
    if (this.filtroEstado()) filtro.idEstado = this.filtroEstado();
    if (this.filtroFechaInicio()) filtro.fechaInicio = this.filtroFechaInicio();
    if (this.filtroFechaFin()) filtro.fechaFin = this.filtroFechaFin();
    filtro.pagina = 1;
    filtro.tamanioPagina = 50;

    this.entradaService.obtenerTodos(filtro).subscribe({
      next: (data) => {
        console.log('ObtenerTodos response:', data);
        if (data && data.items) {
          this.entradasTodas.set(data.items);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error obtenerTodos:', err);
        this.cargando.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstado.set(null);
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.cargarTodas();
  }

  verHistorial(idEntrada: number): void {
    this.idHistorial.set(idEntrada);
    this.entradaService.obtenerHistorial(idEntrada).subscribe({
      next: (data) => {
        this.historialActual.set(data);
        this.showHistorialModal.set(true);
      },
      error: () => {
        this.historialActual.set([]);
        this.showHistorialModal.set(true);
      }
    });
  }

  cerrarHistorialModal(): void {
    this.showHistorialModal.set(false);
    this.idHistorial.set(null);
    this.historialActual.set([]);
  }

  getBadgeClass(estado: number): string {
    switch (estado) {
      case 1: return 'badge--warning';
      case 2: return 'badge--success';
      case 3: return 'badge--danger';
      default: return '';
    }
  }

  getEstadoTexto(estado: number): string {
    switch (estado) {
      case 1: return 'Pendiente';
      case 2: return 'Aprobado';
      case 3: return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  cargarPendientes(): void {
    this.cargando.set(true);
    this.entradaService.obtenerPendientes().subscribe({
      next: (data) => {
        this.entradasPendientes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  aprobarEntrada(idEntrada: number): void {
    this.procesando.set(true);
    const dto: EntradaInsumoAprobarDTO = { 
      id: idEntrada, 
      usuario: this.getUsuario(),
      rol: this.getRol()
    };
    this.entradaService.aprobar(dto).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargarPendientes();
        if (this.vistaActual() === 'todas') {
          this.cargarTodas();
        }
      },
      error: () => {
        this.procesando.set(false);
      }
    });
  }

  abrirModalRechazo(idEntrada: number): void {
    this.idRechazando.set(idEntrada);
    this.motivoRechazo.set('');
    this.showRechazoModal.set(true);
  }

  cerrarModalRechazo(): void {
    this.showRechazoModal.set(false);
    this.idRechazando.set(null);
    this.motivoRechazo.set('');
  }

  confirmarRechazo(): void {
    const id = this.idRechazando();
    const motivo = this.motivoRechazo();
    if (!id || !motivo) return;

    const dto: EntradaInsumoRechazarDTO = { id, motivo, usuario: this.getUsuario() };
    this.entradaService.rechazar(dto).subscribe({
      next: () => {
        this.cerrarModalRechazo();
        this.cargarPendientes();
        if (this.vistaActual() === 'todas') {
          this.cargarTodas();
        }
      },
      error: () => {
        this.cerrarModalRechazo();
      }
    });
  }

  abrirImagen(url: string): void {
    this.imagenAmpliada.set(url);
  }

  cerrarImagen(): void {
    this.imagenAmpliada.set(null);
  }

  private getUsuario(): string {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user).username || 'admin';
    }
    return 'admin';
  }

  private getRol(): string {
    const user = localStorage.getItem('user');
    if (user) {
      const roles = JSON.parse(user).roles;
      return roles && roles.length > 0 ? roles[0] : '';
    }
    return '';
  }

  isAdmin(): boolean {
    const rol = this.getRol();
    return rol.toLowerCase() === 'administrador';
  }

  get todasEntradas() {
    return this.entradasTodas;
  }
}