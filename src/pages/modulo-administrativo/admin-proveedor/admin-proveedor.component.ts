/**
 * @file admin-proveedor.component.ts
 * @description Componente principal del módulo Proveedores.
 */

import {
  Component, OnInit, OnDestroy,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProveedorListadoDTO } from '../../../models/entrada-insumo-dto';
import { ProveedorService } from '../../../services/proveedor.service';
import { ProveedorCrearModalComponent } from './proveedor-crear-modal/proveedor-crear-modal.component';
import { ProveedorEditarModalComponent } from './proveedor-editar-modal/proveedor-editar-modal.component';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

interface Notificacion {
  tipo: 'success' | 'error' | 'warning';
  mensaje: string;
}

@Component({
  selector: 'app-admin-proveedor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProveedorCrearModalComponent,
    ProveedorEditarModalComponent,
  ],
  templateUrl: './admin-proveedor.component.html',
  styleUrls: ['./admin-proveedor.component.css'],
})
export class AdminProveedorComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  proveedores = signal<ProveedorListadoDTO[]>([]);
  textoBusqueda = signal<string>('');
  filtroEstado = signal<FiltroEstado>('todos');
  cargando = signal<boolean>(false);
  notificacion = signal<Notificacion | null>(null);

  mostrarCrear = signal<boolean>(false);
  mostrarEditar = signal<boolean>(false);
  proveedorSeleccionado = signal<ProveedorListadoDTO | null>(null);

  proveedoresFiltrados = computed(() => {
    let lista = this.proveedores();
    const texto = this.textoBusqueda().toLowerCase().trim();
    const filtro = this.filtroEstado();

    if (filtro === 'activos') lista = lista.filter(p => p.activo);
    if (filtro === 'inactivos') lista = lista.filter(p => !p.activo);
    if (texto) lista = lista.filter(p => p.nombre.toLowerCase().includes(texto));

    return lista;
  });

  stats = computed(() => {
    const todos = this.proveedores();
    const activos = todos.filter(p => p.activo).length;
    const inactivos = todos.filter(p => !p.activo).length;
    return { total: todos.length, activos, inactivos };
  });

  constructor(private proveedorSvc: ProveedorService) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProveedores() {
    this.cargando.set(true);
    this.proveedorSvc.obtenerListado()
      .pipe(takeUntil(this.destroy$ as any))
      .subscribe({
        next: (data) => {
          this.proveedores.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar proveedores:', err);
          this.cargando.set(false);
          this.mostrarNotificacion('error', 'Error al cargar proveedores');
        }
      });
  }

  abrirCrear() {
    this.mostrarCrear.set(true);
  }

  abrirEditar(proveedor: ProveedorListadoDTO) {
    this.proveedorSeleccionado.set(proveedor);
    this.mostrarEditar.set(true);
  }

  onProveedorGuardado() {
    this.mostrarNotificacion('success', 'Proveedor guardado correctamente');
    this.cargarProveedores();
  }

  confirmarDesactivar(p: ProveedorListadoDTO) {
    if (!confirm(`¿Desactivar al proveedor "${p.nombre}"?`)) return;

    this.proveedorSvc.desactivar(p.id).subscribe({
      next: () => {
        this.mostrarNotificacion('success', 'Proveedor desactivado');
        this.cargarProveedores();
      },
      error: (err) => {
        console.error('Error al desactivar:', err);
        this.mostrarNotificacion('error', 'Error al desactivar proveedor');
      }
    });
  }

  confirmarActivar(p: ProveedorListadoDTO) {
    if (!confirm(`¿Activar al proveedor "${p.nombre}"?`)) return;

    this.proveedorSvc.activar(p.id).subscribe({
      next: () => {
        this.mostrarNotificacion('success', 'Proveedor activado');
        this.cargarProveedores();
      },
      error: (err) => {
        console.error('Error al activar:', err);
        this.mostrarNotificacion('error', 'Error al activar proveedor');
      }
    });
  }

  mostrarNotificacion(tipo: Notificacion['tipo'], mensaje: string) {
    this.notificacion.set({ tipo, mensaje });
    setTimeout(() => this.notificacion.set(null), 4000);
  }

  trackById(index: number, item: ProveedorListadoDTO) {
    return item.id;
  }
}