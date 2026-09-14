import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, finalize } from 'rxjs/operators';
import { VentaService } from '../../../services/venta.service';
import { DetalleItemDTO, ESTADO_LABEL, ESTADO_CLASE, VentaDetalleDTO, VentaListadoDTO } from '../../../models/venta-dto';

@Component({
  selector: 'app-admin-pedidos-personalizados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pedidos-personalizados.component.html',
  styleUrls: ['./admin-pedidos-personalizados.component.css']
})
export class AdminPedidosPersonalizadosComponent implements OnInit {
  pedidos = signal<VentaListadoDTO[]>([]);
  cargando = signal(true);
  filtro = signal<'todos' | 'pendientes' | 'fecha'>('todos');
  detalleId = signal<number | null>(null);
  detalle = signal<VentaDetalleDTO | null>(null);
  detalleCargando = signal(false);
  detalleError = signal('');
  imagenActiva = signal<string | null>(null);
  busqueda = signal('');
  fechaDesde = signal('');
  fechaHasta = signal('');
  pagina = signal(1);
  tamanioPagina = signal(6);
  readonly tamaniosPagina = [6, 12, 24, 48];
  readonly ESTADO_LABEL = ESTADO_LABEL;
  readonly ESTADO_CLASE = ESTADO_CLASE;
  filtrados = computed(() => {
    const items = this.pedidos();
    const query = this.busqueda().trim().toLocaleLowerCase();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    return items.filter(item => {
      const nombre = (item.clienteNombre || '').toLocaleLowerCase();
      const fecha = (item.fechaVenta || '').slice(0, 10);
      const estadoOk = this.filtro() === 'todos'
        || (this.filtro() === 'pendientes' && [1, 2, 3].includes(item.idEstadoVenta))
        || (this.filtro() === 'fecha' && !!item.fechaEntregaSolicitada);
      return estadoOk && (!query || nombre.includes(query)) && (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
    }).sort((a, b) => {
      const fechaA = new Date(a.fechaVenta || '').getTime();
      const fechaB = new Date(b.fechaVenta || '').getTime();
      return (Number.isFinite(fechaB) ? fechaB : b.id) - (Number.isFinite(fechaA) ? fechaA : a.id);
    });
  });
  paginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.tamanioPagina())));
  paginados = computed(() => {
    const start = (this.pagina() - 1) * this.tamanioPagina();
    return this.filtrados().slice(start, start + this.tamanioPagina());
  });
  paginasVisibles = computed(() => Array.from({ length: this.paginas() }, (_, index) => index + 1));
  pendientes = computed(() => this.pedidos().filter(item => [1, 2, 3].includes(item.idEstadoVenta)).length);
  conFecha = computed(() => this.pedidos().filter(item => item.fechaEntregaSolicitada).length);

  constructor(private ventas: VentaService) {}
  ngOnInit(): void {
    this.ventas.obtenerListado().subscribe({
      next: items => { this.pedidos.set(items.filter(item => item.tienePersonalizacion)); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }
  abrir(id: number): void {
    this.detalleId.set(id);
    this.detalle.set(null);
    this.detalleError.set('');
    this.detalleCargando.set(true);
    this.ventas.obtenerDetalle(id).pipe(
      timeout(15000),
      finalize(() => this.detalleCargando.set(false))
    ).subscribe({
      next: value => this.detalle.set(value),
      error: error => {
        this.detalleError.set(error?.name === 'TimeoutError'
          ? 'El servidor está tardando demasiado en responder. Intenta nuevamente.'
          : 'No se pudo cargar la configuración de este pedido.');
      }
    });
  }
  reintentarDetalle(): void { const id = this.detalleId(); if (id !== null) this.abrir(id); }
  cerrar(): void { this.detalleId.set(null); this.detalle.set(null); this.detalleError.set(''); this.imagenActiva.set(null); }
  cambiarFiltro(value: 'todos' | 'pendientes' | 'fecha'): void { this.filtro.set(value); this.pagina.set(1); }
  actualizarBusqueda(value: string): void { this.busqueda.set(value); this.pagina.set(1); }
  cambiarTamanioPagina(value: number): void { this.tamanioPagina.set(Number(value)); this.pagina.set(1); }
  limpiarFiltros(): void { this.busqueda.set(''); this.fechaDesde.set(''); this.fechaHasta.set(''); this.filtro.set('todos'); this.pagina.set(1); }
  irAPagina(page: number): void { if (page >= 1 && page <= this.paginas()) this.pagina.set(page); }
  imagenes(detalle: VentaDetalleDTO): DetalleItemDTO[] { return detalle.detalles.filter(item => !!item.imagenReferencia); }
  configuracion(item: DetalleItemDTO): { label: string; value: string | number }[] {
    return [
      ['Tamaño', item.tamanio], ['Sabor', item.sabor], ['Relleno', item.relleno], ['Pisos', item.pisos],
      ['Cobertura', item.cobertura], ['Decoración', item.decoracion], ['Color', item.colorDecoracion],
      ['Porciones', item.porciones], ['Evento', item.evento]
    ].filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== null && entry[1] !== '')
      .map(([label, value]) => ({ label, value }));
  }
  fmt(value: string | null | undefined): string { return value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value)) : 'Sin fecha'; }
}
