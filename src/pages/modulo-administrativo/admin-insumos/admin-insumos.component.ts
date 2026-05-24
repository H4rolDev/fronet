/**
 * @file admin-insumo.component.ts
 * @description Componente principal del módulo Insumos.
 *
 * ─── RESPONSABILIDADES ────────────────────────────────────────────────────────
 *  • Tabla principal: listado de insumos (1 fila = 1 insumo)
 *  • Filtros: todos / activos / inactivos
 *  • Búsqueda por nombre
 *  • Stats: total, activos, sin stock
 *  • Acciones por fila según estado:
 *      Activo   → Editar | Ver lotes | Desactivar
 *      Inactivo → Activar
 *  • Validación UX antes de desactivar: stockDisponible > 0 → advertencia, sin llamada API
 *  • Delegación a modales hijos para editar insumo, ver lotes, crear lote, editar lote
 *
 * ─── FLUJO DE MODALES ────────────────────────────────────────────────────────
 *  Admin → abrirCrear()    → InsumoCrearModalComponent
 *  Admin → abrirEditar()   → InsumoEditarModalComponent
 *  Admin → abrirDetalle()  → InsumoDetalleLotesComponent (modal de lotes)
 */

import {
  Component, OnInit, OnDestroy,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Subject }      from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { FiltroEstado, InsumoListadoDTO, Notificacion } from '../../../models/insumo-dto';
import { InsumoService } from '../../../services/insumo.service';
import { InsumoCrearModalComponent } from './insumo-crear-modal/insumo-crear-modal.component';
import { InsumoEditarModalComponent } from './insumo-editar-modal/insumo-editar-modal.component';
import { InsumoDetalleLotesComponent } from './insumo-detalle-lotes/insumo-detalle-lotes.component';
import { EntradaInsumoModalComponent } from './entrada-insumo-modal/entrada-insumo-modal.component';

@Component({
  selector: 'app-admin-insumo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InsumoCrearModalComponent,
    InsumoEditarModalComponent,
    InsumoDetalleLotesComponent,
    EntradaInsumoModalComponent,
  ],
  templateUrl: './admin-insumos.component.html',
  styleUrls:  ['./admin-insumos.component.css'],
})
export class AdminInsumoComponent implements OnInit, OnDestroy {

  // ── Estado ─────────────────────────────────────────────────────────────────
  insumos          = signal<InsumoListadoDTO[]>([]);
  textoBusqueda    = signal<string>('');
  filtroEstado     = signal<FiltroEstado>('todos');
  cargando         = signal<boolean>(false);
  notificacion     = signal<Notificacion | null>(null);

  // Modales
  mostrarCrear     = signal<boolean>(false);
  mostrarEditar    = signal<boolean>(false);
  mostrarDetalle   = signal<boolean>(false);
  mostrarEntrada   = signal<boolean>(false);
  insumoSeleccionado = signal<InsumoListadoDTO | null>(null);

  // Confirmaciones
  insumoDesactivar = signal<InsumoListadoDTO | null>(null);
  insumoActivar    = signal<InsumoListadoDTO | null>(null);
  procesando       = signal<boolean>(false);

  // ── Computados ─────────────────────────────────────────────────────────────

  insumosFiltrados = computed(() => {
    let lista = this.insumos();
    const texto = this.textoBusqueda().toLowerCase().trim();
    const filtro = this.filtroEstado();

    if (filtro === 'activos')   lista = lista.filter(i => i.activo);
    if (filtro === 'inactivos') lista = lista.filter(i => !i.activo);
    if (texto) lista = lista.filter(i => i.nombre.toLowerCase().includes(texto));

    return lista;
  });

