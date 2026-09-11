import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AdminDashboardService } from '../../../services/admin-dashboard.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  userName = 'Administrador';
  loading = true;
  error = '';
  data: any = null;
  private resumenCache: any = {};
  private lowStockCache: any[] = [];
  private ventasCache: any[] = [];
  private produccionesHoyCache: any[] = [];
  private refresh?: Subscription;

  constructor(
    private dashboard: AdminDashboardService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      this.userName = user.persona?.nombres ?? user.username ?? this.userName;
    }
    this.refresh = timer(0, 300000).pipe(switchMap(() => this.dashboard.cargar()))
      .subscribe({
        next: value => {
          this.data = value;
          this.actualizarIndicadores(value);
          this.loading = false;
          this.error = '';
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo actualizar el resumen.';
          this.changeDetector.markForCheck();
        },
      });
  }

  ngOnDestroy(): void { this.refresh?.unsubscribe(); }

  private actualizarIndicadores(value: any): void {
    const today = new Date().toISOString().slice(0, 10);
    const ventas = value?.ventas ?? [];
    const resumen = value?.dashboard?.resumen ?? {};
    const todaySales = ventas.filter((sale: any) =>
      (sale.fechaVenta ?? sale.fecha ?? '').startsWith(today));

    this.resumenCache = {
      ...resumen,
      ventasHoy: resumen.ventasHoy ?? todaySales.length,
      totalHoy: resumen.totalHoy ?? todaySales.reduce(
        (sum: number, sale: any) => sum + Number(sale.total ?? 0), 0),
    };

    const unique = new Map<number, any>();
    for (const item of [...(value?.inventario?.insumos ?? []), ...(value?.insumos ?? [])]) {
      const stock = Number(item.cantidad ?? item.stockDisponible ?? 0);
      if (item.estadoStock?.toLowerCase() === 'bajo' || stock <= 0) {
        unique.set(Number(item.id), { ...item, cantidad: stock });
      }
    }
    this.lowStockCache = [...unique.values()];
    this.ventasCache = value?.dashboard?.ultimasVentas?.length
      ? value.dashboard.ultimasVentas
      : ventas.slice().sort((a: any, b: any) =>
        new Date(b.fechaVenta ?? b.fecha ?? 0).getTime() -
        new Date(a.fechaVenta ?? a.fecha ?? 0).getTime()).slice(0, 5);
    this.produccionesHoyCache = (value?.producciones ?? []).filter((production: any) =>
      (production.fechaProduccion ?? '').slice(0, 10) === today);
  }

  get resumen(): any {
    return this.resumenCache;
  }
  get lowStock(): any[] {
    return this.lowStockCache;
  }
  get ventas(): any[] {
    return this.ventasCache;
  }
  get produccionesHoy(): any[] {
    return this.produccionesHoyCache;
  }
  get pendingCount(): number { return this.data?.pendientes?.length ?? 0; }
  get moneyToday(): number { return Number(this.resumen.totalHoy ?? 0); }
}
