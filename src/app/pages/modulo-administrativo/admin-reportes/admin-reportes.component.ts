import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiUrl;

interface ReporteVenta {
  totalVentas: number;
  cantidadVentas: number;
  promedioVenta: number;
  ventasPorDia: { fecha: string; total: number; cantidad: number }[];
  ventasPorMetodoPago: { metodo: string; total: number }[];
  tortasMasVendidas: { nombre: string; cantidad: number; total: number }[];
  entregasPorEstado: { estado: string; cantidad: number }[];
}

interface DashboardData {
  resumen: {
    totalVentas: number;
    cantidadClientes: number;
    cantidadTortas: number;
    cantidadInsumos: number;
    productosLowStock: number;
    ventasHoy: number;
    totalHoy: number;
  };
  comparacionMes: {
    mesActual: number;
    mesAnterior: number;
    crecimientoPorcentual: number;
  };
  ultimasVentas: { id: number; fecha: Date; total: number; cliente: string }[];
  ventasPorCategoria: { categoria: string; cantidad: number; total: number }[];
}

interface InventarioData {
  insumos: { id: number; nombre: string; cantidad: number; stockMinimo: number; unidadMedida: string; precioUnitario: number; estadoStock: string }[];
  tortas: { id: number; nombre: string; precio: number; categoria: string }[];
  lowStockCount: number;
  normalCount: number;
  totalInsumos: number;
  valorTotalInventario: number;
}

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reportes-page">
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Reportes y Dashboard</h2>
            <p class="ph-s">Estadísticas y análisis para la toma de decisiones</p>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="tabActual() === 'ventas'" (click)="cambiarTab('ventas')">Ventas</button>
        <button class="tab" [class.active]="tabActual() === 'dashboard'" (click)="cambiarTab('dashboard')">Dashboard</button>
        <button class="tab" [class.active]="tabActual() === 'inventario'" (click)="cambiarTab('inventario')">Inventario</button>
      </div>

      @if (tabActual() === 'ventas') {
        <div class="filtros">
          <div class="filtro-group">
            <label class="lbl">Desde</label>
            <input type="date" class="inp" [(ngModel)]="fechaDesde" (change)="cargarReportes()" />
          </div>
          <div class="filtro-group">
            <label class="lbl">Hasta</label>
            <input type="date" class="inp" [(ngModel)]="fechaHasta" (change)="cargarReportes()" />
          </div>
          <button class="btn-refresh" (click)="cargarReportes()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualizar
          </button>
        </div>
      }

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      }

      @if (!cargando()) {
        <!-- VENTAS TAB -->
        @if (tabActual() === 'ventas' && datosVentas()) {
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total Ventas</span>
                <span class="rc-value">S/. {{ datosVentas()!.totalVentas.toFixed(2) }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Cantidad de Ventas</span>
                <span class="rc-value">{{ datosVentas()!.cantidadVentas }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Promedio por Venta</span>
                <span class="rc-value">S/. {{ datosVentas()!.promedioVenta.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <h3 class="chart-title">Ventas por Día</h3>
              <canvas #chartVentasDiarias></canvas>
            </div>

            <div class="chart-card">
              <h3 class="chart-title">Ventas por Método de Pago</h3>
              <canvas #chartMetodosPago></canvas>
            </div>

            <div class="chart-card">
              <h3 class="chart-title">Tortas Más Vendidas</h3>
              <canvas #chartTortas></canvas>
            </div>

            <div class="chart-card">
              <h3 class="chart-title">Estado de Deliveries</h3>
              <canvas #chartDelivery></canvas>
            </div>
          </div>
        }

        <!-- DASHBOARD TAB -->
        @if (tabActual() === 'dashboard' && datosDashboard()) {
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total General</span>
                <span class="rc-value">S/. {{ datosDashboard()!.resumen.totalVentas.toFixed(2) }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Clientes</span>
                <span class="rc-value">{{ datosDashboard()!.resumen.cantidadClientes }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Tortas Activas</span>
                <span class="rc-value">{{ datosDashboard()!.resumen.cantidadTortas }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Stock Bajo</span>
                <span class="rc-value" style="color: #ef4444;">{{ datosDashboard()!.resumen.productosLowStock }}</span>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <h3 class="chart-title">Comparación Mensual</h3>
              <canvas #chartComparacion></canvas>
            </div>

            <div class="chart-card">
              <h3 class="chart-title">Ventas por Categoría</h3>
              <canvas #chartCategoria></canvas>
            </div>
          </div>

          <div class="tabla-card">
            <h3 class="chart-title">Últimas Ventas</h3>
            <table class="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (v of datosDashboard()!.ultimasVentas; track v.id) {
                  <tr>
                    <td>#{{ v.id }}</td>
                    <td>{{ v.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ v.cliente }}</td>
                    <td>S/. {{ v.total.toFixed(2) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- INVENTARIO TAB -->
        @if (tabActual() === 'inventario' && datosInventario()) {
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total Insumos</span>
                <span class="rc-value">{{ datosInventario()!.totalInsumos }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Stock Normal</span>
                <span class="rc-value">{{ datosInventario()!.normalCount }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Stock Bajo</span>
                <span class="rc-value" style="color: #ef4444;">{{ datosInventario()!.lowStockCount }}</span>
              </div>
            </div>

            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Valor Inventario</span>
                <span class="rc-value">S/. {{ datosInventario()!.valorTotalInventario.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card" style="grid-column: span 2;">
              <h3 class="chart-title">Estado de Insumos</h3>
              <canvas #chartStock></canvas>
            </div>
          </div>

          <div class="tabla-card">
            <h3 class="chart-title">Insumos con Stock Bajo</h3>
            <table class="tabla">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (i of datosInventario()!.insumos.slice(0, 15); track i.id) {
                  <tr [class.low-stock]="i.estadoStock === 'Bajo'">
                    <td>{{ i.nombre }}</td>
                    <td>{{ i.cantidad }}</td>
                    <td>{{ i.stockMinimo }}</td>
                    <td>{{ i.unidadMedida }}</td>
                    <td>
                      <span class="badge" [class.bajo]="i.estadoStock === 'Bajo'" [class.medio]="i.estadoStock === 'Medio'">{{ i.estadoStock }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (tabActual() === 'ventas' && !datosVentas()) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            <p>No hay datos para el período seleccionado</p>
          </div>
        }
      }

      @if (mostrarModalMeta()) {
        <div class="modal-overlay" (click)="cerrarModalMeta()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Configurar Meta de Ventas - {{ annoSeleccionado }}</h3>
              <button class="modal-close" (click)="cerrarModalMeta()">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Meta Anual (S/.)</label>
                <input type="number" class="inp" [(ngModel)]="metaEditable" min="0" step="100">
              </div>
              <p class="info-text">La meta se divide automáticamente en 12 meses iguales.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="cerrarModalMeta()">Cancelar</button>
              <button class="btn-primary" (click)="guardarMeta()">Guardar Meta</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reportes-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .ph-l { display: flex; align-items: center; gap: 12px; }
    .ph-ico { width: 44px; height: 44px; background: linear-gradient(135deg, #550F26 0%, #7a1f45 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .ph-ico svg { width: 24px; height: 24px; }
    .ph-t { margin: 0; font-size: 20px; font-weight: 600; color: #333; }
    .ph-s { margin: 4px 0 0; font-size: 13px; color: #888; }
    
    .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
    .tab { padding: 10px 20px; border: none; background: transparent; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; border-radius: 8px; transition: all 0.2s; }
    .tab:hover { background: #f5f5f5; }
    .tab.active { background: #550F26; color: white; }
    
    .filtros { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; }
    .filtro-group { display: flex; flex-direction: column; gap: 6px; }
    .lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .inp { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; }
    .inp:focus { outline: none; border-color: #550F26; }
    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #fff; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; cursor: pointer; color: #555; }
    .btn-refresh:hover { border-color: #550F26; color: #550F26; }
    
    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 32px; height: 32px; border: 3px solid #f0e9e6; border-top-color: #550F26; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .empty-state { text-align: center; padding: 60px; color: #aaa; }
    .empty-state p { margin-top: 16px; font-size: 15px; }
    
    .resumen-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .resumen-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #eee; }
    .rc-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .rc-content { display: flex; flex-direction: column; }
    .rc-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .rc-value { font-size: 24px; font-weight: 700; color: #333; font-family: Georgia, serif; }
    
    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
    
    .chart-card { background: #fff; border-radius: 12px; border: 1px solid #eee; padding: 20px; }
    .chart-title { margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #333; }
    .chart-card canvas { max-height: 280px; }
    
    .tabla-card { background: #fff; border-radius: 12px; border: 1px solid #eee; padding: 20px; margin-top: 24px; }
    .tabla { width: 100%; border-collapse: collapse; }
    .tabla th { text-align: left; padding: 12px; font-size: 12px; color: #888; text-transform: uppercase; border-bottom: 1px solid #eee; }
    .tabla td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
    .tabla tr:hover { background: #fafafa; }
    .tabla tr.low-stock { background: #fef2f2; }
    
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge.bajo { background: #fef2f2; color: #dc2626; }
    .badge.medio { background: #fef3c7; color: #d97706; }
  `]
})
export class AdminReportesComponent implements OnInit, AfterViewInit {
  @ViewChild('chartVentasDiarias') chartVentasDiarias!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMetodosPago') chartMetodosPago!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTortas') chartTortas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDelivery') chartDelivery!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartComparacion') chartComparacion!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCategoria') chartCategoria!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartStock') chartStock!: ElementRef<HTMLCanvasElement>;

  datosVentas = signal<ReporteVenta | null>(null);
  datosDashboard = signal<DashboardData | null>(null);
  datosInventario = signal<InventarioData | null>(null);
  cargando = signal(false);
  tabActual = signal<'ventas' | 'dashboard' | 'inventario'>('dashboard');
  fechaDesde = '';
  fechaHasta = '';

  private Chart: any;
  private charts: any[] = [];

  constructor(private http: HttpClient) {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);
    this.fechaDesde = hace30.toISOString().split('T')[0];
    this.fechaHasta = hoy.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadChartJS();
  }

  ngAfterViewInit(): void {
    this.cargarDashboard();
  }

  loadChartJS(): void {
    import('chart.js/auto').then((module) => {
      this.Chart = module.default;
      this.Chart.defaults.font.family = "'Segoe UI', Arial, sans-serif";
      this.Chart.defaults.color = '#666';
    });
  }

  cambiarTab(tab: 'ventas' | 'dashboard' | 'inventario'): void {
    this.tabActual.set(tab);
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    
    if (tab === 'ventas') this.cargarReportes();
    else if (tab === 'dashboard') this.cargarDashboard();
    else this.cargarInventario();
  }

  cargarReportes(): void {
    this.cargando.set(true);
    const params = `?fechaDesde=${this.fechaDesde}&fechaHasta=${this.fechaHasta}`;
    
    this.http.get<ReporteVenta>(`${BASE}/Reporte/Ventas${params}`).subscribe({
      next: (data) => {
        this.datosVentas.set(data);
        this.cargando.set(false);
        setTimeout(() => this.renderCharts(data), 100);
      },
      error: (e) => {
        console.error('Error cargando reportes:', e);
        this.cargando.set(false);
      }
    });
  }

  cargarDashboard(): void {
    this.cargando.set(true);
    this.http.get<DashboardData>(`${BASE}/Reporte/Dashboard`).subscribe({
      next: (data) => {
        this.datosDashboard.set(data);
        this.cargando.set(false);
        setTimeout(() => this.renderDashboardCharts(data), 100);
      },
      error: (e) => {
        console.error('Error cargando dashboard:', e);
        this.cargando.set(false);
      }
    });
  }

  cargarInventario(): void {
    this.cargando.set(true);
    this.http.get<InventarioData>(`${BASE}/Reporte/Inventario`).subscribe({
      next: (data) => {
        this.datosInventario.set(data);
        this.cargando.set(false);
        setTimeout(() => this.renderInventarioCharts(data), 100);
      },
      error: (e) => {
        console.error('Error cargando inventario:', e);
        this.cargando.set(false);
      }
    });
  }

  renderCharts(data: ReporteVenta): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    if (!this.Chart) return;

    if (data.ventasPorDia?.length > 0) {
      this.charts.push(new this.Chart(this.chartVentasDiarias.nativeElement, {
        type: 'line',
        data: {
          labels: data.ventasPorDia.map(v => v.fecha),
          datasets: [{
            label: 'Ventas (S/.)',
            data: data.ventasPorDia.map(v => v.total),
            borderColor: '#550F26',
            backgroundColor: 'rgba(85, 15, 38, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v: number) => 'S/. ' + v } } }
        }
      }));
    }

    if (data.ventasPorMetodoPago?.length > 0) {
      this.charts.push(new this.Chart(this.chartMetodosPago.nativeElement, {
        type: 'doughnut',
        data: {
          labels: data.ventasPorMetodoPago.map(m => m.metodo),
          datasets: [{ data: data.ventasPorMetodoPago.map(m => m.total), backgroundColor: ['#550F26', '#7a1f45', '#a64d6d', '#d4889e', '#f0c4cf'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx: any) => 'S/. ' + ctx.raw.toFixed(2) } } } }
      }));
    }

    if (data.tortasMasVendidas?.length > 0) {
      this.charts.push(new this.Chart(this.chartTortas.nativeElement, {
        type: 'bar',
        data: {
          labels: data.tortasMasVendidas.map(t => t.nombre),
          datasets: [{ label: 'Cantidad', data: data.tortasMasVendidas.map(t => t.cantidad), backgroundColor: '#550F26' }]
        },
        options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }
      }));
    }

    if (data.entregasPorEstado?.length > 0) {
      this.charts.push(new this.Chart(this.chartDelivery.nativeElement, {
        type: 'pie',
        data: {
          labels: data.entregasPorEstado.map(e => e.estado),
          datasets: [{ data: data.entregasPorEstado.map(e => e.cantidad), backgroundColor: ['#fef3c7', '#dbeafe', '#dcfce7'], borderColor: ['#d97706', '#2563eb', '#16a34a'], borderWidth: 2 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }
  }

  renderDashboardCharts(data: DashboardData): void {
    if (!this.Chart) return;

    this.charts.push(new this.Chart(this.chartComparacion.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Mes Anterior', 'Mes Actual'],
        datasets: [{ label: 'Ventas', data: [data.comparacionMes.mesAnterior, data.comparacionMes.mesActual], backgroundColor: ['#7a1f45', '#550F26'] }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: number) => 'S/. ' + v } } } }
    }));

    if (data.ventasPorCategoria?.length > 0) {
      this.charts.push(new this.Chart(this.chartCategoria.nativeElement, {
        type: 'doughnut',
        data: {
          labels: data.ventasPorCategoria.map(c => c.categoria),
          datasets: [{ data: data.ventasPorCategoria.map(c => c.total), backgroundColor: ['#550F26', '#7a1f45', '#a64d6d', '#d4889e', '#f0c4cf', '#e8d5da'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }
  }

  renderInventarioCharts(data: InventarioData): void {
    if (!this.Chart) return;

    const bajo = data.insumos.filter(i => i.estadoStock === 'Bajo').length;
    const medio = data.insumos.filter(i => i.estadoStock === 'Medio').length;
    const normal = data.insumos.filter(i => i.estadoStock === 'Normal').length;

    this.charts.push(new this.Chart(this.chartStock.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Bajo', 'Medio', 'Normal'],
        datasets: [{ data: [bajo, medio, normal], backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'], borderColor: ['#dc2626', '#d97706', '#16a34a'], borderWidth: 2 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    }));
  }
}