  totalActivos  = computed(() => this.insumos().filter(i => i.activo).length);
  totalSinStock = computed(() => this.insumos().filter(i => i.activo && i.stockDisponible === 0).length);

  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private svc: InsumoService) {}

  ngOnInit(): void  { this.cargarListado(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Carga ──────────────────────────────────────────────────────────────────
  cargarListado(): void {
    this.cargando.set(true);
    this.svc.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({
        next: data => this.insumos.set(data),
        error: (e: Error) => this.toast('error', e.message),
      });
  }

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  onBusqueda(v: string):           void { this.textoBusqueda.set(v); }
  limpiarBusqueda():               void { this.textoBusqueda.set(''); }
  setFiltro(f: FiltroEstado):      void { this.filtroEstado.set(f); }

  // ── Apertura de modales ────────────────────────────────────────────────────
  abrirCrear(): void {
    this.insumoSeleccionado.set(null);
    this.mostrarCrear.set(true);
  }

  abrirEditar(insumo: InsumoListadoDTO): void {
    this.insumoSeleccionado.set(insumo);
    this.mostrarEditar.set(true);
  }

  abrirDetalle(insumo: InsumoListadoDTO): void {
    this.insumoSeleccionado.set(insumo);
    this.mostrarDetalle.set(true);
  }

  abrirEntrada(): void {
    this.mostrarEntrada.set(true);
  }

  cerrarCrear():   void { this.mostrarCrear.set(false); }
  cerrarEditar():  void { this.mostrarEditar.set(false); this.insumoSeleccionado.set(null); }
  cerrarDetalle(): void { this.mostrarDetalle.set(false); this.insumoSeleccionado.set(null); }
  cerrarEntrada(): void { this.mostrarEntrada.set(false); }

  onGuardado(msg: string): void {
    this.cerrarCrear(); this.cerrarEditar(); this.cerrarEntrada();
    this.cargarListado();
    this.toast('exito', msg);
  }

  onDetalleCambio(): void {
    // Re-cargar el listado para actualizar stockDisponible
    this.cargarListado();
  }

  // ── Desactivar insumo ──────────────────────────────────────────────────────

  /**
   * Antes de mostrar confirmación, verifica si tiene stock.
   * Si stockDisponible > 0 → advertencia inmediata, sin modal de confirmación.
   */
  iniciarDesactivar(insumo: InsumoListadoDTO): void {
    if (insumo.stockDisponible > 0) {
      this.toast('error',
        `No puedes desactivar "${insumo.nombre}" porque tiene stock disponible (${insumo.stockDisponible} ${insumo.abreviatura}). Primero agota el stock de todos sus lotes.`
      );
      return;
    }
    this.insumoDesactivar.set(insumo);
  }

  cancelarDesactivar(): void { this.insumoDesactivar.set(null); }

  confirmarDesactivar(): void {
    const insumo = this.insumoDesactivar();
    if (!insumo) return;
    this.procesando.set(true);
    this.svc.desactivarInsumo(insumo.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => {
          this.cancelarDesactivar();
          this.cargarListado();
          this.toast('exito', `"${insumo.nombre}" desactivado correctamente.`);
        },
        error: (e: Error) => {
          this.cancelarDesactivar();
          this.toast('error', e.message);
        },
      });
  }

  // ── Activar insumo ─────────────────────────────────────────────────────────

  iniciarActivar(insumo: InsumoListadoDTO): void {
    this.insumoActivar.set(insumo);
  }

  cancelarActivar(): void { this.insumoActivar.set(null); }

  confirmarActivar(): void {
    const insumo = this.insumoActivar();
    if (!insumo) return;
    this.procesando.set(true);
    this.svc.activarInsumo(insumo.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => {
          this.cancelarActivar();
          this.cargarListado();
          this.toast('exito', `"${insumo.nombre}" activado correctamente.`);
        },
        error: (e: Error) => {
          this.cancelarActivar();
          this.toast('error', e.message);
        },
      });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast(tipo: Notificacion['tipo'], mensaje: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.notificacion.set(null), 5000);
  }
  cerrarToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set(null);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  trackById(_: number, i: InsumoListadoDTO): number { return i.id; }
}
