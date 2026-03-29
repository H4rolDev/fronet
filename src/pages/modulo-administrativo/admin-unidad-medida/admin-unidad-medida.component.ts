/**
 * @file admin-unidad-medida.component.ts
 * @description Componente principal del módulo Unidad de Medida.
 *
 * Responsabilidades:
 *  • Cargar y mostrar la tabla de unidades de medida.
 *  • Filtrar el listado en tiempo real por nombre.
 *  • Abrir el modal para crear o editar un registro.
 *  • Confirmar y ejecutar la eliminación de un registro.
 *  • Mostrar notificaciones (toast) de éxito o error.
 *
 * Este componente es STANDALONE (Angular 14+): no necesita NgModule.
 * Usa Signals (Angular 17+) para el estado reactivo local.
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ModalInputData, Notificacion, UnidadMedidaListadoDTO } from '../../../models/unidad-medida-dto';
import { UnidadMedidaService } from '../../../services/unidad-medida.service';
import { UnidadMedidaModalComponent } from './unidad-medida-modal/unidad-medida-modal.component';

@Component({
  selector: 'app-admin-unidad-medida',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UnidadMedidaModalComponent,
  ],
  templateUrl: './admin-unidad-medida.component.html',
  styleUrls: ['./admin-unidad-medida.component.css'],
})
export class AdminUnidadMedidaComponent implements OnInit, OnDestroy {
  /** Acceso directo al componente hijo del modal para llamar sus métodos */
  @ViewChild(UnidadMedidaModalComponent)
  modalComponent!: UnidadMedidaModalComponent;

  /** Lista completa de unidades de medida cargada desde la API */
  unidades = signal<UnidadMedidaListadoDTO[]>([]);

  /** Texto de búsqueda; se actualiza con [(ngModel)] */
  textoBusqueda = signal<string>('');

  /**
   * Lista filtrada — computed recalcula automáticamente cuando cambia
   * 'unidades' o 'textoBusqueda'. No requiere pipes ni lógica manual.
   */
  unidadesFiltradas = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.unidades();

    return this.unidades().filter((u) =>
      u.nombre.toLowerCase().includes(texto)
    );
  });

  /** true mientras se cargan los datos de la tabla */
  cargandoTabla = signal<boolean>(false);

  /** true mientras se ejecuta la eliminación */
  eliminando = signal<boolean>(false);

  /** Controla la visibilidad del modal de crear/editar */
  modalAbierto = signal<boolean>(false);

  /** Datos que se pasan al modal (modo + id opcional) */
  modalInputData = signal<ModalInputData | null>(null);

  /** ID del registro que se está confirmando para eliminar */
  idParaEliminar = signal<number | null>(null);

  /** Nombre del registro a eliminar (para mostrarlo en el confirm) */
  nombreParaEliminar = signal<string>('');

  /** Notificación toast actual (null = oculta) */
  notificacion = signal<Notificacion | null>(null);

  /** Timer para auto-ocultar el toast */
  private toastTimer: any = null;

  /**
   * Subject que completa en ngOnDestroy.
   * Todos los observables usan takeUntil(this.destroy$) para evitar memory leaks.
   */
  private destroy$ = new Subject<void>();

  constructor(private unidadMedidaService: UnidadMedidaService) { }

  ngOnInit(): void {
    this.cargarListado();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /**
   * Carga el listado completo desde la API.
   * Se llama en ngOnInit y después de cada operación exitosa.
   */
  cargarListado(): void {
    this.cargandoTabla.set(true);

    this.unidadMedidaService.obtenerListado().pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cargandoTabla.set(false))
      )
      .subscribe({
        next: (data) => this.unidades.set(data),
        error: (err: Error) =>
          this.mostrarNotificacion('error', err.message),
      });
  }

  /** Actualiza el signal de búsqueda (llamado desde [(ngModel)] en el input) */
  onBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
  }

  /** Limpia el campo de búsqueda */
  limpiarBusqueda(): void {
    this.textoBusqueda.set('');
  }

  /** Abre el modal en modo CREAR */
  abrirModalCrear(): void {
    this.modalInputData.set({ mode: 'crear' });
    this.modalAbierto.set(true);
  }

  /**
   * Abre el modal en modo EDITAR con el ID del registro seleccionado.
   * El modal se encarga de cargar los datos via ObtenerListadoPorId.
   *
   * @param id - ID de la unidad de medida a editar
   */
  abrirModalEditar(id: number): void {
    this.modalInputData.set({ mode: 'editar', id });
    this.modalAbierto.set(true);
  }

  /** Cierra el modal (llamado por el evento (cerrar) del modal) */
  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.modalInputData.set(null);
  }

  /**
   * Se ejecuta cuando el modal emite el evento (guardado).
   * Recarga la tabla y muestra el toast de éxito.
   */
  onGuardadoExitoso(mensaje: string): void {
    this.cerrarModal();
    this.cargarListado();
    this.mostrarNotificacion('exito', mensaje);
  }

  /**
   * Muestra el diálogo de confirmación de eliminación.
   *
   * @param unidad - Objeto de la fila seleccionada
   */
  confirmarEliminar(unidad: UnidadMedidaListadoDTO): void {
    this.idParaEliminar.set(unidad.id);
    this.nombreParaEliminar.set(unidad.nombre);
  }

  /** Cancela el diálogo de confirmación */
  cancelarEliminar(): void {
    this.idParaEliminar.set(null);
    this.nombreParaEliminar.set('');
  }

  /** Ejecuta la eliminación luego de que el usuario confirmó */
  ejecutarEliminar(): void {
    const id = this.idParaEliminar();
    if (!id) return;

    this.eliminando.set(true);

    this.unidadMedidaService
      .eliminar(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.eliminando.set(false))
      )
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.cargarListado();
          this.mostrarNotificacion('exito', 'Unidad de medida eliminada correctamente.');
        },
        error: (err: Error) => {
          this.cancelarEliminar();
          this.mostrarNotificacion('error', err.message);
        },
      });
  }

  /**
   * Muestra un toast de notificación y lo oculta automáticamente a los 4s.
   *
   * @param tipo    - 'exito' | 'error' | 'advertencia'
   * @param mensaje - Texto a mostrar al usuario
   */
  mostrarNotificacion(tipo: Notificacion['tipo'], mensaje: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.notificacion.set(null), 4000);
  }

  /** Cierra el toast manualmente (botón X) */
  cerrarNotificacion(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set(null);
  }

  /**
   * Formatea una fecha ISO para mostrarla en la tabla de forma legible.
   *
   * @param fecha - String ISO 8601
   * @returns Fecha formateada en locale 'es-PE'
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /** TrackBy para optimizar el rendering de la tabla */
  trackById(_index: number, item: UnidadMedidaListadoDTO): number {
    return item.id;
  }
}
