import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';

interface PersonaData {
  id: number;
  idTipoDocumento: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-cliente-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="profile-page">
      <div class="profile-grid" *ngIf="isLoggedIn; else loginPrompt">
        <section class="profile-card">
          <div class="profile-intro">
            <div class="avatar">{{ inicial }}</div>
            <h1>{{ nombreCompleto }}</h1>
             <span>Perfil de cliente</span>
             <small class="avatar-note">Avatar predeterminado</small>
          </div>
          <hr />
          <div class="profile-details">
            <div><small>Correo electrónico</small><strong>{{ username }}</strong></div>
            <div><small>Teléfono</small><strong>{{ persona.telefono || 'No agregado' }}</strong></div>
            <div><small>Dirección de entrega</small><strong>{{ persona.direccion || 'No agregada' }}</strong></div>
          </div>
           <button class="outline-button full" *ngIf="!editando" (click)="habilitarEdicion()">✎ Editar datos de perfil</button>
          <form *ngIf="editando" (ngSubmit)="guardarCambios()">
            <label>Nombres<input name="nombres" [(ngModel)]="persona.nombres" required /></label>
            <label>Apellido paterno<input name="apellidoPaterno" [(ngModel)]="persona.apellidoPaterno" required /></label>
            <label>Teléfono<input name="telefono" [(ngModel)]="persona.telefono" /></label>
            <label>Dirección de entrega<input name="direccion" [(ngModel)]="persona.direccion" /></label>
            <div class="form-actions"><button type="button" class="outline-button" (click)="cancelarEdicion()">Cancelar</button><button class="primary-button" [disabled]="guardando">{{ guardando ? 'Guardando...' : 'Guardar' }}</button></div>
          </form>
          <p class="message" *ngIf="mensaje" [class.error]="esError">{{ mensaje }}</p>
        </section>

