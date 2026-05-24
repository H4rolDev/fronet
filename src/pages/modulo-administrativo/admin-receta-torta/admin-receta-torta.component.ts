/**
 * @file admin-receta-torta.component.ts
 * @description Componente principal del módulo Recetas de Torta.
 *
 * Lógica de agrupación:
 *   La API devuelve una fila por insumo (ObtenerCombo). Este componente
 *   las agrupa por idTorta usando computed() para mostrar cada torta
 *   como una card con su lista de ingredientes.
 *
 * Eliminación de una receta completa:
 *   Se eliminan todas las filas de la torta en paralelo con forkJoin.
 *   Si alguna falla, se notifica el error pero se recarga el listado.
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { RecetaTortaModalComponent } from './receta-torta-modal/receta-torta-modal.component';
import { ModalInputData, Notificacion, RecetaAgrupada, RecetaTortaListadoDTO } from '../../../models/receta-torta-dto';
import { RecetaTortaService } from '../../../services/receta-torta.service';


@Component({
  selector: 'app-admin-receta-torta',
  standalone: true,
  imports: [CommonModule, FormsModule, RecetaTortaModalComponent],
  templateUrl: './admin-receta-torta.component.html',
  styleUrls: ['./admin-receta-torta.component.css'],
})
export class AdminRecetaTortaComponent implements OnInit, OnDestroy {

  // ── Estado ─────────────────────────────────────────────────────────────────
  filas              = signal<RecetaTortaListadoDTO[]>([]);
  textoBusqueda      = signal<string>('');
  cargandoTabla      = signal<boolean>(false);
  eliminando         = signal<boolean>(false);
  modalAbierto       = signal<boolean>(false);
  modalInputData     = signal<ModalInputData | null>(null);
  tortaParaEliminar  = signal<RecetaAgrupada | null>(null);
  notificacion       = signal<Notificacion | null>(null);

  // ── Computados ─────────────────────────────────────────────────────────────

  /**
   * Agrupa las filas por idTorta.
   * Resultado: un array de RecetaAgrupada, una por torta.
   */
  recetasAgrupadas = computed<RecetaAgrupada[]>(() => {
    const mapa = new Map<number, RecetaAgrupada>();

    for (const fila of this.filas()) {
      if (!mapa.has(fila.idTorta)) {
        mapa.set(fila.idTorta, {
          idTorta: fila.idTorta,
          nombreTorta: fila.nombreTorta,
          ingredientes: [],
          ultimaModificacion: fila.fechaModificacion,
          usuarioCreacion: fila.usuarioCreacion,
        });
      }
      const grupo = mapa.get(fila.idTorta)!;
      grupo.ingredientes.push(fila);

      // Guardar la fecha más reciente de modificación
      if (fila.fechaModificacion > grupo.ultimaModificacion) {
        grupo.ultimaModificacion = fila.fechaModificacion;
      }
    }

    return Array.from(mapa.values());
  });

  /** Filtro de búsqueda sobre las recetas agrupadas */
  recetasFiltradas = computed<RecetaAgrupada[]>(() => {
    const texto = this.textoBusqueda().toLowerCase().trim();
    if (!texto) return this.recetasAgrupadas();

    return this.recetasAgrupadas().filter(r =>
      r.nombreTorta.toLowerCase().includes(texto) ||
      r.ingredientes.some(i => i.nombreInsumo.toLowerCase().includes(texto))
    );
  });

  /** Total de ingredientes en todo el catálogo */
  totalIngredientes = computed(() => this.filas().length);

  /** Cantidad de insumos únicos usados */
  insumosUnicos = computed(() =>
    new Set(this.filas().map(f => f.idInsumo)).size
  );

  // ── Limpieza ───────────────────────────────────────────────────────────────
  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private recetaTortaService: RecetaTortaService) {}

  ngOnInit(): void  { this.cargarListado(); }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga ──────────────────────────────────────────────────────────────────
  cargarListado(): void {
    this.cargandoTabla.set(true);
    this.recetaTortaService.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargandoTabla.set(false)))
      .subscribe({
        next: data => this.filas.set(data),
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

  abrirModalEditar(receta: RecetaAgrupada): void {
    this.modalInputData.set({
      mode: 'editar',
      idTorta: receta.idTorta,
      nombreTorta: receta.nombreTorta,
    });
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

  // ── Eliminación de receta completa ─────────────────────────────────────────
  confirmarEliminar(receta: RecetaAgrupada): void {
    this.tortaParaEliminar.set(receta);
  }

  cancelarEliminar(): void {
    this.tortaParaEliminar.set(null);
  }

  /**
   * Elimina todas las filas de una receta en paralelo con forkJoin.
   * El backend no tiene un endpoint de "eliminar receta completa",
   * por lo que se hace una petición DELETE por cada fila.
   */
  ejecutarEliminar(): void {
    const receta = this.tortaParaEliminar();
    if (!receta || !receta.ingredientes.length) return;

    this.eliminando.set(true);

    const peticiones = receta.ingredientes.map(fila =>
      this.recetaTortaService.eliminarFila(fila.idTorta)
    );

    forkJoin(peticiones)
      .pipe(takeUntil(this.destroy$), finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.cargarListado();
          this.mostrarNotificacion('exito', `Receta de "${receta.nombreTorta}" eliminada correctamente.`);
        },
        error: (err: Error) => {
          this.cancelarEliminar();
          this.cargarListado();
          this.mostrarNotificacion('error', `Error parcial al eliminar: ${err.message}`);
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  trackByTorta(_i: number, r: RecetaAgrupada): number { return r.idTorta; }
  trackByFila(_i: number, f: RecetaTortaListadoDTO): number { return f.id; }
}
