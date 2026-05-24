import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';

interface Pedido {
  id: number;
  fecha: string;
  total: number;
  estadoPago: string;
  productos: string;
  cantidad: number;
  tipoEntrega: string;
  deliveryEstado?: string;
  deliveryDireccion?: string;
  deliveryTelefono?: string;
  metodoPago: string;
}

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pedidos-container">
      <div class="pedidos-header">
        <h1>🧾 Mis Pedidos</h1>
        <p>Historial de tus compras</p>
      </div>

      @if (!isLoggedIn) {
        <div class="no-auth">
          <p>Debes iniciar sesión para ver tus pedidos.</p>
          <button class="btn-primary" routerLink="/iniciar">Iniciar Sesión</button>
        </div>
      } @else if (cargando) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      } @else if (pedidos.length === 0) {
        <div class="sin-pedidos">
          <p>No tienes pedidos todavía.</p>
          <button class="btn-primary" routerLink="/products">Ver Productos</button>
        </div>
      } @else {
        <div class="pedidos-list">
          @for (pedido of pedidos; track pedido.id) {
            <div class="pedido-card">
              <div class="pedido-header">
                <div class="pedido-id">Pedido #{{ pedido.id }}</div>
                <div class="pedido-fecha">{{ pedido.fecha | date:'dd/MM/yyyy HH:mm' }}</div>
              </div>
              
              <div class="pedido-body">
                <div class="pedido-productos">
                  <strong>{{ pedido.productos }}</strong>
                  <span class="cantidad">x{{ pedido.cantidad }}</span>
                </div>
                
                <div class="pedido-detalles">
                  <div class="detalle-item">
                    <span class="label">Tipo:</span>
                    <span class="value">{{ pedido.tipoEntrega }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="label">Pago:</span>
                    <span class="value">{{ pedido.metodoPago }}</span>
                  </div>
                  <div class="detalle-item">
                    <span class="label">Estado:</span>
                    <span class="badge" [class]="getEstadoClase(pedido.estadoPago)">{{ pedido.estadoPago }}</span>
                  </div>
                  @if (pedido.deliveryEstado) {
                    <div class="detalle-item">
                      <span class="label">Delivery:</span>
                      <span class="badge" [class]="getDeliveryClase(pedido.deliveryEstado)">{{ pedido.deliveryEstado }}</span>
                    </div>
                  }
                </div>
              </div>
              
              <div class="pedido-footer">
                <div class="pedido-total">
                  <span>Total:</span>
                  <strong>S/ {{ pedido.total.toFixed(2) }}</strong>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pedidos-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .pedidos-header { text-align: center; margin-bottom: 32px; }
    .pedidos-header h1 { font-family: 'Playfair Display', serif; color: #550F26; margin-bottom: 8px; }
    .pedidos-header p { color: #666; }
    
    .no-auth, .sin-pedidos, .loading { text-align: center; padding: 60px; background: #faf8f6; border-radius: 12px; }
    .no-auth p, .sin-pedidos p, .loading p { color: #666; margin-bottom: 20px; }
    
    .spinner { width: 40px; height: 40px; border: 3px solid #ddd; border-top-color: #550F26; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .btn-primary { background: #550F26; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-primary:hover { background: #6d1430; }
    
    .pedidos-list { display: flex; flex-direction: column; gap: 16px; }
    
    .pedido-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    
    .pedido-header { background: linear-gradient(135deg, #550F26, #7a1f45); padding: 16px 20px; display: flex; justify-content: space-between; color: #fff; }
    .pedido-id { font-weight: 600; }
    .pedido-fecha { font-size: 13px; opacity: 0.9; }
    
    .pedido-body { padding: 20px; }
    .pedido-productos { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .pedido-productos strong { color: #333; font-size: 15px; }
    .cantidad { background: #f5f5f5; padding: 4px 10px; border-radius: 12px; font-size: 13px; color: #666; }
    
    .pedido-detalles { display: flex; flex-wrap: wrap; gap: 16px; }
    .detalle-item { display: flex; gap: 8px; align-items: center; }
    .detalle-item .label { color: #888; font-size: 13px; }
    .detalle-item .value { color: #333; font-size: 14px; }
    
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge--pagado { background: #dff7df; color: #2e7d32; }
    .badge--pendiente { background: #fff3e0; color: #e65100; }
    .badge--cancelado { background: #ffebee; color: #c62828; }
    .badge--entregado { background: #d1e7ff; color: #1565c0; }
    .badge--encamino { background: #fff8e1; color: #f9a825; }
    .badge--default { background: #f5f5f5; color: #666; }
    
    .pedido-footer { padding: 16px 20px; background: #fafafa; display: flex; justify-content: flex-end; }
    .pedido-total { display: flex; gap: 12px; align-items: center; }
    .pedido-total span { color: #666; }
    .pedido-total strong { font-size: 20px; color: #550F26; font-family: Georgia, serif; }
  `]
})
export class ClientePedidosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;
  
  isLoggedIn = false;
  cargando = false;
  pedidos: Pedido[] = [];

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.cargarPedidos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarPedidos(): void {
    const persona = this.auth.getPersona();
    if (!persona?.id) return;

    this.cargando = true;
    this.http.get<Pedido[]>(`${this.apiUrl}/Venta/MisPedidos?idPersona=${persona.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pedidos = data;
          this.cargando = false;
        },
        error: () => {
          this.cargando = false;
          this.pedidos = [];
        }
      });
  }

  getEstadoClase(estado: string): string {
    const e = estado.toLowerCase();
    if (e.includes('pagado') || e.includes('completado')) return 'badge--pagado';
    if (e.includes('pendiente')) return 'badge--pendiente';
    if (e.includes('cancelado')) return 'badge--cancelado';
    return 'badge--default';
  }

  getDeliveryClase(estado: string): string {
    const e = estado?.toLowerCase();
    if (e?.includes('entregado')) return 'badge--entregado';
    if (e?.includes('camino')) return 'badge--encamino';
    if (e?.includes('pendiente')) return 'badge--pendiente';
    return 'badge--default';
  }
}