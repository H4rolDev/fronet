import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { InsumoListadoDTO } from '../../../models/insumo-dto';
import { ModalInputData, Notificacion } from '../../../models/unidad-medida-dto';
import { InsumoService } from '../../../services/insumo.service';
import { InsumoModalComponent } from './insumo-modal/insumo-modal.component';

@Component({
  selector: 'app-admin-insumo',
  standalone: true,
  imports: [CommonModule, FormsModule, InsumoModalComponent],
  templateUrl: './admin-insumos.component.html',
  styleUrls: ['./admin-insumos.component.css'],
})
export class AdminInsumosComponent implements OnInit, OnDestroy {

  // ── Estado ─────────────────────────────────────────────────────────────────
  insumos            = signal<InsumoListadoDTO[]>([]);
  textoBusqueda      = signal<string>('');
  cargandoTabla      = signal<boolean>(false);
  eliminando         = signal<boolean>(false);
  modalAbierto       = signal<boolean>(false);
  modalInputData     = signal<ModalInputData | null>(null);
  idParaEliminar     = signal<number | null>(null);
  nombreParaEliminar = signal<string>('');
  notificacion       = signal<Notificacion | null>(null);

  // ── Computados ─────────────────────────────────────────────────────────────

  /** Filtra por nombre o nombre de unidad de medida */
  insumosFiltrados = computed(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.insumos();
    return this.insumos().filter(i =>
      i.nombre.toLowerCase().includes(texto) ||
      i.nombreUnidadMedida.toLowerCase().includes(texto)
    );
  });

  /** Cantidad de insumos con stock por debajo del mínimo */
  insumosStockBajo = computed(() =>
    this.insumos().filter(i => i.stockActual < i.stockMinimo).length
  );

  /** Costo unitario promedio del catálogo */
  costoPromedio = computed(() => {
    const lista = this.insumos();
    if (!lista.length) return 0;
    const total = lista.reduce((acc, i) => acc + i.costoUnitario, 0);
    return total / lista.length;
  });

  // ── Limpieza ───────────────────────────────────────────────────────────────
  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private insumoService: InsumoService) {}

  ngOnInit(): void  { this.cargarListado(); }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────
  cargarListado(): void {
    this.cargandoTabla.set(true);
    this.insumoService.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoTabla.set(false)))
      .subscribe({
        next: data => this.insumos.set(data),
        error: (err: Error) => this.mostrarNotificacion('error', err.message),
      });
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  onBusqueda(valor: string): void { this.textoBusqueda.set(valor); }
  limpiarBusqueda(): void { this.textoBusqueda.set(''); }

  // ── Modal ──────────────────────────────────────────────────────────────────
  abrirModalCrear(): void {
    this.modalInputData.set({ mode: 'crear' });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(id: number): void {
    this.modalInputData.set({ mode: 'editar', id });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.modalInputData.set(null);
  }

  onGuardadoExitoso(mensaje: string): void {
    this.cerrarModal();
    this.cargarListado();
    this.mostrarNotificacion('exito', mensaje);
  }

  // ── Eliminación ────────────────────────────────────────────────────────────
  confirmarEliminar(insumo: InsumoListadoDTO): void {
    this.idParaEliminar.set(insumo.id);
    this.nombreParaEliminar.set(insumo.nombre);
  }

  cancelarEliminar(): void {
    this.idParaEliminar.set(null);
    this.nombreParaEliminar.set('');
  }

  ejecutarEliminar(): void {
    const id = this.idParaEliminar();
    if (!id) return;

    this.eliminando.set(true);
    this.insumoService.eliminar(id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.cargarListado();
          this.mostrarNotificacion('exito', 'Insumo eliminado correctamente.');
        },
        error: (err: Error) => {
          this.cancelarEliminar();
          this.mostrarNotificacion('error', err.message);
        },
      });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  mostrarNotificacion(tipo: Notificacion['tipo'], mensaje: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.notificacion.set(null), 4500);
  }

  cerrarNotificacion(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set(null);
  }

  // ── Helpers de template ────────────────────────────────────────────────────

  /**
   * Retorna una clase CSS según el nivel de stock.
   * Se usa en la tabla para colorear la celda de stock actual.
   */
  claseStock(insumo: InsumoListadoDTO): string {
    if (insumo.stockActual === 0)                          return 'stock--agotado';
    if (insumo.stockActual < insumo.stockMinimo)           return 'stock--bajo';
    if (insumo.stockActual < insumo.stockMinimo * 1.2)    return 'stock--alerta';
    return 'stock--ok';
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
    }).format(valor);
  }

  formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0 }).format(valor);
  }

  trackById(_i: number, item: InsumoListadoDTO): number { return item.id; }
}
