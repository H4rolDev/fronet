/**
 * @file admin-produccion.component.ts
 * @description Módulo principal de Producción de Tortas.
 *
 * ─── RESPONSABILIDADES ────────────────────────────────────────────────────────
 *  • Tabla principal: historial de producciones (INMUTABLE — sin editar/eliminar)
 *  • Filtros: búsqueda por torta + rango de fechas
 *  • Stats: producciones del mes, tortas producidas, última producción
 *  • Paginación: 10 registros por página
 *  • Botones globales: Nueva Producción | Ajustar Insumo | Ajustar Torta
 *  • Acción por fila: solo "Ver detalle" (sin editar, sin eliminar)
 *  • 4 modales: crear | detalle | ajuste insumo | ajuste torta
 *
 * ─── MODALES ─────────────────────────────────────────────────────────────────
 *  ProduccionCrearModalComponent      → crear producción
 *  ProduccionDetalleModalComponent    → ver detalle (torta + insumos)
 *  ProduccionAjusteInsumoComponent    → ajuste manual de insumo
 *  ProduccionAjusteTortaComponent     → ajuste manual de torta
 */

import {
  Component, OnInit, OnDestroy,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Subject }      from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ProduccionCrearModalComponent } from './produccion-crear-modal/produccion-crear-modal.component';
import { ProduccionAjusteInsumoComponent, ProduccionAjusteTortaComponent, ProduccionDetalleModalComponent } from './produccion-detalle-modal/produccion-detalle-modal.component';
import { FiltrosProduccion, Notificacion, ProduccionCabeceraDTO } from '../../../models/produccion-dto';
import { ProduccionService } from '../../../services/produccion.service';

const POR_PAGINA = 10;

@Component({
  selector: 'app-admin-produccion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ProduccionCrearModalComponent,
    ProduccionDetalleModalComponent,
    ProduccionAjusteInsumoComponent,
    ProduccionAjusteTortaComponent,
  ],
  templateUrl: './admin-produccion.component.html',
  styleUrls:  ['./admin-produccion.component.css'],
})
export class AdminProduccionComponent implements OnInit, OnDestroy {
  producciones       = signal<ProduccionCabeceraDTO[]>([]);
  cargando           = signal<boolean>(false);
  notificacion       = signal<Notificacion | null>(null);
  paginaActual       = signal<number>(1);
  filtros = signal<FiltrosProduccion>({ busqueda: '', fechaDesde: null, fechaHasta: null });
  mostrarCrear       = signal<boolean>(false);
  mostrarDetalle     = signal<boolean>(false);
  mostrarAjusteIns   = signal<boolean>(false);
  mostrarAjusteTorta = signal<boolean>(false);
  produccionDetalle  = signal<ProduccionCabeceraDTO | null>(null);

  produccionesFiltradas = computed(() => {
    const { busqueda, fechaDesde, fechaHasta } = this.filtros();
    let lista = this.producciones();

    if (busqueda.trim()) {
      const txt = busqueda.toLowerCase();
      lista = lista.filter(p => p.nombreTorta.toLowerCase().includes(txt));
    }
    if (fechaDesde) {
      lista = lista.filter(p => p.fechaProduccion >= fechaDesde);
    }
    if (fechaHasta) {
      lista = lista.filter(p => p.fechaProduccion <= fechaHasta);
    }
    return lista;
  });

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.produccionesFiltradas().length / POR_PAGINA))
  );

  produccionesPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * POR_PAGINA;
    return this.produccionesFiltradas().slice(inicio, inicio + POR_PAGINA);
  });

  paginasArr = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
  );

  produccionesEsteMes = computed(() => {
    const hoy   = new Date();
    const mes   = hoy.getMonth();
    const anio  = hoy.getFullYear();
    return this.producciones().filter(p => {
      const d = new Date(p.fechaProduccion);
      return d.getMonth() === mes && d.getFullYear() === anio;
    }).length;
  });

  totalTortasProducidas = computed(() =>
    this.producciones().reduce((acc, p) => acc + p.cantidadProducida, 0)
  );

  tortasDistintas = computed(() =>
    new Set(this.producciones().map(p => p.idTorta)).size
  );

  ultimaProduccion = computed(() => {
    const lista = [...this.producciones()].sort((a, b) =>
      b.fechaProduccion.localeCompare(a.fechaProduccion)
    );
    return lista[0] ?? null;
  });

  private destroy$   = new Subject<void>();
  private toastTimer: any = null;

  constructor(private svc: ProduccionService) {}

  ngOnInit(): void  { this.cargar(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.obtenerListado()
      .pipe(takeUntil(this.destroy$), finalize(() => this.cargando.set(false)))
      .subscribe({
        next: data => { this.producciones.set(data); this.paginaActual.set(1); },
        error: (e: Error) => this.toast('error', e.message),
      });
  }

  onBusqueda(v: string): void {
    this.filtros.update(f => ({ ...f, busqueda: v }));
    this.paginaActual.set(1);
  }
  onFechaDesde(v: string): void {
    this.filtros.update(f => ({ ...f, fechaDesde: v || null }));
    this.paginaActual.set(1);
  }
  onFechaHasta(v: string): void {
    this.filtros.update(f => ({ ...f, fechaHasta: v || null }));
    this.paginaActual.set(1);
  }
  limpiarFiltros(): void {
    this.filtros.set({ busqueda: '', fechaDesde: null, fechaHasta: null });
    this.paginaActual.set(1);
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) this.paginaActual.set(p);
  }

  abrirCrear(): void        { this.mostrarCrear.set(true); }
  abrirAjusteIns(): void    { this.mostrarAjusteIns.set(true); }
  abrirAjusteTorta(): void  { this.mostrarAjusteTorta.set(true); }

  abrirDetalle(prod: ProduccionCabeceraDTO): void {
    this.produccionDetalle.set(prod);
    this.mostrarDetalle.set(true);
  }

  cerrarCrear(): void        { this.mostrarCrear.set(false); }
  cerrarDetalle(): void      { this.mostrarDetalle.set(false); this.produccionDetalle.set(null); }
  cerrarAjusteIns(): void    { this.mostrarAjusteIns.set(false); }
  cerrarAjusteTorta(): void  { this.mostrarAjusteTorta.set(false); }

  onProduccionCreada(msg: string): void {
    this.cerrarCrear();
    this.cargar();
    this.toast('exito', msg);
  }

  onAjusteRealizado(msg: string): void {
    this.cerrarAjusteIns();
    this.cerrarAjusteTorta();
    this.toast('exito', msg);
  }

  toast(tipo: Notificacion['tipo'], mensaje: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set({ tipo, mensaje });
    this.toastTimer = setTimeout(() => this.notificacion.set(null), 5000);
  }
  cerrarToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notificacion.set(null);
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    const partes = f.split('T')[0].split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return f;
  }

  trackById(_: number, p: ProduccionCabeceraDTO): number { return p.id; }
}
