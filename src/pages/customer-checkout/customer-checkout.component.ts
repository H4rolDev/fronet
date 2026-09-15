import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { VentaService } from '../../services/venta.service';
import { DeliveryConfigurationService } from '../../services/delivery-configuration.service';
import { MetodoPagoDTO, RegistrarVentaDTO } from '../../models/venta-dto';
import { DeliveryConfiguration } from '../../models/delivery-configuration';

@Component({
  selector: 'app-customer-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-checkout.component.html',
  styleUrl: './customer-checkout.component.css'
})
export class CustomerCheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  delivery = false;
  address = '';
  reference = '';
  phone = '';
  contact = '';
  operation = '';
  depositAmount: number | null = null;
  cashAmount = 0;
  paymentId = 0;
  payments: MetodoPagoDTO[] = [];
  deliveryCost = 0;
  deliveryDistance = 0;
  coordinates: { lat: number; lng: number } | null = null;
  sending = false;
  success = false;
  customOrderSubmitted = false;
  generatedCode = '';
  showDeliveryNotice = false;
  error = '';
  receiptBase64 = '';
  receiptPreview = '';
  configuration: DeliveryConfiguration | null = null;
  showClosedNotice = false;
  closedNotice = '';
  private map?: L.Map;
  private marker?: L.Marker;

  constructor(
    public cart: CarritoService,
    private auth: AuthService,
    private venta: VentaService,
    private deliveryConfig: DeliveryConfigurationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const persona = this.auth.getPersona();
    this.address = persona?.direccion || '';
    this.phone = persona?.telefono || '';
    this.contact = [persona?.nombres, persona?.apellidoPaterno].filter(Boolean).join(' ');
    this.venta.obtenerMetodosPago().subscribe({
      next: methods => {
        this.payments = methods.filter(method => this.isAllowedMethod(method));
        this.paymentId = this.visiblePayments[0]?.id || 0;
      },
      error: () => this.error = 'No se pudieron cargar los métodos de pago.'
    });
    this.deliveryConfig.obtener().subscribe({
      next: config => {
        this.configuration = config;
        this.deliveryCost = this.delivery ? config.costoBase : 0;
        this.initializeMap();
      },
      error: () => this.error = 'No se pudo cargar la configuración de delivery.'
    });
  }

  ngAfterViewInit(): void { this.initializeMap(); }
  ngOnDestroy(): void { this.map?.remove(); }

  get visiblePayments(): MetodoPagoDTO[] {
    return this.payments.filter(method => this.delivery ? this.isDigital(method) : true);
  }

  get selectedPayment(): MetodoPagoDTO | undefined { return this.payments.find(p => p.id === this.paymentId); }
  get isCash(): boolean { return (this.selectedPayment?.nombre || '').toLowerCase().includes('efectivo'); }
  get requiresProof(): boolean { return !this.isCash; }
  get total(): number { return this.cart.obtenerTotal() + (this.delivery ? this.deliveryCost : 0); }
  get minimumDeposit(): number { return Number((this.total * 0.5).toFixed(2)); }
  get amountToPay(): number { return this.isCash ? this.total : Number(this.depositAmount || 0); }

  onDeliveryChange(): void {
    this.paymentId = this.visiblePayments[0]?.id || 0;
    if (!this.delivery) {
      this.deliveryCost = 0;
      this.coordinates = null;
      this.deliveryDistance = 0;
      this.marker?.remove();
    } else if (this.configuration) {
      this.deliveryCost = this.configuration.costoBase;
      setTimeout(() => this.initializeMap());
    }
  }

  selectLocation(event: L.LeafletMouseEvent): void {
    if (!this.configuration) return;
    const distance = this.distance(event.latlng.lat, event.latlng.lng, this.configuration.latitudCentro, this.configuration.longitudCentro);
    if (distance > this.configuration.radioMaximoKm) {
      this.error = 'La ubicación está fuera del área de delivery disponible.';
      return;
    }
    this.error = '';
    this.coordinates = { lat: event.latlng.lat, lng: event.latlng.lng };
    this.deliveryDistance = distance;
    this.deliveryCost = Number((this.configuration.costoBase + Math.floor(distance) * this.configuration.costoPorKilometro).toFixed(2));
    this.marker?.remove();
    this.marker = L.marker(event.latlng).addTo(this.map!);
  }

  onReceiptSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.error = 'El comprobante no debe superar 5 MB.'; return; }
    const reader = new FileReader();
    reader.onload = () => { this.receiptBase64 = String(reader.result || ''); this.receiptPreview = this.receiptBase64; };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (!this.isOpenInLima() && !this.showClosedNotice) {
      this.closedNotice = `En este momento la pastelería no se encuentra atendiendo. El horario es de lunes a sábado de 8:00 a. m. a 5:00 p. m. Tu pedido será atendido el ${this.nextAttentionLabel()}.`;
      this.showClosedNotice = true;
      return;
    }
    this.showClosedNotice = false;
    void this.registerOrder();
  }

  continueClosedOrder(): void { this.showClosedNotice = false; void this.registerOrder(); }
  returnHome(): void { this.router.navigate(['/']); }

  private async registerOrder(): Promise<void> {
    const persona = this.auth.getPersona();
    const items = this.cart.obtenerCarrito();
    if (!persona?.id || !items.length) { this.error = 'Inicia sesión y verifica que tu carrito tenga productos.'; return; }
    if (this.delivery && (!this.address.trim() || !this.phone.trim())) { this.error = 'Completa la dirección y teléfono de delivery.'; return; }
    if (this.delivery && !this.coordinates) { this.error = 'Selecciona tu ubicación en el mapa para calcular el delivery.'; return; }
    if (this.delivery && this.isCash) { this.error = 'Para delivery solo se aceptan Yape o Plin con comprobante.'; return; }
    if (this.requiresProof && (!this.receiptBase64 || !this.operation.trim())) { this.error = 'Sube el comprobante e ingresa el número de operación.'; return; }
    if (!this.isCash && (!this.depositAmount || this.depositAmount <= 0 || this.depositAmount > this.total)) {
      this.error = `El depósito debe ser mayor a S/ 0.00 y no superar S/ ${this.total.toFixed(2)}.`;
      return;
    }
    if (!this.delivery && this.isCash) this.cashAmount = this.total;
    if (this.delivery) this.cashAmount = 0;
    this.sending = true;
    this.error = '';
    try {
       this.customOrderSubmitted = items.some(item => Boolean(item.configuracion || item.imagenReferencia || item.mensaje || item.tamanio || item.sabor || item.relleno || item.pisos || item.decoracion));
       const image = this.receiptBase64 ? await firstValueFrom(this.venta.subirImagen(this.receiptBase64)) : null;
       const referenceImages = await Promise.all(items.map(async item => item.imagenReferencia
         ? (await firstValueFrom(this.venta.subirImagenReferencia(item.imagenReferencia))).url
         : undefined));
       const pagos = this.isCash
         ? [{ idMetodoPago: this.paymentId, monto: this.total, numeroOperacion: '' }]
         : [
             { idMetodoPago: this.paymentId, monto: Number(this.depositAmount || 0), numeroOperacion: this.operation.trim() },
             ...(this.cashAmount > 0 ? [{ idMetodoPago: this.cashPaymentId, monto: Number(this.cashAmount.toFixed(2)), numeroOperacion: '' }] : [])
           ];
       const dto: RegistrarVentaDTO = {
        idPersona: persona.id,
        idTipoEntrega: this.delivery ? 2 : 1,
        usuario: this.auth.getUser()?.username || 'cliente',
        imagenComprobante: image?.url || undefined,
        numeroOperacion: this.operation.trim() || undefined,
         detalles: items.map((item, index) => ({
          idTorta: item.id,
          cantidad: item.cantidad,
          precioBase: item.precioBase ?? item.precio,
          precioPersonalizacion: item.precioPersonalizacion ?? 0,
          mensaje: item.mensaje || '',
          tamanio: item.tamanio,
          sabor: item.sabor,
          relleno: item.relleno,
          pisos: item.pisos,
          colorDecoracion: item.colorDecoracion,
          decoracion: item.decoracion,
          cobertura: item.configuracion?.['cobertura'] as string | undefined,
          porciones: item.porciones,
          evento: item.configuracion?.['evento'] as string | undefined,
          fechaEntrega: item.fechaEntrega?.trim() || undefined,
          observaciones: item.observaciones,
          imagenReferencia: referenceImages[index]
        })),
         pagos,
        entrega: this.delivery ? {
          idPersonalRepartidor: 0,
          direccion: this.address.trim(),
          referencia: this.reference.trim(),
          telefono: this.phone.trim(),
          nombreContacto: this.contact.trim(),
          costoDelivery: this.deliveryCost,
          latitud: this.coordinates?.lat,
          longitud: this.coordinates?.lng
        } : null
      };
      const id = await firstValueFrom(this.venta.registrar(dto));
      const detail = await firstValueFrom(this.venta.obtenerDetalle(id));
      this.generatedCode = detail.venta.codigoEntrega || '';
      this.cart.limpiarCarrito();
      this.success = true;
      this.showDeliveryNotice = true;
    } catch (err: any) {
      this.error = err?.message || 'No se pudo registrar el pedido.';
    } finally { this.sending = false; }
  }

  get cashPaymentId(): number { return this.payments.find(method => method.nombre.toLowerCase().includes('efectivo'))?.id || 1; }

  private initializeMap(): void {
    if (!this.delivery || !this.configuration || this.map || typeof document === 'undefined') return;
    const element = document.getElementById('checkout-map');
    if (!element) return;
    this.map = L.map(element).setView([this.configuration.latitudCentro, this.configuration.longitudCentro], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(this.map);
    this.map.on('click', event => this.selectLocation(event));
  }

  private isAllowedMethod(method: MetodoPagoDTO): boolean {
    const name = method.nombre.toLowerCase();
    return name.includes('yape') || name.includes('plin') || name.includes('efectivo');
  }
  private isDigital(method: MetodoPagoDTO): boolean {
    const name = method.nombre.toLowerCase();
    return name.includes('yape') || name.includes('plin');
  }
  private isOpenInLima(): boolean {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
    const day = parts.find(part => part.type === 'weekday')?.value;
    const hour = Number(parts.find(part => part.type === 'hour')?.value || 0);
    const minute = Number(parts.find(part => part.type === 'minute')?.value || 0);
    const totalMinutes = hour * 60 + minute;
    return day !== 'Sun' && totalMinutes >= 480 && totalMinutes < 1020;
  }
  private nextAttentionLabel(): string {
    const now = new Date();
    const lima = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const day = lima.getDay();
    const next = new Date(lima);
    if (day === 0) next.setDate(next.getDate() + 1);
    else if (lima.getHours() >= 17) next.setDate(next.getDate() + (day === 6 ? 2 : 1));
    next.setHours(14, 0, 0, 0);
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Lima' }).format(next);
  }
  private distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const radians = (value: number) => value * Math.PI / 180;
    const a = Math.sin(radians(lat2 - lat1) / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lng2 - lng1) / 2) ** 2;
    return 6372.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