        <section class="orders-card">
           <span class="section-label">Tus compras</span>
           <h2>Todo tu historial, en un solo lugar</h2>
           <p>Consulta los pedidos más recientes, sus comprobantes y cada cambio de estado con fecha y hora.</p>
           <div class="orders-preview"><span class="orders-icon">▣</span><div><strong>Historial de pedidos</strong><small>Detalle completo y seguimiento cronológico</small></div><span class="preview-arrow">→</span></div>
          <a class="primary-button" routerLink="/pedidos">Ver historial de pedidos</a>
          <a class="catalog-link" routerLink="/products">Ir al catálogo</a>
        </section>
      </div>
      <ng-template #loginPrompt><section class="login-prompt"><h1>Tu perfil</h1><p>Inicia sesión para consultar y actualizar tus datos.</p><a class="primary-button" routerLink="/iniciar">Iniciar sesión</a></section></ng-template>
    </main>
  `,
  styles: [`
    :host{display:block;background:#fffaf7;min-height:70vh;color:#321b16}.profile-page{max-width:1120px;margin:0 auto;padding:3rem 1.5rem 5rem}.profile-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:2rem;align-items:start}.profile-card,.orders-card,.login-prompt{background:#fff;border:1px solid #eadbd5;border-radius:1.25rem;box-shadow:0 12px 30px #550f2610}.profile-card{padding:2.2rem}.profile-intro{text-align:center}.avatar{display:grid;place-items:center;width:90px;height:90px;margin:0 auto 1rem;border-radius:50%;background:linear-gradient(135deg,#b34870,#550f26);color:#fff;font:700 2.2rem Georgia,serif}.profile-intro h1{margin:0;color:#550f26;font:700 1.55rem Georgia,serif}.profile-intro span{display:inline-block;margin-top:.45rem;color:#b34870;font-size:.8rem;font-weight:700}.profile-card hr{margin:1.8rem 0;border:0;border-top:1px solid #eee2dd}.profile-details{display:grid;gap:1rem;margin-bottom:1.5rem}.profile-details div{display:flex;flex-direction:column;gap:.2rem}.profile-details small,form label{color:#8d746b;font-size:.76rem}.profile-details strong{color:#4b332b;font-size:.92rem;overflow-wrap:anywhere}.full{width:100%}form{display:grid;gap:1rem}form label{display:grid;gap:.4rem}input{width:100%;padding:.75rem;border:1px solid #ddccc5;border-radius:.55rem;background:#fffaf7;color:#321b16;font:inherit}input:focus{outline:2px solid #e9b6c7;border-color:#b34870}.form-actions{display:flex;gap:.7rem}.primary-button,.outline-button{display:inline-block;padding:.75rem 1.1rem;border-radius:999px;border:0;font:700 .85rem inherit;text-decoration:none;cursor:pointer;text-align:center}.primary-button{background:#550f26;color:#fff}.primary-button:hover{background:#7a1f45}.outline-button{background:#fff;color:#550f26;border:1px solid #d6b8c1}.message{padding:.7rem;margin:1rem 0 0;border-radius:.5rem;background:#e9f7ec;color:#26733a;font-size:.85rem}.message.error{background:#fff0f0;color:#a22b2b}.orders-card{padding:2.8rem}.section-label{color:#b34870;font-size:.75rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.orders-card h2{margin:.7rem 0;color:#550f26;font:700 2rem Georgia,serif}.orders-card>p{max-width:500px;color:#7d665d;line-height:1.7}.orders-preview{display:flex;align-items:center;gap:1rem;margin:2rem 0;padding:1rem;border-radius:.8rem;background:#f9edf0}.orders-icon{display:grid;place-items:center;width:2.7rem;height:2.7rem;border-radius:50%;background:#fff;color:#b34870;font-size:1.3rem}.orders-preview div{display:flex;flex-direction:column;gap:.25rem}.orders-preview strong{color:#550f26}.orders-preview small{color:#8d746b}.catalog-link{display:block;margin-top:1rem;color:#b34870;font-size:.85rem;font-weight:700;text-decoration:none}.login-prompt{padding:4rem 2rem;text-align:center}.login-prompt h1{color:#550f26;font:700 2.2rem Georgia,serif}.login-prompt p{color:#7d665d;margin-bottom:1.5rem}@media(max-width:800px){.profile-grid{grid-template-columns:1fr}.orders-card{padding:2rem}}
  `]
})
export class ClienteCuentaComponent implements OnInit {
  private readonly apiUrl = environment.apiUrl;
  isLoggedIn = false;
  editando = false;
  guardando = false;
  mensaje = '';
  esError = false;
  persona: PersonaData = { id: 0, idTipoDocumento: 1, tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '', direccion: '' };
  private personaOriginal = { ...this.persona };

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    const user = this.auth.getUser();
    if (!user?.persona) return;
    const p = user.persona;
    this.persona = { id: p.id, idTipoDocumento: this.documentTypeId(p.tipoDocumento), tipoDocumento: p.tipoDocumento || 'DNI', numeroDocumento: p.numeroDocumento || '', nombres: p.nombres || '', apellidoPaterno: p.apellidoPaterno || '', apellidoMaterno: p.apellidoMaterno || '', telefono: p.telefono || '', direccion: p.direccion || '' };
    this.personaOriginal = { ...this.persona };
  }

  get nombreCompleto(): string { return [this.persona.nombres, this.persona.apellidoPaterno].filter(Boolean).join(' ') || 'Cliente'; }
  get username(): string { return this.auth.getUser()?.username || 'Correo no disponible'; }
  get inicial(): string { return this.nombreCompleto.charAt(0).toUpperCase(); }

  habilitarEdicion(): void { this.editando = true; this.mensaje = ''; }
  cancelarEdicion(): void { this.persona = { ...this.personaOriginal }; this.editando = false; this.mensaje = ''; }

  guardarCambios(): void {
    this.guardando = true; this.mensaje = ''; this.esError = false;
    this.http.put<any>(`${this.apiUrl}/Persona/Actualizar`, this.persona).subscribe({
      next: response => {
        this.guardando = false;
        if (!response?.success) { this.mensaje = response?.mensaje || 'No se pudieron guardar los datos'; this.esError = true; return; }
        const user = this.auth.getUser();
        if (user) { user.persona = { ...user.persona, ...this.persona }; localStorage.setItem('user', JSON.stringify(user)); }
        this.personaOriginal = { ...this.persona }; this.editando = false; this.mensaje = 'Datos actualizados correctamente';
      },
      error: error => { this.guardando = false; this.esError = true; this.mensaje = error.error?.mensaje || 'Error al actualizar los datos'; }
    });
  }

  private documentTypeId(type: string): number { return type === 'RUC' ? 2 : type === 'Carnet Extranjería' ? 3 : type === 'Pasaporte' ? 4 : 1; }
}
