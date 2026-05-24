import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiUrl;

interface Rol { id: number; nombre: string; }
interface Notificacion { tipo: 'exito' | 'error'; mensaje: string; }

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.css']
})
export class AdminRolesComponent implements OnInit {
  roles = signal<Rol[]>([]);
  textoBusqueda = signal<string>('');
  cargando = signal(false);
  guardando = signal(false);
  eliminando = signal(false);
  modalAbierto = signal(false);
  editando = signal(false);
  idParaEliminar = signal<number | null>(null);
  nombreParaEliminar = signal('');
  notificacion = signal<Notificacion | null>(null);
  private toastTimer: any = null;

  errores: any = {};
  form: any = this.getFormVacio();

  constructor(private http: HttpClient) {}
  ngOnInit() { this.cargarListado(); }

  getFormVacio() { return { id: 0, nombre: '', descripcion: '' }; }

  rolesFiltrados = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.roles();
    return this.roles().filter(r => r.nombre.toLowerCase().includes(texto));
  });

  cargarListado() {
    this.cargando.set(true);
    this.http.get<Rol[]>(`${BASE}/Rol/ObtenerListado`).subscribe({ next: d => { this.roles.set(d); this.cargando.set(false); }, error: () => { this.cargando.set(false); } });
  }

  abrirModalCrear() { this.errores = {}; this.form = this.getFormVacio(); this.editando.set(false); this.modalAbierto.set(true); }
  abrirModalEditar(item: Rol) { this.errores = {}; this.editando.set(true); this.form = { ...this.getFormVacio(), id: item.id, nombre: item.nombre }; this.modalAbierto.set(true); }
  cerrarModal() { this.modalAbierto.set(false); this.form = this.getFormVacio(); }

  guardar() {
    this.errores = {};
    if (!this.form.nombre) this.errores.nombre = 'El nombre es requerido';
    if (Object.keys(this.errores).length > 0) return;

    this.guardando.set(true);
    const payload = { id: this.form.id, nombre: this.form.nombre, descripcion: this.form.descripcion, usuarioRegistra: 'admin', usuarioModifica: 'admin' };
    const req = this.editando() ? this.http.put<any>(`${BASE}/Rol/Actualizar`, payload) : this.http.post<any>(`${BASE}/Rol/Insertar`, payload);

    req.subscribe({
      next: res => {
        this.guardando.set(false);
        if (res.success) { this.cerrarModal(); this.cargarListado(); this.mostrarNotificacion('exito', this.editando() ? 'Rol actualizado' : 'Rol creado'); }
        else this.mostrarNotificacion('error', res.message);
      },
      error: () => { this.guardando.set(false); this.mostrarNotificacion('error', 'Error al guardar'); }
    });
  }

  confirmarEliminar(item: Rol) { this.idParaEliminar.set(item.id); this.nombreParaEliminar.set(item.nombre); }
  cancelarEliminar() { this.idParaEliminar.set(null); this.nombreParaEliminar.set(''); }
  ejecutarEliminar() {
    const id = this.idParaEliminar();
    if (!id) return;
    this.eliminando.set(true);
    this.http.delete<any>(`${BASE}/Rol/Eliminar?id=${id}&usuario=admin`).subscribe({
      next: res => {
        if (res.success) { this.cancelarEliminar(); this.cargarListado(); this.mostrarNotificacion('exito', 'Rol eliminado'); }
        else { this.cancelarEliminar(); this.mostrarNotificacion('error', res.message); }
      },
      error: () => { this.eliminando.set(false); this.mostrarNotificacion('error', 'Error al eliminar'); }
    });
  }

  onBusqueda(valor: string) { this.textoBusqueda.set(valor); }
  limpiarBusqueda() { this.textoBusqueda.set(''); }
  mostrarNotificacion(tipo: 'exito' | 'error', mensaje: string) { if (this.toastTimer) clearTimeout(this.toastTimer); this.notificacion.set({ tipo, mensaje }); this.toastTimer = setTimeout(() => this.notificacion.set(null), 4000); }
  cerrarNotificacion() { if (this.toastTimer) clearTimeout(this.toastTimer); this.notificacion.set(null); }
  trackById(_i: number, item: Rol) { return item.id; }
}