import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../../services/venta.service';
import { RepartidorDTO } from '../../../models/venta-dto';

interface DeliveryItem {
  id: number;
  idVenta: number;
  fechaVenta: string;
  cliente: string;
  clienteTelefono: string;
  direccion: string;
  referencia: string;
  telefonoContacto: string;
  nombreContacto: string;
  costoDelivery: number;
  idEstadoEntrega: number;
  estado: string;
  fechaAsignacion: string | null;
  fechaEntrega: string | null;
  idPersonalRepartidor: number | null;
}

interface EstadoEntrega {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-admin-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="delivery-page">
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Delivery</h2>
            <p class="ph-s">Gestiona los pedidos para entrega a domicilio</p>
          </div>
        </div>
      </header>

      <div class="filtros">
        <div class="filtro-group">
          <label class="lbl">Estado</label>
          <select class="sel" [(ngModel)]="filtroEstado" (ngModelChange)="cargarDeliveries()">
            <option [ngValue]="0">Todos</option>
            @for (e of estadosEntrega(); track e.id) {
              <option [ngValue]="e.id">{{ e.nombre }}</option>
            }
          </select>
        </div>
        <button class="btn-refresh" (click)="cargarDeliveries()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando deliveries...</p>
        </div>
      }

      @if (!cargando()) {
        <div class="delivery-list">
          @if (deliveries().length === 0) {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
                <rect x="1" y="3" width="15" height="13" rx="1"/>
                <path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <p>No hay pedidos de delivery</p>
            </div>
          }

          @for (d of deliveries(); track d.id) {
            <div class="delivery-card" [class.entregado]="d.idEstadoEntrega === 3" [class.cancelado]="d.idEstadoEntrega === 4" [class.en-camino]="d.idEstadoEntrega === 2">
              <div class="card-header">
                <div class="card-id">
                  <span class="badge-estado" [class]="getEstadoClase(d.idEstadoEntrega)">{{ d.estado }}</span>
                  <span class="venta-id">Venta #{{ d.idVenta }}</span>
                </div>
                <span class="fecha">{{ formatFecha(d.fechaVenta) }}</span>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <strong>{{ d.cliente }}</strong>
                    @if (d.clienteTelefono) {
                      <span class="tel">{{ d.clienteTelefono }}</span>
                    }
                  </div>
                </div>

                <div class="info-row">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <span>{{ d.direccion }}</span>
                    @if (d.referencia) {
                      <span class="ref">Ref: {{ d.referencia }}</span>
                    }
                  </div>
                </div>

                @if (d.nombreContacto || d.telefonoContacto) {
                  <div class="info-row">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                    <div>
                      @if (d.nombreContacto) {
                        <span>{{ d.nombreContacto }}</span>
                      }
                      @if (d.telefonoContacto) {
                        <span class="tel">{{ d.telefonoContacto }}</span>
                      }
                    </div>
                  </div>
                }

                <div class="info-row costo">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <span>Costo delivery: <strong>S/. {{ d.costoDelivery.toFixed(2) }}</strong></span>
                </div>
              </div>

              <div class="card-actions">
                @if (d.idEstadoEntrega === 1 && d.idPersonalRepartidor) {
                  <button class="btn-accion btn-iniciar" (click)="avanzarEstado(d.id, 2)" title="Iniciar delivery">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Iniciar
                  </button>
                  <button class="btn-accion btn-cancelar" (click)="cancelarEntrega(d.id)" title="Cancelar pedido">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Cancelar
                  </button>
                }
                @if (d.idEstadoEntrega === 1 && !d.idPersonalRepartidor) {
                  <button class="btn-accion btn-asignar" (click)="abrirModalRepartidor(d.id)" title="Asignar repartidor">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Asignar Repartidor
                  </button>
                  <button class="btn-accion btn-cancelar" (click)="cancelarEntrega(d.id)" title="Cancelar pedido">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Cancelar
                  </button>
                }
                @if (d.idEstadoEntrega === 2) {
                  <button class="btn-accion btn-entregar" (click)="avanzarEstado(d.id, 3)" title="Marcar como entregado">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Entregado
                  </button>
                  <button class="btn-accion btn-cancelar" (click)="cancelarEntrega(d.id)" title="Cancelar pedido">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Cancelar
                  </button>
                }
                @if (d.idEstadoEntrega === 3) {
                  <span class="estado-final">✓ Entregado</span>
                }
                @if (d.idEstadoEntrega === 4) {
                  <span class="estado-cancelado">✕ Cancelado</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showCancelModal()) {
      <div class="modal-overlay" (click)="cerrarCancelModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Cancelar Entrega</h3>
            <button class="modal-cerrar" (click)="cerrarCancelModal()">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de cancelar esta entrega?</p>
            <div class="form-group">
              <label class="lbl">Motivo de cancelación *</label>
              <textarea class="inp" [(ngModel)]="motivoCancelacion" placeholder="Ingresa el motivo..." rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-sec" (click)="cerrarCancelModal()">No, mantener</button>
            <button class="btn-peligro" (click)="confirmarCancelacion()" [disabled]="!motivoCancelacion()">Sí, cancelar</button>
          </div>
        </div>
      </div>
    }

    @if (showRepartidorModal()) {
      <div class="modal-overlay" (click)="cerrarModalRepartidor()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Asignar Repartidor</h3>
            <button class="modal-cerrar" (click)="cerrarModalRepartidor()">✕</button>
          </div>
          <div class="modal-body">
            <p>Selecciona el repartidor para este pedido:</p>
            <div class="form-group">
              <label class="lbl">Repartidor *</label>
              <select class="sel" [(ngModel)]="repartidorSeleccionado">
                <option [ngValue]="null">-- Selecciona un repartidor --</option>
                @for (d of drivers(); track d.id) {
                  <option [ngValue]="d.id">{{ d.nombre }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-sec" (click)="cerrarModalRepartidor()">Cancelar</button>
            <button class="btn-primary" (click)="confirmarAsignacion()" [disabled]="!repartidorSeleccionado()">Asignar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .delivery-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .ph-l { display: flex; align-items: center; gap: 12px; }
    .ph-ico { width: 44px; height: 44px; background: linear-gradient(135deg, #550F26 0%, #7a1f45 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .ph-ico svg { width: 24px; height: 24px; }
    .ph-t { margin: 0; font-size: 20px; font-weight: 600; color: #333; }
    .ph-s { margin: 4px 0 0; font-size: 13px; color: #888; }

    .filtros { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; }
    .filtro-group { display: flex; flex-direction: column; gap: 6px; }
    .lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .sel { padding: 8px 32px 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; background: #fff; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b6e65' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #fff; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; cursor: pointer; color: #555; }
    .btn-refresh:hover { border-color: #550F26; color: #550F26; }

    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 32px; height: 32px; border: 3px solid #f0e9e6; border-top-color: #550F26; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px; color: #aaa; }
    .empty-state p { margin-top: 16px; font-size: 15px; }

    .delivery-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .delivery-card { background: #fff; border: 1px solid #eee; border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .delivery-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .delivery-card.entregado { border-left: 4px solid #22c55e; }
    .delivery-card.cancelado { border-left: 4px solid #ef4444; }
    .delivery-card.en-camino { border-left: 4px solid #f59e0b; }

    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #faf8f6; border-bottom: 1px solid #eee; }
    .card-id { display: flex; align-items: center; gap: 10px; }
    .badge-estado { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-estado.pendiente { background: #fef3c7; color: #d97706; }
    .badge-estado.en-camino { background: #dbeafe; color: #2563eb; }
    .badge-estado.entregado { background: #dcfce7; color: #16a34a; }
    .badge-estado.cancelado { background: #fee2e2; color: #dc2626; }
    .venta-id { font-size: 13px; font-weight: 600; color: #333; }
    .fecha { font-size: 12px; color: #888; }

    .card-body { padding: 16px; }
    .info-row { display: flex; gap: 10px; margin-bottom: 12px; color: #555; font-size: 13px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-row svg { color: #888; flex-shrink: 0; margin-top: 2px; }
    .info-row div { display: flex; flex-direction: column; gap: 2px; }
    .info-row strong { color: #333; font-weight: 500; }
    .info-row .tel { color: #666; font-size: 12px; }
    .info-row .ref { color: #888; font-size: 12px; font-style: italic; }
    .info-row.costo { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #eee; }
    .info-row.costo strong { color: #550F26; font-size: 14px; }

    .card-actions { padding: 12px 16px; background: #faf8f6; border-top: 1px solid #eee; display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-accion { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn-iniciar { background: #3b82f6; color: #fff; }
    .btn-iniciar:hover { background: #2563eb; }
    .btn-entregar { background: #22c55e; color: #fff; }
    .btn-entregar:hover { background: #16a34a; }
    .btn-cancelar { background: #fee2e2; color: #dc2626; }
    .btn-cancelar:hover { background: #fecaca; }
    .btn-asignar { background: #7c3aed; color: #fff; }
    .btn-asignar:hover { background: #6d28d9; }
    .estado-final { color: #16a34a; font-weight: 600; font-size: 13px; }
    .estado-cancelado { color: #dc2626; font-weight: 600; font-size: 13px; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: #fff; border-radius: 12px; width: 100%; max-width: 420px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
    .modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .modal-cerrar { background: none; border: none; font-size: 18px; cursor: pointer; color: #888; }
    .modal-body { padding: 20px; }
    .modal-body p { margin: 0 0 16px; color: #555; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .inp { padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; resize: vertical; }
    .inp:focus { outline: none; border-color: #550F26; }
    .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 20px; border-top: 1px solid #eee; }
    .btn-sec, .btn-peligro, .btn-primary { padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-sec { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
    .btn-peligro { background: #dc2626; color: #fff; border: none; }
    .btn-peligro:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #7c3aed; color: #fff; border: none; }
    .btn-primary:hover { background: #6d28d9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AdminDeliveryComponent implements OnInit {
  deliveries = signal<DeliveryItem[]>([]);
  estadosEntrega = signal<EstadoEntrega[]>([]);
  cargando = signal(false);
  filtroEstado = signal(0);

  showCancelModal = signal(false);
  idCancelando = signal<number | null>(null);
  motivoCancelacion = signal('');

  showRepartidorModal = signal(false);
  idDeliveryAsignando = signal<number | null>(null);
  drivers = signal<RepartidorDTO[]>([]);
  repartidorSeleccionado = signal<number | null>(null);

  constructor(private svc: VentaService) {}

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarDeliveries();
  }

  cargarEstados(): void {
    this.svc.obtenerComboEstadoEntrega().subscribe({
      next: (data: any[]) => this.estadosEntrega.set(data),
      error: (e: any) => console.error('Error cargando estados:', e)
    });
  }

  cargarDeliveries(): void {
    this.cargando.set(true);
    this.svc.obtenerListadoDeliveries().subscribe({
      next: (data) => {
        const filtered = this.filtroEstado() === 0 
          ? data 
          : data.filter((d: DeliveryItem) => d.idEstadoEntrega === this.filtroEstado());
        this.deliveries.set(filtered);
        this.cargando.set(false);
      },
      error: (e) => {
        console.error('Error cargando deliveries:', e);
        this.cargando.set(false);
      }
    });
  }

  avanzarEstado(idDelivery: number, nuevoEstado: number): void {
    this.svc.actualizarEstadoDelivery(idDelivery, nuevoEstado).subscribe({
      next: () => this.cargarDeliveries(),
      error: (e) => {
        console.error('Error actualizando estado:', e);
        alert('Error al actualizar el estado');
      }
    });
  }

  cancelarEntrega(id: number): void {
    this.idCancelando.set(id);
    this.motivoCancelacion.set('');
    this.showCancelModal.set(true);
  }

  cerrarCancelModal(): void {
    this.showCancelModal.set(false);
    this.idCancelando.set(null);
    this.motivoCancelacion.set('');
  }

  confirmarCancelacion(): void {
    const id = this.idCancelando();
    if (!id || !this.motivoCancelacion()) return;

    this.svc.cancelarEntrega(id, this.motivoCancelacion()).subscribe({
      next: () => {
        this.cerrarCancelModal();
        this.cargarDeliveries();
      },
      error: (e) => {
        console.error('Error cancelando:', e);
        alert('Error al cancelar la entrega');
      }
    });
  }

  getEstadoClase(idEstado: number): string {
    switch (idEstado) {
      case 1: return 'pendiente';
      case 2: return 'en-camino';
      case 3: return 'entregado';
      case 4: return 'cancelado';
      default: return 'pendiente';
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  abrirModalRepartidor(idDelivery: number): void {
    this.idDeliveryAsignando.set(idDelivery);
    this.repartidorSeleccionado.set(null);
    this.svc.obtenerComboDrivers().subscribe({
      next: (data) => {
        this.drivers.set(data);
        this.showRepartidorModal.set(true);
      },
      error: (e) => {
        console.error('Error cargando drivers:', e);
        alert('Error al cargar la lista de repartidores');
      }
    });
  }

  cerrarModalRepartidor(): void {
    this.showRepartidorModal.set(false);
    this.idDeliveryAsignando.set(null);
    this.repartidorSeleccionado.set(null);
  }

  confirmarAsignacion(): void {
    const idDelivery = this.idDeliveryAsignando();
    const idDriver = this.repartidorSeleccionado();
    if (!idDelivery || !idDriver) return;

    this.svc.asignarRepartidor(idDelivery, idDriver).subscribe({
      next: () => {
        this.cerrarModalRepartidor();
        this.cargarDeliveries();
      },
      error: (e) => {
        console.error('Error asignando repartidor:', e);
        alert('Error al asignar el repartidor');
      }
    });
  }
}