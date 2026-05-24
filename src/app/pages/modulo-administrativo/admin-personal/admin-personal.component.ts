import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiUrl;

interface Personal {
  id: number;
  username: string;
  idRol: number;
  nombreRol: string;
  idTipoDocumento: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  direccion: string;
  activo: boolean;
}

interface TipoDocumento {
  id: number;
  nombre: string;
}

interface Rol {
  id: number;
  nombre: string;
}

interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}

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
  selector: 'app-admin-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-personal.component.html',
  styleUrls: ['./admin-personal.component.css']
})
export class AdminPersonalComponent implements OnInit {
  personal = signal<Personal[]>([]);
  textoBusqueda = signal<string>('');
  roles = signal<Rol[]>([]);
  tipoDocs = signal<TipoDocumento[]>([]);
  
  cargando = signal(false);
  guardando = signal(false);
  eliminando = signal(false);
  consultandoSunat = signal(false);
  
  modalAbierto = signal(false);
  editando = signal(false);
  
  idParaEliminar = signal<number | null>(null);
  nombreParaEliminar = signal('');
  
  notificacion = signal<Notificacion | null>(null);
  private toastTimer: any = null;

  errores: any = {};
  form: any = this.getFormVacio();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarListado();
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.http.get<TipoDocumento[]>(`${BASE}/TipoDocumento/ObtenerListado`).subscribe({
      next: d => this.tipoDocs.set(d)
    });
    this.http.get<Rol[]>(`${BASE}/Rol/ObtenerListado`).subscribe({
      next: d => this.roles.set(d)
    });
  }

  getFormVacio() {
    return { id: 0, username: '', password: '', idRol: 0, idTipoDocumento: 1, numeroDocumento: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '', direccion: '' };
  }

  personalFiltrados = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.personal();
    return this.personal().filter(p => 
      p.nombres.toLowerCase().includes(texto) ||
      p.apellidoPaterno.toLowerCase().includes(texto) ||
      p.apellidoMaterno?.toLowerCase().includes(texto) ||
      p.numeroDocumento.includes(texto)
    );
  });

