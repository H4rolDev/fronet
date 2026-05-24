import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { VentaService } from '../../services/venta.service';
import { AuthService } from '../../services/auth.service';
import { MetodoPagoDTO } from '../../models/venta-dto';
import { environment } from '../../environments/environment';

interface MetodoPago {
  id: string;
  nombre: string;
  icono: string;
  requiereQR: boolean;
  idBackend?: number;
}

@Component({
  selector: 'app-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pago-container">
      <div class="pago-header">
        <button class="btn-back" (click)="volver()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
        <h1>Finalizar Pedido</h1>
      </div>

      @if (carrito.length === 0) {
        <div class="pago-vacio">
          <p>Tu carrito está vacío</p>
          <button class="btn-primary" (click)="volver()">Ver Productos</button>
        </div>
      } @else {
        <div class="pago-grid">
          <!-- Columna izquierda: Datos -->
          <div class="pago-form">
            <!-- Cliente -->
            <div class="form-seccion">
              <h3>👤 Cliente</h3>
              @if (idPersona) {
                <div class="cliente-info">
                  <div class="cliente-nombre">{{ nombreCliente }}</div>
                  <div class="cliente-doc">{{ documentoCliente }}</div>
                  <div class="cliente-tel">{{ telefonoCliente }}</div>
                </div>
              } @else {
                <div class="campo">
                  <label>Seleccionar Cliente <span class="req">*</span></label>
                  <select [ngModel]="idPersona" (ngModelChange)="onPersonaChange($event)" class="sel-persona">
                    <option [ngValue]="null">— Seleccionar cliente —</option>
                    @for (p of personas; track p.id) {
                      <option [ngValue]="p.id">{{ p.nombres }} · {{ p.numeroDocumento }}</option>
                    }
                  </select>
                </div>
              }
            </div>

            <!-- Tipo de entrega -->
            <div class="form-seccion">
              <h3>📦 Tipo de Entrega</h3>
              <div class="entrega-opciones">
                <button class="entrega-btn" [class.active]="tipoEntrega === 'tienda'" (click)="tipoEntrega = 'tienda'">
                  <span class="entrega-icon">🏪</span>
                  <span class="entrega-text">
                    <strong>Recojo en tienda</strong>
                    <small>Av. Los Geranios 456, Lima</small>
                  </span>
                </button>
                <button class="entrega-btn" [class.active]="tipoEntrega === 'delivery'" (click)="tipoEntrega = 'delivery'">
                  <span class="entrega-icon">🛵</span>
                  <span class="entrega-text">
                    <strong>Delivery</strong>
                    <small>Recibe en tu domicilio</small>
                  </span>
                </button>
              </div>
            </div>

            <!-- Datos de delivery -->
            @if (tipoEntrega === 'delivery') {
              <div class="form-seccion">
                <h3>📍 Datos de Delivery</h3>
                <div class="campo">
                  <label>Dirección <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="direccion" placeholder="Av. Calle #123" />
                </div>
                <div class="campo">
                  <label>Referencia</label>
                  <input type="text" [(ngModel)]="referencia" placeholder="Casa color azul, cerca de..." />
                </div>
                <div class="campo">
                  <label>Teléfono de contacto <span class="req">*</span></label>
                  <input type="tel" [(ngModel)]="telefono" placeholder="999 888 777" />
                </div>
              </div>
            }

            <!-- Método de pago -->
            <div class="form-seccion">
              <h3>💳 Método de Pago</h3>
              <div class="metodos-pago">
                @for (m of metodosPago; track m.id) {
                  <button class="metodo-btn" [class.active]="metodoSeleccionado === m.id" (click)="seleccionarMetodo(m)">
                    <span class="metodo-icon">{{ m.icono }}</span>
                    <span class="metodo-nombre">{{ m.nombre }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Comprobante de pago -->
            <div class="form-seccion">
              <h3>📸 Comprobante de Pago @if (tipoEntrega === 'delivery') { <span class="req">*</span> } @else { <span class="opcional">(opcional)</span> }</h3>
              @if (tipoEntrega === 'delivery') {
              <div class="alert-info-box">
                <small>1. Realiza tu pago mediante Yape o transferencia</small><br>
                <small>2. Toma una foto del comprobante</small><br>
                <small>3. Sube la imagen y proporciona el número de operación</small>
              </div>
              } @else {
              <div class="alert-info-box">
                <small>El pago lo realizas al momento de recoger en tienda (efectivo o digital).</small><br>
                <small>Si deseas pagar por adelantado, sube tu comprobante aquí.</small>
              </div>
              }
              
              @if (!imagenPreview) {
                <div class="upload-zone" (click)="triggerFileInput()">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#aaa" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Haz clic para subir el comprobante</p>
                  <small>JPG, PNG (máx 5MB)</small>
                </div>
                <input type="file" id="input-comprobante" accept="image/*" (change)="onFileSelected($event)" style="display: none">
              } @else {
                <div class="preview-container">
                  <img [src]="imagenPreview" alt="Comprobante" class="preview-image">
                  <button type="button" class="btn-remove" (click)="quitarImagen()">✕</button>
                </div>
              }

              @if (subiendoImagen()) {
                <div class="subiendo-msg">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Subiendo imagen...
                </div>
              }
            </div>

            <!-- Campos para Yape -->
            @if (mostrarQR && metodoSeleccionado) {
              <div class="form-seccion qr-seccion">
                <h3>📱 Pago con Yape</h3>
                <p class="qr-instru">Escanea el código QR con tu app de Yape</p>
                <div class="qr-box">
                  @if (qrImageUrl) {
                    <img [src]="qrImageUrl" alt="QR Code" class="qr-img" />
                    <p class="yape-nombre">Beneficiario: Harol Avelino Delzo</p>
                  } @else {
                    <div class="qr-placeholder">
                      <span>📱</span>
                      <p>QR de Yape</p>
                    </div>
                  }
                </div>
                <div class="monto-qr">
                  <span>Monto a pagar:</span>
                  <strong>S/. {{ totalPagar.toFixed(2) }}</strong>
                </div>
                <div class="campo">
                  <label>Número de operación @if (tipoEntrega === 'delivery') { <span class="req">*</span> } @else { <span class="opcional">(opcional)</span> }</label>
                  <input type="text" [(ngModel)]="numeroOperacion" placeholder="Ingresa el número de operación" />
                </div>
              </div>
            }

            <!-- Campos para Efectivo -->
            @if (!mostrarQR && metodoSeleccionado && metodoSeleccionado !== '1' && metodoSeleccionado !== '2') {
              <div class="form-seccion">
                <h3>💵 Pago en Efectivo</h3>
                <p class="info-pago">El pago se realizará en efectivo al momento de recojer tu pedido en tienda o cuando el repartidor entregue tu orden.</p>
                <div class="monto-total">
                  <span>Total a pagar:</span>
                  <strong>S/. {{ totalPagar.toFixed(2) }}</strong>
                </div>
                <div class="campo">
                  <label>Monto con el que paga (opcional)</label>
                  <input type="number" [(ngModel)]="montoRecibido" placeholder="Ej: 50.00" min="0" step="0.50" />
                </div>
                @if (montoRecibido > 0) {
                  <div class="vuelto-calculo">
                    <span>Vuelto:</span>
                    <strong>S/. {{ (montoRecibido - totalPagar).toFixed(2) }}</strong>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Columna derecha: Resumen -->
          <div class="pago-resumen">
            <h3>📋 Resumen del Pedido</h3>
            <div class="resumen-items">
              @for (item of carrito; track item.id) {
                <div class="resumen-item">
                  <div class="ri-info">
                    <span class="ri-nombre">{{ item.nombre }}</span>
                    <span class="ri-cant">x{{ item.cantidad }}</span>
                  </div>
                  <span class="ri-precio">S/. {{ (item.precio * item.cantidad).toFixed(2) }}</span>
                </div>
              }
            </div>
            <div class="resumen-totales">
              <div class="rt-row">
                <span>Subtotal</span>
                <span>S/. {{ subtotal.toFixed(2) }}</span>
              </div>
              @if (tipoEntrega === 'delivery') {
                <div class="rt-row">
                  <span>Delivery</span>
                  <span>S/. {{ costoDelivery.toFixed(2) }}</span>
                </div>
              }
              <div class="rt-row total">
                <span>Total a pagar</span>
                <span>S/. {{ totalPagar.toFixed(2) }}</span>
              </div>
            </div>
            @if (error) {
              <div class="error-msg">{{ error }}</div>
            }
            <button class="btn-confirmar" (click)="confirmarPedido()" [disabled]="!puedeConfirmar || guardando">
              @if (guardando) { Registrando... }
              @else { Confirmar Pedido }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .pago-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .pago-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .btn-back { display: flex; align-items: center; gap: 6px; background: none; border: none; color: #666; cursor: pointer; font-size: 14px; }
    .btn-back:hover { color: #550F26; }
    .pago-header h1 { margin: 0; font-size: 24px; color: #333; }
    
    .pago-vacio { text-align: center; padding: 60px; background: #faf8f6; border-radius: 12px; }
    .pago-vacio p { color: #666; margin-bottom: 20px; }
    
    .btn-primary { background: #550F26; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    
    .pago-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; }
    @media (max-width: 900px) { .pago-grid { grid-template-columns: 1fr; } }
    
    .form-seccion { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .form-seccion h3 { margin: 0 0 16px; font-size: 16px; color: #333; }
    
    .entrega-opciones { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .entrega-btn { display: flex; align-items: center; gap: 12px; padding: 16px; background: #faf8f6; border: 2px solid #eee; border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.2s; }
    .entrega-btn:hover { border-color: #ddd; }
    .entrega-btn.active { border-color: #550F26; background: #fdf8f6; }
    .entrega-icon { font-size: 28px; }
    .entrega-text strong { display: block; color: #333; font-size: 14px; }
    .entrega-text small { color: #888; font-size: 12px; }
    
    .campo { margin-bottom: 12px; }
    .campo label { display: block; font-size: 13px; color: #555; margin-bottom: 6px; }
    .req { color: #e74c3c; }
    .opcional { color: #999; font-weight: normal; font-size: 12px; }
    .campo input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    .campo input:focus { outline: none; border-color: #550F26; }
    
    .metodos-pago { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .metodo-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 8px; background: #faf8f6; border: 2px solid #eee; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .metodo-btn:hover { border-color: #ddd; }
    .metodo-btn.active { border-color: #550F26; background: #fdf8f6; }
    .metodo-icon { font-size: 28px; }
    .metodo-nombre { font-size: 12px; color: #555; }
    
    .qr-seccion { text-align: center; }
    .qr-instru { color: #666; margin-bottom: 16px; }
    .qr-box { background: #fff; border: 2px dashed #ddd; border-radius: 12px; padding: 20px; margin-bottom: 16px; display: inline-block; }
    .qr-img { max-width: 200px; height: auto; }
    .qr-placeholder { padding: 40px; text-align: center; color: #888; }
    .qr-placeholder span { font-size: 48px; display: block; margin-bottom: 8px; }
    .monto-qr { background: #fdf8f6; padding: 12px 24px; border-radius: 8px; margin-bottom: 16px; display: inline-block; }
    .monto-qr span { color: #666; }
    .monto-qr strong { display: block; font-size: 24px; color: #550F26; font-family: Georgia, serif; }
    
    .pago-resumen { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 20px; height: fit-content; position: sticky; top: 20px; }
    .pago-resumen h3 { margin: 0 0 16px; font-size: 16px; color: #333; }
    .resumen-items { max-height: 300px; overflow-y: auto; margin-bottom: 16px; }
    .resumen-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f1ee; }
    .ri-info { display: flex; gap: 8px; }
    .ri-nombre { font-size: 14px; color: #333; }
    .ri-cant { color: #888; font-size: 13px; }
    .ri-precio { font-weight: 600; color: #550F26; }
    
    .resumen-totales { border-top: 2px solid #eee; padding-top: 16px; }
    .rt-row { display: flex; justify-content: space-between; padding: 8px 0; color: #666; }
    .rt-row.total { border-top: 1px solid #eee; margin-top: 8px; padding-top: 16px; font-size: 18px; font-weight: 700; color: #333; }
    .rt-row.total span:last-child { color: #550F26; font-family: Georgia, serif; }
    
    .btn-confirmar { width: 100%; background: linear-gradient(135deg, #550F26 0%, #7a1f45 100%); color: #fff; border: none; padding: 16px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px; }
    .btn-confirmar:hover:not(:disabled) { transform: translateY(-2px); }
    .btn-confirmar:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .sel-persona { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; background: #fff; }
    .sel-persona:focus { outline: none; border-color: #550F26; }
    
    .error-msg { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
    
    .cliente-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; }
    .cliente-nombre { font-size: 16px; font-weight: 600; color: #166534; margin-bottom: 4px; }
    .cliente-doc { font-size: 13px; color: #15803d; }
    .cliente-tel { font-size: 13px; color: #15803d; margin-top: 2px; }
    
    .info-pago { color: #666; font-size: 14px; margin-bottom: 16px; }
    .monto-total { background: #fdf8f6; padding: 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .monto-total span { color: #666; font-size: 14px; }
    .monto-total strong { font-size: 24px; color: #550F26; font-family: Georgia, serif; }
    .vuelto-calculo { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; font-size: 14px; }
    .vuelto-calculo strong { color: #166534; font-size: 18px; }
    
    .alert-info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #1e40af; line-height: 1.8; }
    .upload-zone { border: 2px dashed #ccc; border-radius: 10px; padding: 30px; text-align: center; cursor: pointer; transition: all 0.2s; }
    .upload-zone:hover { border-color: #550F26; background: #fdf8f8; }
    .upload-zone p { margin: 10px 0 5px; color: #666; }
    .upload-zone small { color: #999; }
    .preview-container { position: relative; display: inline-block; }
    .preview-image { max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #ddd; }
    .btn-remove { position: absolute; top: -10px; right: -10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px; }
    .subiendo-msg { text-align: center; padding: 10px; color: #666; font-size: 14px; }
  `]
})
export class PagoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  guardando = false;
  error = '';
  personas: any[] = [];
  idPersona: number | null = null;
  loadingPersonas = false;
  nombreCliente = '';
  telefonoCliente = '';
  documentoCliente = '';
  carrito: ItemCarrito[] = [];
  tipoEntrega: 'tienda' | 'delivery' = 'tienda';
  direccion = '';
  referencia = '';
  telefono = '';
  metodoSeleccionado = '';
  numeroOperacion = '';
  qrImageUrl = 'assets/payment/yapeQr.jpeg';
  mostrarQR = false;
  montoRecibido = 0;
  costoDelivery = 5.00;

  imagenPreview: string | null = null;
  imagenFile: File | null = null;
  imagenUrl: string | null = null;
  subiendoImagen = signal(false);

  metodosPago: MetodoPago[] = [
    { id: 'yape', nombre: 'Yape', icono: '📱', requiereQR: true },
    { id: 'efectivo', nombre: 'Efectivo', icono: '💵', requiereQR: false },
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private carritoService: CarritoService,
    private ventaService: VentaService,
    private authService: AuthService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar 5MB');
        return;
      }
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async subirImagen(): Promise<string | null> {
    if (!this.imagenFile) return null;
    this.subiendoImagen.set(true);
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async (e: any) => {
        const base64 = e.target.result;
        try {
          const headers = this.getHeaders();
          const response: any = await this.http.post(
            `${environment.apiUrl}/Venta/SubirImagen`,
            { imagenBase64: base64 },
            { headers }
          ).toPromise();
          this.subiendoImagen.set(false);
          resolve(response.url);
        } catch (error) {
          console.error('Error subiendo imagen:', error);
          this.subiendoImagen.set(false);
          resolve(null);
        }
      };
      if (this.imagenFile) {
        reader.readAsDataURL(this.imagenFile);
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('user');
    const token = userStr ? JSON.parse(userStr).token : null;
    if (token) {
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders();
  }

  quitarImagen() {
    this.imagenFile = null;
    this.imagenPreview = null;
    this.imagenUrl = null;
  }

  triggerFileInput() {
    const input = document.getElementById('input-comprobante') as HTMLInputElement;
    if (input) input.click();
  }

  ngOnInit(): void {
    this.carrito = this.carritoService.obtenerCarrito();
    this.verificarClienteLogueado();
    this.cargarPersonas();
    this.cargarMetodosPago();
  }

  private verificarClienteLogueado(): void {
    if (this.authService.isLoggedIn()) {
      const persona = this.authService.getPersona();
      if (persona) {
        this.idPersona = persona.id;
        this.nombreCliente = `${persona.nombres} ${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}`.trim();
        this.documentoCliente = persona.numeroDocumento;
        this.telefonoCliente = persona.telefono || '';
      }
    } else {
      this.router.navigate(['/iniciar'], { queryParams: { returnUrl: '/pagar' } });
    }
  }

  cargarMetodosPago(): void {
    this.ventaService.obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.metodosPago = data
            .filter(m => m.id !== 3)
            .map(m => ({
              id: m.id.toString(),
              idBackend: m.id,
              nombre: m.nombre,
              icono: m.nombre.toLowerCase().includes('yape') ? '📱' : '💵',
              requiereQR: m.nombre.toLowerCase().includes('yape')
            }));
        },
        error: () => {
          this.metodosPago = [
            { id: '1', idBackend: 1, nombre: 'Yape', icono: '📱', requiereQR: true },
            { id: '2', idBackend: 2, nombre: 'Efectivo', icono: '💵', requiereQR: false },
          ];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPersonas(): void {
    this.loadingPersonas = true;
    this.ventaService.obtenerClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.personas = data;
          this.loadingPersonas = false;
        },
        error: () => {
          this.loadingPersonas = false;
        }
      });
  }

  onPersonaChange(event: any): void {
    const id = +event.target.value;
    this.idPersona = id || null;
    if (id) {
      const persona = this.personas.find(p => p.id === id);
      if (persona) {
        this.nombreCliente = persona.nombres || '';
        this.documentoCliente = persona.numeroDocumento || '';
      }
    }
  }

  get subtotal(): number {
    return this.carritoService.obtenerTotal();
  }

  get totalPagar(): number {
    return this.subtotal + (this.tipoEntrega === 'delivery' ? this.costoDelivery : 0);
  }

  get puedeConfirmar(): boolean {
    if (!this.idPersona) return false;
    if (!this.metodoSeleccionado) return false;
    if (this.tipoEntrega === 'delivery') {
      if (!this.imagenFile) return false;
      if (!this.direccion.trim() || !this.telefono.trim()) return false;
      if (this.mostrarQR && !this.numeroOperacion.trim()) return false;
    }
    return true;
  }

  seleccionarMetodo(metodo: MetodoPago): void {
    this.metodoSeleccionado = metodo.id;
    this.mostrarQR = metodo.requiereQR;
    this.numeroOperacion = '';
  }

  volver(): void {
    this.router.navigate(['/products']);
  }

  async confirmarPedido(): Promise<void> {
    if (!this.puedeConfirmar) return;

    this.guardando = true;
    this.error = '';

    try {
      let imagenUrl: string | null = null;
      if (this.tipoEntrega === 'delivery') {
        imagenUrl = await this.subirImagen();
        if (!imagenUrl) {
          throw new Error('Error al subir la imagen del comprobante');
        }
      } else if (this.imagenFile) {
        imagenUrl = await this.subirImagen();
      }

      const metodo = this.metodosPago.find(m => m.id === this.metodoSeleccionado);
      const idMetodoPago = metodo?.idBackend ? metodo.idBackend : (this.metodoSeleccionado === '1' ? 1 : this.metodoSeleccionado === '2' ? 2 : 3);

      const dto: any = {
        idPersona: this.idPersona!,
        idTipoEntrega: (this.tipoEntrega === 'delivery' ? 2 : 1) as 1 | 2,
        usuario: 'cliente',
        imagenComprobante: imagenUrl || '',
        numeroOperacion: this.numeroOperacion || '',
        detalles: this.carrito.map(item => ({
          idTorta: item.id,
          cantidad: item.cantidad,
          precioBase: item.precio,
          precioPersonalizacion: 0,
          mensaje: ''
        })),
        pagos: [{
          idMetodoPago: idMetodoPago,
          monto: this.totalPagar,
          numeroOperacion: this.numeroOperacion
        }],
        entrega: this.tipoEntrega === 'delivery' ? {
          idPersonalRepartidor: 0,
          direccion: this.direccion,
          referencia: this.referencia,
          telefono: this.telefono,
          nombreContacto: '',
          costoDelivery: this.costoDelivery
        } : null,
        comprobante: {
          idTipoComprobante: 1,
          serie: 'B' + new Date().getFullYear().toString().slice(-2),
          numero: Date.now().toString().slice(-8).padStart(8, '0')
        }
      };

      this.ventaService.registrar(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (idVenta) => {
            this.guardando = false;
            alert(`¡Pedido enviado! Tu comprobante está siendo validado. Te notificaremos cuando sea aprobado.`);
            this.carritoService.limpiarCarrito();
            this.router.navigate(['/']);
          },
          error: (err: Error) => {
            this.guardando = false;
            this.error = err.message;
          }
        });
    } catch (err: any) {
      this.guardando = false;
      this.error = err.message || 'Error al procesar el pago';
    }
  }
}
