import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RolEnum } from '../enums';

export interface ModuloPermiso {
  ruta: string;
  titulo: string;
  icono: string;
}

const MODULOS_POR_ROL: Record<RolEnum, ModuloPermiso[]> = {
  [RolEnum.Administrador]: [
    { ruta: '/admin/dashboard', titulo: 'Dashboard', icono: 'dashboard' },
    { ruta: '/admin/tortas', titulo: 'Tortas', icono: 'cake' },
    { ruta: '/admin/categoria-torta', titulo: 'Categoría Torta', icono: 'grid' },
    { ruta: '/admin/receta-torta', titulo: 'Recetas de Tortas', icono: 'recipe' },
    { ruta: '/admin/produccion', titulo: 'Producción de Torta', icono: 'factory' },
    { ruta: '/admin/insumos', titulo: 'Insumos', icono: 'inventory' },
    { ruta: '/admin/proveedores', titulo: 'Proveedores', icono: 'truck' },
    { ruta: '/admin/unidad-medida', titulo: 'Unidad de Medida', icono: 'scale' },
    { ruta: '/admin/movimiento-insumo', titulo: 'Movimiento de Insumos', icono: 'swap' },
    { ruta: '/admin/movimiento-torta', titulo: 'Movimiento de Tortas', icono: 'delivery' },
    { ruta: '/admin/tipo-movimiento', titulo: 'Tipos de Movimientos', icono: 'list' },
    { ruta: '/admin/venta', titulo: 'Venta de Tortas', icono: 'cart' },
    { ruta: '/admin/delivery', titulo: 'Delivery', icono: 'shipping' },
    { ruta: '/admin/validar-pagos', titulo: 'Validar Pagos', icono: 'payment' },
    { ruta: '/admin/validar-entradas', titulo: 'Validar Entradas', icono: 'input' },
    { ruta: '/admin/personal', titulo: 'Personal', icono: 'people' },
    { ruta: '/admin/clientes', titulo: 'Clientes', icono: 'person' },
    { ruta: '/admin/roles', titulo: 'Roles', icono: 'shield' },
    { ruta: '/admin/reportes', titulo: 'Reportes', icono: 'chart' }
  ],
  [RolEnum.Atencion]: [
    { ruta: '/admin/dashboard', titulo: 'Dashboard', icono: 'dashboard' },
    { ruta: '/admin/venta', titulo: 'Venta de Tortas', icono: 'cart' },
    { ruta: '/admin/delivery', titulo: 'Delivery', icono: 'shipping' },
    { ruta: '/admin/validar-pagos', titulo: 'Validar Pagos', icono: 'payment' },
    { ruta: '/admin/clientes', titulo: 'Clientes', icono: 'person' },
    { ruta: '/admin/reportes', titulo: 'Reportes', icono: 'chart' }
  ],
  [RolEnum.Produccion]: [
    { ruta: '/admin/dashboard', titulo: 'Dashboard', icono: 'dashboard' },
    { ruta: '/admin/tortas', titulo: 'Tortas', icono: 'cake' },
    { ruta: '/admin/categoria-torta', titulo: 'Categoría Torta', icono: 'grid' },
    { ruta: '/admin/receta-torta', titulo: 'Recetas de Tortas', icono: 'recipe' },
    { ruta: '/admin/produccion', titulo: 'Producción de Torta', icono: 'factory' },
    { ruta: '/admin/insumos', titulo: 'Insumos', icono: 'inventory' },
    { ruta: '/admin/unidad-medida', titulo: 'Unidad de Medida', icono: 'scale' },
    { ruta: '/admin/movimiento-insumo', titulo: 'Movimiento de Insumos', icono: 'swap' },
    { ruta: '/admin/movimiento-torta', titulo: 'Movimiento de Tortas', icono: 'delivery' },
    { ruta: '/admin/tipo-movimiento', titulo: 'Tipos de Movimientos', icono: 'list' },
    { ruta: '/admin/validar-entradas', titulo: 'Validar Entradas', icono: 'input' }
  ],
  [RolEnum.Repartidor]: [
    { ruta: '/admin/repartidor', titulo: 'Mis Pedidos', icono: 'delivery' }
  ],
  [RolEnum.Cliente]: [
    { ruta: '/cuenta', titulo: 'Mi Cuenta', icono: 'person' },
    { ruta: '/pedidos', titulo: 'Mis Pedidos', icono: 'shopping' }
  ]
};

@Injectable({ providedIn: 'root' })
export class PermisoService {
  constructor(private router: Router) {}

  tieneAcceso(ruta: string): boolean {
    const roles = this.obtenerRoles();
    if (roles.length === 0) return false;

    const primerRol = roles[0];
    const rolNumero = typeof primerRol === 'number' ? primerRol : this.obtenerRolNumero(primerRol);

    // Repartidor solo tiene acceso a su propia ruta
    if (rolNumero === RolEnum.Repartidor) {
      return ruta === '/admin/repartidor' || ruta.startsWith('/admin/repartidor');
    }

    // Administrador tiene acceso a todo
    if (rolNumero === RolEnum.Administrador) return true;

    const modulos = MODULOS_POR_ROL[rolNumero as RolEnum];
    if (!modulos) return false;

    return modulos.some(m => ruta.startsWith(m.ruta));
  }

  obtenerModulosPermitidos(): ModuloPermiso[] {
    const roles = this.obtenerRoles();
    if (roles.length === 0) return [];

    const primerRol = roles[0];
    const rolNumero = typeof primerRol === 'number' ? primerRol : this.obtenerRolNumero(primerRol);

    return MODULOS_POR_ROL[rolNumero as RolEnum] || [];
  }

  esRepartidor(): boolean {
    const roles = this.obtenerRoles();
    return roles.some(r => {
      const rolNum = typeof r === 'number' ? r : this.obtenerRolNumero(r);
      return rolNum === RolEnum.Repartidor;
    });
  }

  esAdministrador(): boolean {
    const roles = this.obtenerRoles();
    return roles.some(r => {
      const rolNum = typeof r === 'number' ? r : this.obtenerRolNumero(r);
      return rolNum === RolEnum.Administrador;
    });
  }

  esAtencion(): boolean {
    const roles = this.obtenerRoles();
    return roles.some(r => {
      const rolNum = typeof r === 'number' ? r : this.obtenerRolNumero(r);
      return rolNum === RolEnum.Atencion;
    });
  }

  esProduccion(): boolean {
    const roles = this.obtenerRoles();
    return roles.some(r => {
      const rolNum = typeof r === 'number' ? r : this.obtenerRolNumero(r);
      return rolNum === RolEnum.Produccion;
    });
  }

  private obtenerRoles(): any[] {
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];
    try {
      const user = JSON.parse(userStr);
      return user.roles || [];
    } catch {
      return [];
    }
  }

  private obtenerRolNumero(rolNombre: string): number {
    const rolMap: Record<string, number> = {
      'Administrador': RolEnum.Administrador,
      'Administrador ': RolEnum.Administrador,
      'Atencion': RolEnum.Atencion,
      'Atención': RolEnum.Atencion,
      'Produccion': RolEnum.Produccion,
      'Producción': RolEnum.Produccion,
      'Repartidor': RolEnum.Repartidor,
      'Cliente': RolEnum.Cliente
    };
    return rolMap[rolNombre.trim()] || 0;
  }

  tieneAccesoARuta(ruta: string): boolean {
    return this.tieneAcceso(ruta);
  }
}