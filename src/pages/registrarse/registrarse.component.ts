import { Component, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

const BASE = environment.apiUrl;

interface PersonaResponse {
  success: boolean;
  mensaje?: string;
  data?: any;
}

interface SunatData {
  first_name?: string;
  first_last_name?: string;
  second_last_name?: string;
  full_name?: string;
  document_number?: string;
  razon_social?: string;
  razonSocial?: string;
  numero_documento?: string;
  direccion?: string;
}

@Component({
  selector: "app-registrarse",
  templateUrl: './registrarse.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})

export class RegistrarseComponent {
  consultandoSunat = signal(false);
  mensaje = signal<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  miFormulario1: FormGroup;
  constructor(private forBuilder: FormBuilder, private http: HttpClient) {
    this.miFormulario1 = this.forBuilder.group({
      numeroDocumento: ['', [Validators.required]],
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get numeroDocumento() { return this.miFormulario1.get('numeroDocumento'); }
  get nombres() { return this.miFormulario1.get('nombres'); }
  get apellidos() { return this.miFormulario1.get('apellidos'); }
  get direccion() { return this.miFormulario1.get('direccion'); }
  get telefono() { return this.miFormulario1.get('telefono'); }
  get correo() { return this.miFormulario1.get('correo'); }
  get contrasena() { return this.miFormulario1.get('contrasena'); }

  onTipoDocumentoChange() {
    this.miFormulario1.patchValue({
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      direccion: ''
    });
  }

esRuc(): boolean {
    const doc = this.numeroDocumento?.value?.trim() || '';
    return doc.length === 11;
  }

  consularSunat() {
    const error = this.validarDocumento();
    if (error) { this.mensaje.set({ tipo: 'error', texto: error }); return; }

    this.consultandoSunat.set(true);
    const doc = this.numeroDocumento!.value.trim();
    const esRuc = this.esRuc();
    const url = esRuc ? `${BASE}/Sunat/ruc?numero=${doc}` : `${BASE}/Sunat/dni?numero=${doc}`;

    this.http.get<PersonaResponse>(url).subscribe({
      next: res => {
        this.consultandoSunat.set(false);
        if (res.success && res.data) {
          const data: SunatData = res.data;
          if (esRuc) {
            this.miFormulario1.patchValue({
              nombres: data.razon_social || data.razonSocial || '',
              direccion: data.direccion || ''
            });
          } else {
            this.miFormulario1.patchValue({
              nombres: data.first_name || data.full_name?.split(' ').slice(2).join(' ') || '',
              apellidos: `${data.first_last_name || data.full_name?.split(' ')[0] || ''} ${data.second_last_name || data.full_name?.split(' ')[1] || ''}`.trim()
            });
          }
          this.mensaje.set({ tipo: 'exito', texto: 'Datos obtenidos correctamente' });
        } else {
          this.mensaje.set({ tipo: 'error', texto: res.mensaje || 'No se encontró información' });
        }
      },
      error: () => {
        this.consultandoSunat.set(false);
        this.mensaje.set({ tipo: 'error', texto: 'Error al consultar SUNAT' });
      }
    });
  }

  validarDocumento(): string | null {
    const doc = this.numeroDocumento?.value?.trim() || '';
    if (!doc) return 'El documento es requerido';
    if (doc.length !== 8 && doc.length !== 11) return 'El documento debe tener 8 o 11 dígitos';
    return null;
  }
}