import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

interface ReporteEntradas {
  totalEntradas: number;
  valorTotal: number;
  entradasPorProveedor: { proveedor: string; cantidad: number; total: number }[];
  entradasPorMes: { mes: string; cantidad: number; total: number }[];
  topInsumos: { insumo: string; cantidad: number; costoTotal: number }[];
}

interface ReporteCostos {
  costos: { insumo: string; stockActual: number; unidadMedida: string; ultimoCosto: number; cantidadRecibida: number; costoTotal: number; estado: string }[];
  valorTotalInventario: number;
  cantidadInsumos: number;
}

interface ReporteFinanciero {
  anno: number;
  totalVentas: number;
  totalCostos: number;
  gananciaNeta: number;
  margenPorcentual: number;
  mensual: { mes: string; ventas: number; costos: number; ganancia: number }[];
}

interface ReporteMeta {
  anno: number;
  metaAnual: number;
  ventasReal: number;
  cumplimientoAnual: number;
  cumplimientoPorMes: { mes: string; meta: number; real: number; cumplimiento: number }[];
  metaConfigurada?: boolean;
}

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reportes-page">
        @if (mostrarModalMeta()) {
          <div class="modal-overlay" (click)="cerrarModalMeta()" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="modal-content" (click)="$event.stopPropagation()" style="background:white;border-radius:16px;padding:24px;width:90%;max-width:450px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
              <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h3 style="margin:0;font-size:18px;color:#111;">Configurar Meta de Ventas - {{ annoSeleccionado }}</h3>
                <button (click)="cerrarModalMeta()" style="background:none;border:none;font-size:28px;cursor:pointer;color:#888;">×</button>
              </div>
              <div class="modal-body" style="margin-bottom:24px;">
                <div style="margin-bottom:16px;">
                  <label style="display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;">Meta Anual (S/.)</label>
                  <input type="number" [(ngModel)]="metaEditable" min="0" step="100" style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font-size:16px;">
                </div>
                <p style="font-size:13px;color:#6b7280;margin:0;">La meta se divide automáticamente en 12 meses iguales.</p>
              </div>
              <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:12px;">
                <button (click)="cerrarModalMeta()" style="padding:12px 20px;background:#f3f4f6;border:none;border-radius:8px;font-weight:600;cursor:pointer;color:#374151;">Cancelar</button>
                <button (click)="guardarMeta()" style="padding:12px 20px;background:#550F26;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Guardar Meta</button>
              </div>
            </div>
          </div>
        }
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Reportes</h2>
            <p class="ph-s">Análisis integral del negocio</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="export-btns">
            <button class="btn-export" (click)="exportarExcel()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Excel
            </button>
            <button class="btn-export" (click)="exportarTXT()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              TXT
            </button>
            <button class="btn-export" (click)="exportarPDF()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              PDF
            </button>
          </div>
        </div>
      </header>

      <!-- Tabs de navegación -->
      <div class="tabs-nav">
        <button class="tab-btn" [class.active]="tabActual() === 'ventas'" (click)="cambiarTab('ventas')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
          Ventas
        </button>
        <button class="tab-btn" [class.active]="tabActual() === 'insumos'" (click)="cambiarTab('insumos')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4a2 2 0 00-1 1.73v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z"/>
          </svg>
          Insumos
        </button>
        <button class="tab-btn" [class.active]="tabActual() === 'financiero'" (click)="cambiarTab('financiero')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Financiero
        </button>
        <button class="tab-btn" [class.active]="tabActual() === 'meta'" (click)="cambiarTab('meta')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Metas
        </button>
      </div>

      <!-- Filtros -->
      <div class="filtros">
        <div class="filtro-group">
          <label class="lbl">Desde</label>
          <input type="date" class="inp" [(ngModel)]="fechaDesde" (change)="aplicarFiltros()" />
        </div>
        <div class="filtro-group">
          <label class="lbl">Hasta</label>
          <input type="date" class="inp" [(ngModel)]="fechaHasta" (change)="aplicarFiltros()" />
        </div>
        <div class="filtro-group">
          <label class="lbl">Año</label>
          <select class="inp" [(ngModel)]="annoSeleccionado" (change)="aplicarFiltros()">
            <option [value]="2026">2026</option>
            <option [value]="2025">2025</option>
            <option [value]="2024">2024</option>
          </select>
        </div>
        <button class="btn-refresh" (click)="aplicarFiltros()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      }

      <!-- TAB VENTAS -->
      @if (!cargando() && tabActual() === 'ventas' && datosVentas()) {
        <div class="tab-content">
          <div class="report-desc">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>¿Qué estás viendo aquí?</strong>
              <p>Este reporte te muestra todo sobre las ventas del negocio: el <strong>total de ingresos</strong> (cuánto dinero ha entrado), la <strong>cantidad de pedidos</strong>, el <strong>ticket promedio</strong> por cliente y las <strong>tortas más vendidas</strong>. Los gráficos te ayudan a identificar los días de mayor movimiento, qué métodos de pago usan tus clientes (efectivo, Yape, Plin, tarjeta), y el estado de los deliveries.</p>
              <p class="report-desc-use"><strong>¿Para qué te sirve?</strong> Para planificar tu producción según los días más fuertes, saber qué tortas promocionar, decidir si necesitas más personal ciertos días, y ver si las entregas están yendo bien. Usa los filtros de fecha para analizar un período específico como una campaña o temporada.</p>
            </div>
          </div>
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
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
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
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
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M6 9l6 6 12-12"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total Tortas Vendidas</span>
                <span class="rc-value">{{ getTotalTortasVendidas() }}</span>
              </div>
            </div>
          </div>
          <div class="charts-grid">
            <div class="chart-card">
              <h3 class="chart-title">Tendencia de Ventas</h3>
              <canvas #chartVentasDiarias></canvas>
            </div>
            <div class="chart-card">
              <h3 class="chart-title">Ventas por Método de Pago</h3>
              <canvas #chartMetodosPago></canvas>
            </div>
            <div class="chart-card">
              <h3 class="chart-title">Top Tortas Más Vendidas</h3>
              <canvas #chartTortas></canvas>
            </div>
            <div class="chart-card">
              <h3 class="chart-title">Estado de Deliveries</h3>
              <canvas #chartDelivery></canvas>
            </div>
          </div>
        </div>
      }

      <!-- TAB INSUMOS -->
      @if (!cargando() && tabActual() === 'insumos' && datosCostos()) {
        <div class="tab-content">
          <div class="report-desc">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>¿Qué estás viendo aquí?</strong>
              <p>Este reporte te muestra el estado actual de tu <strong>inventario de insumos</strong> (harina, azúcar, huevos, mantequilla, etc.). Verás el <strong>stock disponible</strong> de cada insumo, su <strong>último costo de compra</strong>, el <strong>valor total del inventario</strong> (cuánto dinero tienes invertido en ingredientes), y una alerta visual en amarillo para los insumos que están por debajo de su <strong>stock mínimo</strong>.</p>
              <p class="report-desc-use"><strong>¿Para qué te sirve?</strong> Para saber exactamente qué insumos necesitas comprar con urgencia, calcular cuánto dinero necesitas para reponer tu almacén, evitar quedarte sin ingredientes clave para producir tus tortas, y controlar tus costos. Los insumos marcados en amarillo son los que deberías pedir ya a tus proveedores.</p>
            </div>
          </div>
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4a2 2 0 00-1 1.73v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total Insumos</span>
                <span class="rc-value">{{ datosCostos()!.cantidadInsumos }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Bajo Stock</span>
                <span class="rc-value">{{ getBajoStock() }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Valor Inventario</span>
                <span class="rc-value">S/. {{ datosCostos()!.valorTotalInventario.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div class="charts-grid">
            <div class="chart-card full-width">
              <h3 class="chart-title">Costos por Insumo</h3>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Stock</th>
                      <th>Unidad</th>
                      <th>Último Costo</th>
                      <th>Costo Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of (datosCostos()!.costos ?? []).slice(0, 15); track c.insumo) {
                      <tr [class.low-stock]="c.estado === 'Bajo Stock'">
                        <td>{{ c.insumo }}</td>
                        <td>{{ c.stockActual }}</td>
                        <td>{{ c.unidadMedida }}</td>
                        <td>S/. {{ c.ultimoCosto.toFixed(2) }}</td>
                        <td>S/. {{ c.costoTotal.toFixed(2) }}</td>
                        <td>
                          <span class="badge" [class.badge--warning]="c.estado === 'Bajo Stock'">{{ c.estado }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB FINANCIERO -->
      @if (!cargando() && tabActual() === 'financiero' && datosFinanciero()) {
        <div class="tab-content">
          <div class="report-desc">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>¿Qué estás viendo aquí?</strong>
              <p>Este reporte te ayuda a entender la <strong>salud financiera</strong> de tu negocio. Compara lo que has <strong>vendido</strong> contra lo que has <strong>gastado en insumos</strong>, y calcula tu <strong>ganancia neta</strong> (el dinero que realmente te queda) y tu <strong>margen de ganancia</strong> (qué tan rentable es tu negocio en porcentaje). La tabla mensual te muestra mes a mes la evolución de ingresos, costos y ganancia.</p>
              <p class="report-desc-use"><strong>¿Para qué te sirve?</strong> Para saber si tus precios de venta cubren bien tus costos, identificar los meses más rentables y los más flojos, decidir si necesitas ajustar precios o buscar insumos más baratos, y evaluar si el negocio está siendo rentable a lo largo del tiempo.</p>
              <p class="report-desc-note"><strong>Nota:</strong> Este reporte solo considera los costos de insumos (materia prima). No incluye gastos como alquiler, servicios o sueldos.</p>
            </div>
          </div>
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total Ingresos {{ datosFinanciero()!.anno }}</span>
                <span class="rc-value">S/. {{ datosFinanciero()!.totalVentas.toFixed(2) }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4a2 2 0 00-1 1.73v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Total Costos</span>
                <span class="rc-value">S/. {{ datosFinanciero()!.totalCostos.toFixed(2) }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Ganancia Neta</span>
                <span class="rc-value">S/. {{ datosFinanciero()!.gananciaNeta.toFixed(2) }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Margen</span>
                <span class="rc-value">{{ datosFinanciero()!.margenPorcentual.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <div class="charts-grid">
            <div class="chart-card full-width">
              <h3 class="chart-title">Resumen Mensual {{ annoSeleccionado }}</h3>
              <canvas #chartFinanciero></canvas>
            </div>
          </div>
          <div class="chart-card full-width">
            <h3 class="chart-title">Detalle Mensual</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Ventas</th>
                    <th>Costos</th>
                    <th>Ganancia</th>
                    <th>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of datosFinanciero()!.mensual; track m.mes) {
                    <tr>
                      <td>{{ m.mes }}</td>
                      <td>S/. {{ m.ventas.toFixed(2) }}</td>
                      <td>S/. {{ m.costos.toFixed(2) }}</td>
                      <td [class.positive]="m.ganancia > 0" [class.negative]="m.ganancia < 0">
                        S/. {{ m.ganancia.toFixed(2) }}
                      </td>
                      <td>{{ (m.ventas > 0 ? (m.ganancia / m.ventas * 100) : 0).toFixed(1) }}%</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- TAB METAS -->
      @if (!cargando() && tabActual() === 'meta' && datosMeta()) {
        <div class="tab-content">
          <div class="report-desc">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>¿Qué estás viendo aquí?</strong>
              <p>Este reporte te permite <strong>establecer objetivos de ventas</strong> y hacer seguimiento a su cumplimiento. Tú defines cuánto quieres vender en el año (tu <strong>meta anual</strong>), el sistema divide ese monto en 12 partes iguales, y cada mes podrás ver si estás <strong>cumpliendo</strong> o <strong>atrasado</strong>. La tabla y el gráfico muestran la meta vs lo real mes a mes, con el porcentaje de cumplimiento.</p>
              <p class="report-desc-use"><strong>¿Para qué te sirve?</strong> Para hacer seguimiento a tus objetivos comerciales, identificar a tiempo si las ventas están por debajo de lo esperado y tomar acciones correctivas, motivar a tu equipo mostrándoles el avance, y ajustar tus metas futuras basándote en datos reales.</p>
            </div>
          </div>
          <div style="text-align: right; margin-bottom: 16px;">
            <button class="btn-primary" (click)="abrirModalMeta()" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #550F26; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M6 20v-6M18 20v-4"/></svg>
              Configurar Meta
            </button>
          </div>
          <div class="resumen-cards">
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #550F26 0%, #7a1f45 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Meta Anual</span>
                <span class="rc-value">S/. {{ datosMeta()!.metaAnual.toFixed(0) }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">Ventas Reales</span>
                <span class="rc-value">S/. {{ datosMeta()!.ventasReal.toFixed(0) }}</span>
              </div>
            </div>
            <div class="resumen-card">
              <div class="rc-icon" [style.background]="datosMeta()!.cumplimientoAnual >= 100 ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M12 20V10M6 20v-6M18 20v-4"/>
                </svg>
              </div>
              <div class="rc-content">
                <span class="rc-label">% Cumplimiento</span>
                <span class="rc-value">{{ datosMeta()!.cumplimientoAnual.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <div class="charts-grid">
            <div class="chart-card full-width">
              <h3 class="chart-title">Cumplimiento por Mes - {{ annoSeleccionado }}</h3>
              <canvas #chartMeta></canvas>
            </div>
          </div>
          <div class="chart-card full-width">
            <h3 class="chart-title">Detalle de Cumplimiento</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Meta</th>
                    <th>Real</th>
                    <th>Cumplimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of datosMeta()!.cumplimientoPorMes; track m.mes) {
                    <tr>
                      <td>{{ m.mes }}</td>
                      <td>S/. {{ m.meta.toFixed(0) }}</td>
                      <td>S/. {{ m.real.toFixed(0) }}</td>
                      <td [class.positive]="m.cumplimiento >= 100" [class.negative]="m.cumplimiento < 100">
                        {{ m.cumplimiento.toFixed(1) }}%
                      </td>
                      <td>
                        <span class="badge" [class.badge--success]="m.cumplimiento >= 100" [class.badge--warning]="m.cumplimiento < 100">
                          {{ m.cumplimiento >= 100 ? 'Cumplido' : 'Pendiente' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      @if (!cargando() && !datosVentas() && tabActual() === 'ventas') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          <p>No hay datos de ventas para el período seleccionado</p>
        </div>
      }
      @if (!cargando() && !datosCostos() && tabActual() === 'insumos') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4a2 2 0 00-1 1.73v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z"/>
          </svg>
          <p>No hay datos de insumos para el período seleccionado</p>
        </div>
      }
      @if (!cargando() && !datosFinanciero() && tabActual() === 'financiero') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <p>No hay datos financieros para el año seleccionado</p>
        </div>
      }
      @if (!cargando() && !datosMeta() && tabActual() === 'meta') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <p>No hay datos de metas para el año seleccionado</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .reportes-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
    .header-actions { display: flex; gap: 12px; }
    .ph-l { display: flex; align-items: center; gap: 16px; }
    .ph-ico { width: 52px; height: 52px; background: linear-gradient(135deg, #550F26, #7a1f45); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(85,15,38,0.3); }
    .ph-ico svg { width: 26px; height: 26px; }
    .ph-t { margin: 0; font-size: 24px; font-weight: 700; color: #111; }
    .ph-s { margin: 4px 0 0; font-size: 14px; color: #6b7280; }

    .export-btns { display: flex; gap: 8px; }
    .btn-export { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
    .btn-export:hover { background: #f9fafb; border-color: #550F26; color: #550F26; }

    .tabs-nav { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 0; }
    .tab-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: transparent; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.2s; border-radius: 8px 8px 0 0; }
    .tab-btn:hover { color: #550F26; background: #f9fafb; }
    .tab-btn.active { color: #550F26; background: #fff; border-bottom-color: #550F26; font-weight: 600; }

    .filtros { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; }
    .filtro-group { display: flex; flex-direction: column; gap: 6px; }
    .lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; }
    .inp { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-width: 150px; }
    .inp:focus { outline: none; border-color: #550F26; box-shadow: 0 0 0 3px rgba(85,15,38,0.1); }
    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #550F26; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; transition: all 0.2s; }
    .btn-refresh:hover { background: #7a1f45; transform: translateY(-1px); }

    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #550F26; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px; color: #aaa; background: #f9fafb; border-radius: 16px; margin: 20px 0; }
    .empty-state p { margin-top: 16px; font-size: 16px; }

    .tab-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .resumen-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .resumen-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; transition: all 0.2s; }
    .resumen-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .rc-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .rc-content { display: flex; flex-direction: column; }
    .rc-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .rc-value { font-size: 24px; font-weight: 700; color: #111; font-family: Georgia, serif; }

    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
    
    .chart-card { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; }
    .chart-card.full-width { grid-column: 1 / -1; }
    .chart-title { margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151; }
    .chart-card canvas { max-height: 300px; }

    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
    .data-table tr:hover { background: #f9fafb; }
    .data-table .positive { color: #059669; font-weight: 600; }
    .data-table .negative { color: #dc2626; font-weight: 600; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge--success { background: #d1fae5; color: #059669; }
    .badge--warning { background: #fef3c7; color: #b45309; }
    .badge--danger { background: #fee2e2; color: #dc2626; }
    .low-stock { background: #fef3c7; }
    .report-desc { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; background: #f8f4f6; border: 1px solid #e8d5de; border-radius: 12px; margin-bottom: 24px; }
    .report-desc svg { width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; color: #550F26; }
    .report-desc strong { font-size: 14px; color: #550F26; display: block; margin-bottom: 6px; }
    .report-desc p { margin: 0 0 8px; font-size: 13.5px; color: #374151; line-height: 1.6; }
    .report-desc p:last-child { margin-bottom: 0; }
    .report-desc-use { padding: 8px 12px; background: #f0ebed; border-radius: 8px; }
    .report-desc-note { font-size: 12.5px; color: #6b7280; font-style: italic; }
  `]
})
export class AdminReportesComponent implements OnInit, AfterViewInit {
  @ViewChild('chartVentasDiarias') chartVentasDiarias!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMetodosPago') chartMetodosPago!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTortas') chartTortas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDelivery') chartDelivery!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartFinanciero') chartFinanciero!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMeta') chartMeta!: ElementRef<HTMLCanvasElement>;

  datosVentas = signal<ReporteVenta | null>(null);
  datosCostos = signal<ReporteCostos | null>(null);
  datosFinanciero = signal<ReporteFinanciero | null>(null);
  datosMeta = signal<ReporteMeta | null>(null);
  cargando = signal(false);
  
  tabActual = signal<'ventas' | 'insumos' | 'financiero' | 'meta'>('ventas');
  fechaDesde = '';
  fechaHasta = '';
  annoSeleccionado = 2026;

  mostrarModalMeta = signal(false);
  metaEditable = 0;

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
    this.cargarTodosReportes();
  }

  loadChartJS(): void {
    import('chart.js/auto').then((module) => {
      this.Chart = module.default;
      this.Chart.defaults.font.family = "'Segoe UI', Arial, sans-serif";
      this.Chart.defaults.color = '#666';
    });
  }

  cambiarTab(tab: 'ventas' | 'insumos' | 'financiero' | 'meta'): void {
    this.tabActual.set(tab);
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.cargarTodosReportes();
  }

  cargarTodosReportes(): void {
    this.cargando.set(true);
    this.cargarVentas();
    this.cargarCostos();
    this.cargarFinanciero();
    this.cargarMeta();
  }

  cargarVentas(): void {
    const params = `?fechaDesde=${this.fechaDesde}&fechaHasta=${this.fechaHasta}`;
    this.http.get<ReporteVenta>(`${BASE}/Reporte/Ventas${params}`).subscribe({
      next: (data) => {
        this.datosVentas.set(data);
        this.cargando.set(false);
        setTimeout(() => this.renderChartsVentas(data), 100);
      },
      error: (e) => {
        console.error('Error ventas:', e);
        this.cargando.set(false);
      }
    });
  }

  cargarCostos(): void {
    this.http.get<ReporteCostos>(`${BASE}/Reporte/CostosInsumos?anno=${this.annoSeleccionado}`).subscribe({
      next: (data) => {
        this.datosCostos.set(data);
        this.cargando.set(false);
      },
      error: (e) => {
        console.error('Error costos:', e);
        this.cargando.set(false);
      }
    });
  }

  cargarFinanciero(): void {
    this.http.get<ReporteFinanciero>(`${BASE}/Reporte/Financiero?anno=${this.annoSeleccionado}`).subscribe({
      next: (data) => {
        this.datosFinanciero.set(data);
        this.cargando.set(false);
        setTimeout(() => this.renderChartFinanciero(data), 100);
      },
      error: (e) => {
        console.error('Error financiero:', e);
        this.cargando.set(false);
      }
    });
  }

  cargarMeta(): void {
    this.http.get<ReporteMeta>(`${BASE}/Reporte/MetaVenta?anno=${this.annoSeleccionado}`).subscribe({
      next: (data) => {
        this.datosMeta.set(data);
        this.cargando.set(false);
        setTimeout(() => this.renderChartMeta(data), 100);
      },
      error: (e) => {
        console.error('Error meta:', e);
        this.cargando.set(false);
      }
    });
  }

  getTotalTortasVendidas(): number {
    const datos = this.datosVentas();
    if (!datos || !datos.tortasMasVendidas) return 0;
    return datos.tortasMasVendidas.reduce((sum, t) => sum + t.cantidad, 0);
  }

  getBajoStock(): number {
    const datos = this.datosCostos();
    if (!datos || !datos.costos) return 0;
    return datos.costos.filter(c => c.estado === 'Bajo Stock').length;
  }

  renderChartsVentas(data: ReporteVenta): void {
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
            backgroundColor: 'rgba(85,15,38,0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      }));
    }

    if (data.ventasPorMetodoPago?.length > 0) {
      this.charts.push(new this.Chart(this.chartMetodosPago.nativeElement, {
        type: 'doughnut',
        data: {
          labels: data.ventasPorMetodoPago.map(m => m.metodo),
          datasets: [{ data: data.ventasPorMetodoPago.map(m => m.total), backgroundColor: ['#550F26','#7a1f45','#a64d6d','#d4889e','#f0c4cf'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }

    if (data.tortasMasVendidas?.length > 0) {
      this.charts.push(new this.Chart(this.chartTortas.nativeElement, {
        type: 'bar',
        data: { labels: data.tortasMasVendidas.map(t => t.nombre), datasets: [{ label: 'Cantidad', data: data.tortasMasVendidas.map(t => t.cantidad), backgroundColor: '#550F26' }] },
        options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }
      }));
    }

    if (data.entregasPorEstado?.length > 0) {
      this.charts.push(new this.Chart(this.chartDelivery.nativeElement, {
        type: 'pie',
        data: { labels: data.entregasPorEstado.map(e => e.estado), datasets: [{ data: data.entregasPorEstado.map(e => e.cantidad), backgroundColor: ['#d1fae5','#fef3c7','#fee2e2'], borderColor: ['#059669','#d97706','#dc2626'], borderWidth: 2 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }));
    }
  }

  renderChartFinanciero(data: ReporteFinanciero): void {
    if (!this.Chart || !this.chartFinanciero) return;
    this.charts.forEach(c => { if (c.canvas === this.chartFinanciero.nativeElement) c.destroy(); });

    this.charts.push(new this.Chart(this.chartFinanciero.nativeElement, {
      type: 'bar',
      data: {
        labels: data.mensual.map(m => m.mes),
        datasets: [
          { label: 'Ventas', data: data.mensual.map(m => m.ventas), backgroundColor: '#22c55e' },
          { label: 'Costos', data: data.mensual.map(m => m.costos), backgroundColor: '#ef4444' },
          { label: 'Ganancia', data: data.mensual.map(m => m.ganancia), backgroundColor: '#550F26' }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    }));
  }

  renderChartMeta(data: ReporteMeta): void {
    if (!this.Chart || !this.chartMeta) return;
    this.charts.forEach(c => { if (c.canvas === this.chartMeta.nativeElement) c.destroy(); });

    this.charts.push(new this.Chart(this.chartMeta.nativeElement, {
      type: 'bar',
      data: {
        labels: data.cumplimientoPorMes.map(m => m.mes),
        datasets: [
          { label: 'Meta', data: data.cumplimientoPorMes.map(m => m.meta), backgroundColor: '#e5e7eb', borderColor: '#9ca3af', borderWidth: 1 },
          { label: 'Real', data: data.cumplimientoPorMes.map(m => m.real), backgroundColor: '#550F26' }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    }));
  }

  exportarExcel(): void {
    const tab = this.tabActual();
    let csv = '';
    if (tab === 'ventas' && this.datosVentas()) {
      csv = 'Fecha,Total,Cantidad\n';
      this.datosVentas()!.ventasPorDia.forEach(v => { csv += `${v.fecha},${v.total},${v.cantidad}\n`; });
    } else if (tab === 'insumos' && this.datosCostos()) {
      csv = 'Insumo,Stock,Unidad,Último Costo,Costo Total,Estado\n';
      this.datosCostos()!.costos.forEach(c => { csv += `${c.insumo},${c.stockActual},${c.unidadMedida},${c.ultimoCosto},${c.costoTotal},${c.estado}\n`; });
    } else if (tab === 'financiero' && this.datosFinanciero()) {
      csv = 'Mes,Ventas,Costos,Ganancia\n';
      this.datosFinanciero()!.mensual.forEach(m => { csv += `${m.mes},${m.ventas},${m.costos},${m.ganancia}\n`; });
    } else if (tab === 'meta' && this.datosMeta()) {
      csv = 'Mes,Meta,Real,Cumplimiento%\n';
      this.datosMeta()!.cumplimientoPorMes.forEach(m => { csv += `${m.mes},${m.meta},${m.real},${m.cumplimiento}\n`; });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reporte_${tab}_${this.annoSeleccionado}.csv`; a.click();
  }

  exportarTXT(): void {
    const tab = this.tabActual();
    const anno = this.annoSeleccionado;
    
    const contenido = this.generarContenidoTXT(tab, anno);
    
    const blob = new Blob(['\ufeff' + contenido], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tab}_${anno}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportarPDF(): void {
    const tab = this.tabActual();
    const anno = this.annoSeleccionado;
    
    const html = this.generarContenidoPDF(tab, anno);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tab}_${anno}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generarContenidoTXT(tab: string, anno: number): string {
    let txt = '';
    const fecha = new Date().toLocaleDateString('es-PE');
    
    txt += '='.repeat(60) + '\n';
    txt += `REPORTE DE ${tab.toUpperCase()} - AÑO ${anno}\n`;
    txt += `Fecha de generación: ${fecha}\n`;
    txt += '='.repeat(60) + '\n\n';

    if (tab === 'ventas' && this.datosVentas()) {
      const d = this.datosVentas()!;
      txt += 'RESUMEN DE VENTAS\n';
      txt += '-'.repeat(40) + '\n';
      txt += `Total Ventas:     S/. ${d.totalVentas.toFixed(2)}\n`;
      txt += `Cantidad:        ${d.cantidadVentas} ventas\n`;
      txt += `Promedio:        S/. ${d.promedioVenta.toFixed(2)}\n\n`;
      txt += 'VENTAS POR DÍA\n';
      txt += '-'.repeat(40) + '\n';
      d.ventasPorDia?.forEach(v => {
        txt += `${v.fecha.padEnd(15)} S/. ${v.total.toFixed(2).padStart(12)}\n`;
      });
    }
    else if (tab === 'insumos' && this.datosCostos()) {
      const d = this.datosCostos()!;
      txt += 'RESUMEN DE INSUMOS\n';
      txt += '-'.repeat(40) + '\n';
      txt += `Total Insumos:     ${d.cantidadInsumos}\n`;
      txt += `Valor Inventario: S/. ${d.valorTotalInventario.toFixed(2)}\n`;
      txt += `Bajo Stock:     ${d.costos.filter(c => c.estado === 'Bajo Stock').length}\n\n`;
      txt += 'COSTOS POR INSUMO\n';
      txt += '-'.repeat(40) + '\n';
      d.costos.slice(0, 20).forEach(c => {
        txt += `${c.insumo} | Stock: ${c.stockActual} | Costo: S/. ${c.costoTotal.toFixed(2)}\n`;
      });
    }
    else if (tab === 'financiero' && this.datosFinanciero()) {
      const d = this.datosFinanciero()!;
      txt += 'RESUMEN FINANCIERO\n';
      txt += '-'.repeat(40) + '\n';
      txt += `Total Ingresos: S/. ${d.totalVentas.toFixed(2)}\n`;
      txt += `Total Costos:    S/. ${d.totalCostos.toFixed(2)}\n`;
      txt += `Ganancia Neta:    S/. ${d.gananciaNeta.toFixed(2)}\n`;
      txt += `Margen:          ${d.margenPorcentual.toFixed(1)}%\n\n`;
      d.mensual.forEach(m => {
        txt += `${m.mes}: Ventas S/. ${m.ventas.toFixed(2)} | Costos S/. ${m.costos.toFixed(2)} | Ganancia S/. ${m.ganancia.toFixed(2)}\n`;
      });
    }
    else if (tab === 'meta' && this.datosMeta()) {
      const d = this.datosMeta()!;
      txt += 'CUMPLIMIENTO DE METAS\n';
      txt += '-'.repeat(40) + '\n';
      txt += `Meta Anual:      S/. ${d.metaAnual.toFixed(0)}\n`;
      txt += `Ventas Reales:   S/. ${d.ventasReal.toFixed(0)}\n`;
      txt += `Cumplimiento:  ${d.cumplimientoAnual.toFixed(1)}%\n\n`;
      d.cumplimientoPorMes.forEach(m => {
        txt += `${m.mes}: Meta S/. ${m.meta.toFixed(0)} | Real S/. ${m.real.toFixed(0)} | ${m.cumplimiento.toFixed(1)}%\n`;
      });
    }

    txt += '\n\n' + '='.repeat(60) + '\n';
    txt += 'Sistema de Gestión de Tortas\n';
    return txt;
  }

  private generarContenidoPDF(tab: string, anno: number): string {
    const fecha = new Date().toLocaleDateString('es-PE');
    const tabTitulo = tab.charAt(0).toUpperCase() + tab.slice(1);
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte ${tabTitulo} - ${anno}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #550F26; border-bottom: 2px solid #550F26; padding-bottom: 10px; }
    h2 { color: #550F26; margin-top: 30px; }
    .header { color: #666; margin-bottom: 20px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .kpi { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
    .kpi-value { font-size: 24px; font-weight: bold; color: #550F26; }
    .kpi-label { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #550F26; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Reporte de ${tabTitulo}</h1>
  <div class="header">
    <p><strong>Año:</strong> ${anno}</p>
    <p><strong>Fecha de generación:</strong> ${fecha}</p>
  </div>`;

    if (tab === 'ventas' && this.datosVentas()) {
      const d = this.datosVentas()!;
      html += `
  <h2>Resumen</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">S/. ${d.totalVentas.toFixed(2)}</div><div class="kpi-label">Total Ventas</div></div>
    <div class="kpi"><div class="kpi-value">${d.cantidadVentas}</div><div class="kpi-label">Cantidad</div></div>
    <div class="kpi"><div class="kpi-value">S/. ${d.promedioVenta.toFixed(2)}</div><div class="kpi-label">Promedio</div></div>
  </div>
  <h2>Ventas por Día</h2>
  <table><tr><th>Fecha</th><th>Total</th><th>Cantidad</th></tr>`;
      d.ventasPorDia?.forEach(v => {
        html += `<tr><td>${v.fecha}</td><td>S/. ${v.total.toFixed(2)}</td><td>${v.cantidad}</td></tr>`;
      });
      html += '</table>';
    }
    else if (tab === 'insumos' && this.datosCostos()) {
      const d = this.datosCostos()!;
      html += `
  <h2>Resumen</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">${d.cantidadInsumos}</div><div class="kpi-label">Total Insumos</div></div>
    <div class="kpi"><div class="kpi-value">S/. ${d.valorTotalInventario.toFixed(2)}</div><div class="kpi-label">Valor Inventario</div></div>
    <div class="kpi"><div class="kpi-value">${d.costos.filter(c => c.estado === 'Bajo Stock').length}</div><div class="kpi-label">Bajo Stock</div></div>
  </div>
  <h2>Costos por Insumo</h2>
  <table><tr><th>Insumo</th><th>Stock</th><th>Unidad</th><th>Costo Unitario</th><th>Costo Total</th><th>Estado</th></tr>`;
      d.costos.slice(0, 20).forEach(c => {
        html += `<tr><td>${c.insumo}</td><td>${c.stockActual}</td><td>${c.unidadMedida}</td><td>S/. ${c.ultimoCosto.toFixed(2)}</td><td>S/. ${c.costoTotal.toFixed(2)}</td><td>${c.estado}</td></tr>`;
      });
      html += '</table>';
    }
    else if (tab === 'financiero' && this.datosFinanciero()) {
      const d = this.datosFinanciero()!;
      html += `
  <h2>Resumen Anual</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">S/. ${d.totalVentas.toFixed(2)}</div><div class="kpi-label">Ingresos</div></div>
    <div class="kpi"><div class="kpi-value">S/. ${d.gananciaNeta.toFixed(2)}</div><div class="kpi-label">Ganancia Neta</div></div>
    <div class="kpi"><div class="kpi-value">${d.margenPorcentual.toFixed(1)}%</div><div class="kpi-label">Margen</div></div>
  </div>
  <h2>Resumen Mensual</h2>
  <table><tr><th>Mes</th><th>Ventas</th><th>Costos</th><th>Ganancia</th></tr>`;
      d.mensual.forEach(m => {
        html += `<tr><td>${m.mes}</td><td>S/. ${m.ventas.toFixed(2)}</td><td>S/. ${m.costos.toFixed(2)}</td><td>S/. ${m.ganancia.toFixed(2)}</td></tr>`;
      });
      html += '</table>';
    }
    else if (tab === 'meta' && this.datosMeta()) {
      const d = this.datosMeta()!;
      html += `
  <h2>Cumplimiento</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">S/. ${d.metaAnual.toFixed(0)}</div><div class="kpi-label">Meta Anual</div></div>
    <div class="kpi"><div class="kpi-value">S/. ${d.ventasReal.toFixed(0)}</div><div class="kpi-label">Real</div></div>
    <div class="kpi"><div class="kpi-value">${d.cumplimientoAnual.toFixed(1)}%</div><div class="kpi-label">Cumplimiento</div></div>
  </div>
  <table><tr><th>Mes</th><th>Meta</th><th>Real</th><th>%</th></tr>`;
      d.cumplimientoPorMes.forEach(m => {
        html += `<tr><td>${m.mes}</td><td>S/. ${m.meta.toFixed(0)}</td><td>S/. ${m.real.toFixed(0)}</td><td>${m.cumplimiento.toFixed(1)}%</td></tr>`;
      });
      html += '</table>';
    }

    html += `
  <div class="footer">
    <p>Sistema de Gestión de Tortas - Reportes</p>
  </div>
</body>
</html>`;

    return html;
  }

  abrirModalMeta(): void {
    const meta = this.datosMeta();
    this.metaEditable = meta?.metaAnual || 0;
    this.mostrarModalMeta.set(true);
  }

  cerrarModalMeta(): void {
    this.mostrarModalMeta.set(false);
  }

  guardarMeta(): void {
    const usuario = localStorage.getItem('usuario') || 'admin';
    this.http.post(`${BASE}/Reporte/MetaVenta`, {
      anio: this.annoSeleccionado,
      metaAnual: this.metaEditable,
      usuario: usuario
    }).subscribe({
      next: () => {
        this.cerrarModalMeta();
        this.cargarMeta();
        alert('Meta guardada correctamente');
      },
      error: (e) => console.error('Error guardando meta:', e)
    });
  }

  get accionesStyles(): string {
    return `
      .actions-bar { display: flex; justify-content: flex-end; margin-bottom: 20px; }
      .btn-primary { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #550F26; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
      .btn-primary:hover { background: #7a1f45; }
      .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      .modal-content { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 450px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
      .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .modal-header h3 { margin: 0; font-size: 18px; color: #111; }
      .modal-close { background: none; border: none; font-size: 28px; cursor: pointer; color: #888; }
      .modal-body { margin-bottom: 24px; }
      .form-group { margin-bottom: 16px; }
      .form-group label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
      .form-group input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; }
      .form-group input:focus { outline: none; border-color: #550F26; }
      .info-text { font-size: 13px; color: #6b7280; margin: 0; }
      .modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
      .btn-secondary { padding: 12px 20px; background: #f3f4f6; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; color: #374151; }
      .btn-secondary:hover { background: #e5e7eb; }
    `;
  }
}