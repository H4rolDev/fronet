import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { CustomRequestService, CustomRequest, CustomRequestDetail } from '../../services/custom-request.service';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-custom-request', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './custom-request.component.html', styleUrl: './custom-request.component.css' })
export class CustomRequestComponent implements OnInit {
  form: any = { pisos: 1 };
  requests: CustomRequest[] = [];
  selected?: CustomRequestDetail;
  estimate?: any; imageName = ''; imagePreview = ''; imageUploading = false; submitting = false; showSummary = false; sent = false; error = ''; loading = false; guestCode = ''; guestToken = '';
  readonly minDate = new Date().toISOString().slice(0, 10);
  constructor(public api: CustomRequestService, public auth: AuthService, private router: Router) {}
  ngOnInit(): void { if (this.auth.isLoggedIn()) this.load(); }
  load(): void {
    this.api.mine().subscribe({
      next: value => this.requests = value,
      error: error => {
        if (error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/iniciar'], { queryParams: { returnUrl: '/personalizado' } });
          return;
        }
        this.error = error?.error?.mensaje || 'No pudimos cargar tus solicitudes.';
      }
    });
  }
  refreshEstimate(): void { this.api.estimate(this.form).subscribe({ next: value => this.estimate = value }); }
  image(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    this.error = '';
    if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) { this.error = 'Sube una imagen válida de máximo 4 MB.'; return; }
    this.imageName = file.name;
    this.imageUploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = String(reader.result || '');
      this.api.uploadImage(this.imagePreview).subscribe({
        next: result => { this.form.imagenReferencia = result.url; this.imageUploading = false; },
        error: error => {
          this.form.imagenReferencia = '';
          this.imageUploading = false;
          this.error = error?.error?.mensaje || error?.error?.message || 'No se pudo guardar la imagen de referencia. Intenta nuevamente.';
        }
      });
    };
    reader.onerror = () => { this.imageUploading = false; this.error = 'No se pudo leer la imagen seleccionada.'; };
    reader.readAsDataURL(file);
  }
  submit(): void {
    if (!this.form.descripcion?.trim() || !this.form.fechaEntregaSolicitada) { this.error = 'Completa la descripción y la fecha que necesitas.'; return; }
    if (this.imageUploading) { this.error = 'Espera a que termine de cargarse la imagen de referencia.'; return; }
    if (this.imagePreview && !this.form.imagenReferencia) { this.error = 'La imagen todavía no está disponible. Vuelve a seleccionarla o espera a que termine la carga.'; return; }
    this.error = '';
    this.showSummary = true;
  }
  editRequest(): void { this.showSummary = false; this.error = ''; }
  resetImage(): void { this.form.imagenReferencia = ''; this.imageName = ''; this.imagePreview = ''; this.error = ''; }
  confirmSubmit(): void {
    this.submitting = true; this.error = ''; this.api.create(this.form).subscribe({ next: result => { this.selected = result; this.sent = true; this.showSummary = false; this.submitting = false; if (this.auth.isLoggedIn()) this.load(); }, error: e => { this.error = e?.error?.mensaje || 'No se pudo enviar la solicitud.'; this.submitting = false; } });
  }
  open(item: CustomRequest): void { this.loading = true; this.api.detail(item.id).subscribe({ next: value => { this.selected = value; this.loading = false; }, error: () => { this.error = 'No pudimos abrir el seguimiento.'; this.loading = false; } }); }
  statusClass(state: string): string { return state.includes('Rechaz') || state === 'Vencida' ? 'danger' : state === 'Aceptada' || state === 'Lista' ? 'success' : 'pending'; }
  reset(): void { this.sent = false; this.selected = undefined; this.showSummary = false; this.form = { pisos: 1 }; this.estimate = undefined; this.imageName = ''; this.imagePreview = ''; this.imageUploading = false; this.error = ''; }
  acceptQuote(): void { if (!this.selected) return; this.api.state(this.selected.solicitud.id, 'Aceptada').subscribe(value => this.selected = value); }
  trackGuest(): void { if (!this.guestCode || !this.guestToken) { this.error = 'Indica el código y token de seguimiento.'; return; } this.api.publicDetail(this.guestCode.trim(), this.guestToken.trim()).subscribe({ next: value => { this.selected = value; this.sent = false; this.error = ''; }, error: () => this.error = 'No encontramos una solicitud con esos datos.' }); }
}
