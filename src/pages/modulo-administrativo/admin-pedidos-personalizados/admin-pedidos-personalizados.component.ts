import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomRequest, CustomRequestDetail, CustomRequestService } from '../../../services/custom-request.service';

@Component({ selector: 'app-admin-pedidos-personalizados', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './admin-pedidos-personalizados.component.html', styleUrls: ['./admin-pedidos-personalizados.component.css'] })
export class AdminPedidosPersonalizadosComponent implements OnInit {
  items: CustomRequest[] = []; selected?: CustomRequestDetail; loading = true; error = ''; filter = '';
  quote: any = { adelanto: 0, costoDelivery: 0, vigenciaHoras: 48 }; saving = false; notice = '';
  constructor(private api: CustomRequestService) {}
  get quoted(): number { return this.items.filter(x => x.estado === 'Cotizada').length; }
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.api.adminList(this.filter).subscribe({ next: value => { this.items = value; this.loading = false; }, error: e => { this.error = e?.error?.mensaje || 'No se pudieron cargar las solicitudes.'; this.loading = false; } }); }
  open(item: CustomRequest): void { this.api.detail(item.id).subscribe({ next: value => { this.selected = value; this.quote = { adelanto: value.cotizacion?.adelanto ?? 0, costoDelivery: value.cotizacion?.costoDelivery ?? 0, fechaEntrega: value.cotizacion?.fechaEntrega?.slice(0, 10) ?? value.solicitud.fechaEntregaSolicitada?.slice(0, 10), horaEntrega: value.cotizacion?.horaEntrega ?? '', precioFinal: value.cotizacion?.precioFinal ?? 0, vigenciaHoras: 48, observaciones: value.cotizacion?.observaciones ?? '' }; } }); }
  close(): void { this.selected = undefined; this.notice = ''; }
  sendQuote(): void { if (!this.selected) return; this.saving = true; this.api.quote(this.selected.solicitud.id, this.quote).subscribe({ next: value => { this.selected = value; this.saving = false; this.notice = 'Cotización enviada. El cliente podrá verla en su seguimiento.'; this.load(); }, error: e => { this.error = e?.error?.mensaje || 'No se pudo enviar la cotización.'; this.saving = false; } }); }
  changeState(state: string): void { if (!this.selected) return; const comment = prompt('Mensaje para el cliente (opcional):') || undefined; this.api.state(this.selected.solicitud.id, state, comment).subscribe({ next: value => { this.selected = value; this.load(); } }); }
  statusClass(state: string): string { return state.includes('Rechaz') || state === 'Vencida' ? 'danger' : state === 'Aceptada' || state === 'Lista' ? 'success' : 'pending'; }
  get pending(): number { return this.items.filter(x => x.estado === 'Pendiente' || x.estado === 'En revisión').length; }
}