esRuc(): boolean {
    return this.form.idTipoDocumento == 2;
  }

  consularSunat() {
    const error = this.validarDocumento();
    if (error) { this.mostrarNotificacion('error', error); return; }

    this.consultandoSunat.set(true);
    const doc = this.form.numeroDocumento.trim();
    const esRuc = this.esRuc();
    const url = esRuc 
      ? `${BASE}/Sunat/ruc?numero=${doc}` 
      : `${BASE}/Sunat/dni?numero=${doc}`;

    this.http.get<PersonaResponse>(url).subscribe({
      next: (res) => {
        this.consultandoSunat.set(false);
        if (res.success && res.data) {
          const data: SunatData = res.data;
          if (esRuc) {
            this.form.nombres = data.razon_social || data.razonSocial || data.numero_documento || '';
            this.form.direccion = data.direccion || '';
          } else {
            this.form.nombres = data.first_name || data.full_name?.split(' ').slice(2).join(' ') || '';
            this.form.apellidoPaterno = data.first_last_name || data.full_name?.split(' ')[0] || '';
            this.form.apellidoMaterno = data.second_last_name || data.full_name?.split(' ')[1] || '';
          }
          this.mostrarNotificacion('exito', 'Datos obtenidos correctamente');
        } else {
          this.mostrarNotificacion('error', res.mensaje || 'No se encontró información');
        }
      },
      error: () => {
        this.consultandoSunat.set(false);
        this.mostrarNotificacion('error', 'Error al consultar SUNAT');
      }
    });
  }

  trackById(_i: number, item: Personal) { return item.id; }

  cargarListado() {
    this.cargando.set(true);
    this.http.get<Personal[]>(`${BASE}/Personal/ObtenerListado`).subscribe({
      next: d => { this.personal.set(d); this.cargando.set(false); },
      error: () => { this.cargando.set(false); }
    });
  }

  abrirModalCrear() { this.errores = {}; this.form = this.getFormVacio(); this.editando.set(false); this.modalAbierto.set(true); }
  abrirModalEditar(item: Personal) {
    this.errores = {};
    this.editando.set(true);
    this.form = {
      id: item.id,
      username: item.username || '',
      password: '',
      idRol: item.idRol || 0,
      idTipoDocumento: item.idTipoDocumento || 1,
      numeroDocumento: item.numeroDocumento,
      nombres: item.nombres,
      apellidoPaterno: item.apellidoPaterno,
      apellidoMaterno: item.apellidoMaterno || '',
      telefono: item.telefono || '',
      direccion: item.direccion || ''
    };
    this.modalAbierto.set(true);
  }
  cerrarModal() { this.modalAbierto.set(false); this.form = this.getFormVacio(); }

  onBusqueda(valor: string) { this.textoBusqueda.set(valor); }
  limpiarBusqueda() { this.textoBusqueda.set(''); }
  mostrarNotificacion(tipo: 'exito' | 'error', mensaje: string) { if (this.toastTimer) clearTimeout(this.toastTimer); this.notificacion.set({ tipo, mensaje }); this.toastTimer = setTimeout(() => this.notificacion.set(null), 4000); }
  cerrarNotificacion() { if (this.toastTimer) clearTimeout(this.toastTimer); this.notificacion.set(null); }

  confirmarEliminar(item: Personal) { this.idParaEliminar.set(item.id); this.nombreParaEliminar.set(`${item.nombres} ${item.apellidoPaterno}`); }
  cancelarEliminar() { this.idParaEliminar.set(null); this.nombreParaEliminar.set(''); }
  ejecutarEliminar() {
    const id = this.idParaEliminar();
    if (!id) return;
    this.eliminando.set(true);
    this.http.delete<any>(`${BASE}/Personal/Eliminar?id=${id}&usuario=admin`).subscribe({
      next: res => {
        if (res.success) { this.cancelarEliminar(); this.cargarListado(); this.mostrarNotificacion('exito', 'Personal eliminado'); }
        else { this.cancelarEliminar(); this.mostrarNotificacion('error', res.message); }
      },
      error: () => { this.eliminando.set(false); this.mostrarNotificacion('error', 'Error al eliminar'); }
    });
  }

  onTipoDocumentoChange() {
    this.form.numeroDocumento = '';
    this.form.nombres = '';
    this.form.apellidoPaterno = '';
    this.form.apellidoMaterno = '';
    this.form.direccion = '';
    this.form.telefono = '';
  }

  validarDocumento(): string | null {
    const doc = this.form.numeroDocumento?.trim();
    if (!doc) return 'El documento es requerido';
    const tipo = this.form.idTipoDocumento;
    if (tipo === 1 && doc.length !== 8) return 'DNI debe tener 8 dígitos';
    if (tipo === 2 && doc.length !== 11) return 'RUC debe tener 11 dígitos';
    return null;
  }

  guardar() {
    this.errores = {};
    if (!this.editando() && (!this.form.idRol || this.form.idRol === 0)) this.errores.idRol = 'El rol es requerido';
    if (!this.form.numeroDocumento?.trim()) this.errores.numeroDocumento = 'El documento es requerido';
    if (!this.form.nombres?.trim()) this.errores.nombres = 'Los nombres son requeridos';
    if (!this.form.apellidoPaterno?.trim()) this.errores.apellidoPaterno = 'El apellido paterno es requerido';
    if (Object.keys(this.errores).length > 0) return;

    this.guardando.set(true);
    const payload = {
      id: this.form.id,
      username: this.form.username,
      password: this.form.password || '',
      idRol: this.form.idRol || (this.editando() ? null : 1),
      idTipoDocumento: this.form.idTipoDocumento,
      numeroDocumento: this.form.numeroDocumento.trim(),
      nombres: this.form.nombres.trim(),
      apellidoPaterno: this.form.apellidoPaterno.trim(),
      apellidoMaterno: this.form.apellidoMaterno?.trim() || '',
      telefono: this.form.telefono?.trim() || '',
      direccion: this.form.direccion?.trim() || '',
      usuarioRegistra: 'admin',
      usuarioModifica: 'admin'
    };
    const req = this.editando() ? this.http.put<any>(`${BASE}/Personal/Actualizar`, payload) : this.http.post<any>(`${BASE}/Personal/Insertar`, payload);

    req.subscribe({
      next: res => {
        this.guardando.set(false);
        if (res.success) { this.cerrarModal(); this.cargarListado(); this.mostrarNotificacion('exito', this.editando() ? 'Personal actualizado' : 'Personal creado'); }
        else this.mostrarNotificacion('error', res.message);
      },
      error: () => { this.guardando.set(false); this.mostrarNotificacion('error', 'Error al guardar'); }
    });
  }
}