import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryConfiguration } from '../../../models/delivery-configuration';
import { DeliveryConfigurationService } from '../../../services/delivery-configuration.service';

@Component({
  selector: 'app-admin-configuracion-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="config-page">
      <header class="page-header"><span class="eyebrow">OPERACIÓN</span><h1>Configuración de delivery</h1><p>Define el precio base y el incremento por distancia para Cusco.</p></header>
      <div class="config-card" *ngIf="configuracion as config">
        <div class="card-title"><span class="icon">🛵</span><div><h2>Tarifa de entrega</h2><p>Estos valores se aplican en Flutter, web y backend.</p></div></div>
        <div class="form-grid">
          <label>Precio base (S/)<input type="number" min="0.01" step="0.01" [(ngModel)]="config.costoBase" name="costoBase"></label>
          <label>Precio por kilómetro (S/)<input type="number" min="0" step="0.01" [(ngModel)]="config.costoPorKilometro" name="costoPorKilometro"></label>
          <label>Radio máximo (km)<input type="number" min="1" step="0.1" [(ngModel)]="config.radioMaximoKm" name="radioMaximoKm"></label>
        </div>
        <div class="center-info"><strong>Centro de cálculo: Cusco</strong><span>Latitud {{ config.latitudCentro }} · Longitud {{ config.longitudCentro }}</span><small>La ubicación de origen y el radio se usan para validar los deliveries.</small></div>
        <div class="preview"><span>En el centro</span><strong>S/ {{ config.costoBase | number:'1.2-2' }}</strong><span>A 1 km</span><strong>S/ {{ (config.costoBase + config.costoPorKilometro) | number:'1.2-2' }}</strong></div>
        <div class="actions"><span class="message" [class.error]="error" *ngIf="mensaje">{{ mensaje }}</span><button class="save" type="button" (click)="guardar()" [disabled]="guardando">{{ guardando ? 'Guardando...' : 'Guardar configuración' }}</button></div>
      </div>
    </section>
  `,
  styles: [`
    .config-page { padding: 28px; max-width: 980px; margin: 0 auto; color: #241d2b; } .page-header { margin-bottom: 24px; } .eyebrow { color: #a64d68; font-size: 11px; letter-spacing: .14em; font-weight: 700; } h1 { margin: 6px 0; font-size: 28px; } .page-header p, .card-title p { color: #746d78; margin: 0; }
    .config-card { background: #fff; border: 1px solid #eee5e8; border-radius: 18px; padding: 26px; box-shadow: 0 8px 24px #3b17200d; } .card-title { display: flex; gap: 14px; align-items: center; margin-bottom: 26px; } .icon { font-size: 28px; } h2 { margin: 0 0 4px; font-size: 19px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; } label { display: grid; gap: 8px; font-weight: 600; font-size: 13px; } input { border: 1px solid #ded4d8; border-radius: 10px; padding: 12px; font-size: 16px; }
    .center-info { display: grid; gap: 5px; margin-top: 22px; padding: 15px; background: #fff7f8; border-radius: 12px; color: #6d4050; } .center-info span, .center-info small { color: #896d77; } .preview { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 20px; padding-top: 18px; border-top: 1px solid #eee5e8; color: #746d78; } .preview strong { color: #a64d68; margin-right: 18px; }
    .actions { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 25px; } .save { background: #a64d68; color: #fff; border: 0; border-radius: 10px; padding: 12px 18px; font-weight: 700; cursor: pointer; } .save:disabled { opacity: .6; cursor: wait; } .message { color: #16834a; } .message.error { color: #c33c4c; }
    @media (max-width: 700px) { .config-page { padding: 18px; } .form-grid { grid-template-columns: 1fr; } .actions { align-items: stretch; flex-direction: column; } }
  `]
})
export class AdminConfiguracionDeliveryComponent implements OnInit {
  configuracion: DeliveryConfiguration | null = null;
  guardando = false;
  mensaje = '';
  error = false;
  constructor(private service: DeliveryConfigurationService) {}
  ngOnInit(): void { this.service.obtener().subscribe({ next: config => this.configuracion = config, error: () => { this.configuracion = this.service.getDefault(); this.mensaje = 'Se muestran valores por defecto.'; this.error = true; } }); }
  guardar(): void {
    if (!this.configuracion) return;
    if (this.configuracion.costoBase <= 0 || this.configuracion.costoPorKilometro < 0 || this.configuracion.radioMaximoKm <= 0) { this.mensaje = 'Revisa los valores: el precio base y el radio deben ser mayores que cero.'; this.error = true; return; }
    this.guardando = true; this.mensaje = '';
    this.service.actualizar(this.configuracion).subscribe({ next: config => { this.configuracion = config; this.mensaje = 'Configuración guardada correctamente.'; this.error = false; this.guardando = false; }, error: err => { this.mensaje = err?.error?.message ?? 'No se pudo guardar la configuración.'; this.error = true; this.guardando = false; } });
  }
}
