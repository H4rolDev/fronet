import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cuenta-container">
      <div class="cuenta-header">
        <h1>👤 Mi Perfil</h1>
        <p>Gestiona tus datos personales</p>
      </div>

      @if (!isLoggedIn) {
        <div class="no-auth">
          <p>Debes iniciar sesión para ver tu perfil.</p>
          <button class="btn-primary" routerLink="/iniciar">Iniciar Sesión</button>
        </div>
      } @else {
        <div class="cuenta-content">
          <div class="cuenta-form">
            <div class="form-section">
              <h3>Información Personal</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Nombres</label>
                  <input type="text" [(ngModel)]="persona.nombres" [disabled]="!editando" />
                </div>
                <div class="form-group">
                  <label>Apellido Paterno</label>
                  <input type="text" [(ngModel)]="persona.apellidoPaterno" [disabled]="!editando" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Apellido Materno</label>
                  <input type="text" [(ngModel)]="persona.apellidoMaterno" [disabled]="!editando" />
                </div>
                <div class="form-group">
                  <label>Tipo Documento</label>
                  <select [(ngModel)]="persona.idTipoDocumento" [disabled]="!editando">
                    <option [value]="1">DNI</option>
                    <option [value]="2">RUC</option>
                    <option [value]="3">Carnet Extranjería</option>
                    <option [value]="4">Pasaporte</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Número de Documento</label>
                  <input type="text" [(ngModel)]="persona.numeroDocumento" [disabled]="!editando" />
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" [(ngModel)]="persona.telefono" [disabled]="!editando" />
                </div>
              </div>

              <div class="form-group">
                <label>Dirección</label>
                <input type="text" [(ngModel)]="persona.direccion" [disabled]="!editando" />
              </div>
            </div>

            @if (mensaje) {
              <div class="mensaje" [class.error]="mensaje.includes('Error')">{{ mensaje }}</div>
            }

            <div class="form-actions">
              @if (!editando) {
                <button class="btn-primary" (click)="habilitarEdicion()">✏️ Editar Datos</button>
              } @else {
                <button class="btn-secondary" (click)="cancelarEdicion()">Cancelar</button>
                <button class="btn-primary" (click)="guardarCambios()" [disabled]="guardando">
                  @if (guardando) { Guardando... }
                  @else { 💾 Guardar Cambios }
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cuenta-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .cuenta-header { text-align: center; margin-bottom: 32px; }
    .cuenta-header h1 { font-family: 'Playfair Display', serif; color: #550F26; margin-bottom: 8px; }
    .cuenta-header p { color: #666; }
    
    .no-auth { text-align: center; padding: 60px; background: #faf8f6; border-radius: 12px; }
    .no-auth p { margin-bottom: 20px; color: #666; }
    
    .cuenta-form { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    
    .form-section h3 { color: #550F26; margin-bottom: 24px; font-size: 18px; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group select {
      width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;
      background: #fafafa; color: #333;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #550F26; }
    .form-group input:disabled { background: #f0f0f0; color: #666; }
    
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    
    .btn-primary { background: #550F26; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-primary:hover { background: #6d1430; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-secondary { background: #fff; color: #666; border: 1px solid #ddd; padding: 12px 24px; border-radius: 8px; cursor: pointer; }
    .btn-secondary:hover { background: #f5f5f5; }
    
    .mensaje { padding: 12px; border-radius: 8px; margin-top: 16px; text-align: center; }
    .mensaje:not(.error) { background: #dff7df; color: #2e7d32; border: 1px solid #b2e2b2; }
    .mensaje.error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
    
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class ClienteCuentaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;
  
  isLoggedIn = false;
  editando = false;
  guardando = false;
  mensaje = '';
  
  persona: PersonaData = {
    id: 0,
    idTipoDocumento: 1,
    tipoDocumento: '',
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    direccion: ''
  };
  
  personaOriginal: PersonaData = { ...this.persona };

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.cargarDatos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    const user = this.auth.getUser();
    if (user?.persona) {
      const tipoDoc = user.persona.tipoDocumento || 'DNI';
      this.persona = {
        id: user.persona.id,
        idTipoDocumento: tipoDoc === 'RUC' ? 2 : tipoDoc === 'Carnet Extranjería' ? 3 : tipoDoc === 'Pasaporte' ? 4 : 1,
        tipoDocumento: tipoDoc,
        numeroDocumento: user.persona.numeroDocumento || '',
        nombres: user.persona.nombres || '',
        apellidoPaterno: user.persona.apellidoPaterno || '',
        apellidoMaterno: user.persona.apellidoMaterno || '',
        telefono: user.persona.telefono || '',
        direccion: user.persona.direccion || ''
      };
      this.personaOriginal = { ...this.persona };
    }
  }

  habilitarEdicion(): void {
    this.editando = true;
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.persona = { ...this.personaOriginal };
    this.editando = false;
    this.mensaje = '';
  }

  guardarCambios(): void {
    this.guardando = true;
    this.mensaje = '';
    
    const dto = {
      id: this.persona.id,
      idTipoDocumento: this.persona.idTipoDocumento,
      numeroDocumento: this.persona.numeroDocumento,
      nombres: this.persona.nombres,
      apellidoPaterno: this.persona.apellidoPaterno,
      apellidoMaterno: this.persona.apellidoMaterno,
      telefono: this.persona.telefono,
      direccion: this.persona.direccion
    };

    this.http.put(`${this.apiUrl}/Persona/Actualizar`, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.guardando = false;
          if (res.success) {
            this.mensaje = 'Datos actualizados correctamente';
            this.personaOriginal = { ...this.persona };
            this.editando = false;
            
            const user = this.auth.getUser();
            if (user) {
              user.persona = { ...user.persona, ...this.persona };
              localStorage.setItem('user', JSON.stringify(user));
            }
          } else {
            this.mensaje = res.mensaje || 'Error al actualizar';
          }
        },
        error: (err) => {
          this.guardando = false;
          this.mensaje = err.error?.mensaje || 'Error al actualizar los datos';
        }
      });
  }
}
