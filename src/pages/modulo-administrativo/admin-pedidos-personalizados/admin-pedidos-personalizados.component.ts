import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomRequest, CustomRequestDetail, CustomRequestService } from '../../../services/custom-request.service';

@Component({ selector: 'app-admin-pedidos-personalizados', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './admin-pedidos-personalizados.component.html', styleUrls: ['./admin-pedidos-personalizados.component.css'] })
export class AdminPedidosPersonalizadosComponent implements OnInit {
  items: CustomRequest[] = []; selected?: CustomRequestDetail; loading = true; error = ''; filter = '';
  quote: any = { adelanto: 0, costoDelivery: 0, vigenciaHoras: 48 }; whatsappNumber = '';
  tortas: any[] = []; metodosPago: any[] = []; insumos: any[] = []; saving = false; selling = false; notice = '';
  sale: any = { idTorta: 0, idTipoEntrega: 1, idMetodoPago: 0, montoPagado: 0, direccion: '', referencia: '', telefono: '', nombreContacto: '', idPersonalRepartidor: null, observaciones: '' };
  saleIngredients: any[] = [];
  constructor(private api: CustomRequestService) {}
  get quoted(): number { return this.items.filter(x => x.estado === 'Cotizada' || x.estado === 'WhatsApp enviado').length; }
  ngOnInit(): void { this.load(); this.api.catalogs().subscribe({ next: value => { this.tortas = value.tortas.filter((x: any) => x.stockDisponible > 0); this.metodosPago = value.metodosPago; this.insumos = value.insumos.filter((x: any) => x.activo !== false && (x.stockDisponible ?? 0) > 0).map((x: any) => ({ ...x, stockActual: x.stockDisponible, unidad: x.abreviatura || x.nombreUnidadMedida || 'unidad' })); } }); }
  load(): void { this.loading = true; this.api.adminList(this.filter).subscribe({ next: value => { this.items = value; this.loading = false; }, error: e => { this.error = e?.error?.mensaje || 'No se pudieron cargar las solicitudes.'; this.loading = false; } }); }
  open(item: CustomRequest): void { this.api.detail(item.id).subscribe({ next: value => { this.selected = value; this.error = ''; this.whatsappNumber = value.solicitud.telefonoCliente || ''; this.quote = { adelanto: value.cotizacion?.adelanto ?? 0, costoDelivery: value.cotizacion?.costoDelivery ?? 0, fechaEntrega: value.cotizacion?.fechaEntrega?.slice(0, 10) ?? value.solicitud.fechaEntregaSolicitada?.slice(0, 10), horaEntrega: value.cotizacion?.horaEntrega ?? '', precioFinal: value.cotizacion?.precioFinal ?? 0, vigenciaHoras: value.cotizacion ? Math.max(1, Math.round((new Date(value.cotizacion.fechaVencimiento).getTime() - Date.now()) / 3600000)) : 48, observaciones: value.cotizacion?.observaciones ?? '' }; this.sale = { ...this.sale, idTorta: 0, idMetodoPago: 0, idTipoEntrega: 1, montoPagado: value.cotizacion?.adelanto ?? 0, telefono: value.solicitud.telefonoCliente || '', nombreContacto: value.solicitud.nombreCliente || '', direccion: '', referencia: '', idPersonalRepartidor: null, observaciones: value.cotizacion?.observaciones ?? '' }; this.saleIngredients = []; } }); }
  close(): void { this.selected = undefined; this.notice = ''; this.whatsappNumber = ''; this.error = ''; }
  private validateQuote(): string | null {
    if (!Number(this.quote.precioFinal) || Number(this.quote.precioFinal) <= 0) return 'Completa el precio final de la cotización.';
    if (Number(this.quote.adelanto) < 0 || Number(this.quote.adelanto) > Number(this.quote.precioFinal)) return 'El adelanto debe estar entre 0 y el precio final.';
    if (Number(this.quote.costoDelivery) < 0) return 'El costo de delivery no puede ser negativo.';
    if (!this.quote.fechaEntrega) return 'Completa la fecha de entrega de la cotización.';
    if (Number(this.quote.vigenciaHoras) < 1 || Number(this.quote.vigenciaHoras) > 168) return 'La vigencia debe estar entre 1 y 168 horas.';
    return null;
  }
  sendQuote(): void { if (!this.selected) return; const validation = this.validateQuote(); if (validation) { this.error = validation; return; } this.saving = true; this.error = ''; this.api.quote(this.selected.solicitud.id, this.quote).subscribe({ next: value => { this.selected = value; this.saving = false; this.notice = 'Cotización guardada. Ya puedes enviarla por WhatsApp.'; this.load(); }, error: e => { this.error = e?.error?.mensaje || 'No se pudo guardar la cotización.'; this.saving = false; } }); }
  sendWhatsApp(): void {
    if (!this.selected) return;
    const phone = this.whatsappNumber.replace(/\D/g, '');
    if (!phone) { this.error = 'Indica un número de WhatsApp para continuar.'; return; }
    const international = phone.startsWith('51') ? phone : phone.startsWith('9') ? `51${phone}` : phone;
    if (international.length < 11) { this.error = 'Escribe un número válido, por ejemplo 999 999 999.'; return; }
    const validation = this.validateQuote();
    if (validation) { this.error = validation; return; }
    const request = this.selected.solicitud; const quote = this.quote;
    const total = Number(quote.precioFinal || 0) + Number(quote.costoDelivery || 0);
    const message = [
      `Hola ${request.nombreCliente || ''}, te escribimos de Torta Yani.`, '',
      `Tu cotización personalizada ${request.codigo}:`, `Diseño: ${request.evento || 'Diseño personalizado'}`,
      `Detalle: ${request.descripcion}`, `Sabor: ${request.sabor || 'Por definir'}`, `Relleno: ${request.relleno || 'Por definir'}`,
      `Porciones: ${request.porciones || 'Por definir'} · Pisos: ${request.pisos || 1}`,
      `Fecha solicitada: ${request.fechaEntregaSolicitada ? new Date(request.fechaEntregaSolicitada).toLocaleDateString('es-PE') : 'Por definir'}`, '',
      `Precio final: S/ ${Number(quote.precioFinal).toFixed(2)}`, `Adelanto: S/ ${Number(quote.adelanto || 0).toFixed(2)}`,
      `Delivery: S/ ${Number(quote.costoDelivery || 0).toFixed(2)}`, `Total con delivery: S/ ${total.toFixed(2)}`,
      `Entrega: ${new Date(quote.fechaEntrega).toLocaleDateString('es-PE')}${quote.horaEntrega ? ` · ${quote.horaEntrega}` : ''}`,
      `Vigencia: ${quote.vigenciaHoras} horas`, quote.observaciones ? `Observaciones: ${quote.observaciones}` : '', '',
      `Código de solicitud: ${request.codigo}`
    ].filter(Boolean).join('\n');
    const opened = window.open(`https://wa.me/${international}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    if (!opened) { this.error = 'El navegador bloqueó WhatsApp. Permite ventanas emergentes e inténtalo nuevamente.'; return; }
    this.api.whatsappSent(request.id).subscribe({ next: value => { this.selected = value; this.notice = 'Se abrió WhatsApp con la cotización lista para enviar y se registró el envío.'; this.load(); }, error: e => { this.error = e?.error?.mensaje || 'WhatsApp se abrió, pero no se pudo registrar el estado del envío.'; } });
  }
  sellRequest(): void {
    if (!this.selected) return;
    const validation = this.validateQuote(); if (validation) { this.error = validation; return; }
    if (!this.sale.idMetodoPago) { this.error = 'Selecciona el método de pago para crear la venta.'; return; }
    if (!this.sale.idTorta && !this.saleIngredients.some(x => x.idInsumo && Number(x.cantidad) > 0)) { this.error = 'Selecciona una torta de catálogo o agrega al menos un insumo utilizado.'; return; }
    if (this.sale.idTipoEntrega === 2 && (!this.sale.direccion?.trim() || !this.sale.telefono?.trim())) { this.error = 'Para delivery completa dirección y teléfono.'; return; }
    this.selling = true; this.error = '';
    const payload = { ...this.sale, insumos: this.saleIngredients.filter(x => x.idInsumo && Number(x.cantidad) > 0) };
    this.api.sell(this.selected.solicitud.id, payload).subscribe({ next: value => { this.selected = value.detalle; this.selling = false; this.notice = `Venta #${value.ventaId} creada correctamente. Ya aparece en Ventas de Tortas.`; this.load(); }, error: e => { this.selling = false; this.error = e?.error?.mensaje || e?.error?.message || 'No se pudo convertir la solicitud en venta.'; } });
  }
  addIngredient(): void { this.saleIngredients = [...this.saleIngredients, { idInsumo: 0, cantidad: 0 }]; }
  removeIngredient(index: number): void { this.saleIngredients = this.saleIngredients.filter((_, i) => i !== index); }
  ingredientInfo(id: number): any { return this.insumos.find(x => x.id === Number(id)); }
  changeState(state: string): void { if (!this.selected) return; const comment = prompt('Mensaje para el cliente (opcional):') || undefined; this.api.state(this.selected.solicitud.id, state, comment).subscribe({ next: value => { this.selected = value; this.load(); }, error: e => this.error = e?.error?.mensaje || 'No se pudo cambiar el estado.' }); }
  statusClass(state: string): string { return state.includes('Rechaz') ? 'danger' : state === 'Aceptada' || state === 'Lista' || state === 'Vendida' ? 'success' : 'pending'; }
  get pending(): number { return this.items.filter(x => x.estado === 'Pendiente' || x.estado === 'En revisión').length; }
}
