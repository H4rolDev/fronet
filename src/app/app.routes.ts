import { AdminCategoriaTortaComponent } from './../pages/modulo-administrativo/admin-categoria-torta/admin-categoria-torta.component';
import { Routes } from '@angular/router';
import { adminGuard } from '../guards/auth.guard';
import { repartidorGuard } from '../guards/repartidor.guard';
import { PrincipalClientComponent } from './principal-client/principal-client.component';

export const routes: Routes = [
  {
    path: '',
    component: PrincipalClientComponent,
    children: [

      { path: '', loadComponent: () => import('../bienvenida/bienvenida.component').then(m => m.BienvenidaComponent) },

      { path: 'home', loadComponent: () => import('../pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('../pages/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('../pages/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'products', loadComponent: () => import('../pages/products/products.component').then(m => m.ProductsComponent) },

      { path: 'lista', loadComponent: () => import('../pages/productos/lista-productos.component').then(m => m.ProductosComponent) },

      { path: 'pagar', loadComponent: () => import('./pago/pago.component').then(m => m.PagoComponent) },
      { path: 'pagoyape', loadComponent: () => import('../pages/pagoyape/pagoyape.component').then(m => m.PagoyapeComponent) },

      { path: 'password', loadComponent: () => import('../widgets/form-password/form-password').then(m => m.PasswordComponent) },
      { path: 'widget-listarpersonal', loadComponent: () => import('../widgets/listar-personal/listar-personal').then(m => m.ListarpersonalComponent) },

      { path: 'tortas-especiales', loadComponent: () => import('../pages/tortasespeciales/tortasespeciales.component').then(m => m.TortasespecialesComponent) },
      { path: 'tortas-matrimonio', loadComponent: () => import('../pages/tortasmatrimonio/tortamatrimonio').then(m => m.TortamatrimonioComponent) },

      { path: 'iniciar', loadComponent: () => import('../pages/iniciar/iniciar.component').then(m => m.IniciarComponent) },
      { path: 'registrarse', loadComponent: () => import('../pages/registrarse/registrarse.component').then(m => m.RegistrarseComponent) },

      { path: 'cuenta', loadComponent: () => import('../pages/cliente-cuenta/cliente-cuenta.component').then(m => m.ClienteCuentaComponent) },
      { path: 'pedidos', loadComponent: () => import('../pages/cliente-pedidos/cliente-pedidos.component').then(m => m.ClientePedidosComponent) },
    ]
  },

  {
    path: '',
    children: [
    ]
  },

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../pages/modulo-administrativo/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),
      },
      {
        path: 'tortas',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-tortas/admin-tortas.component')
            .then(m => m.AdminTortasComponent),
      },
      {
        path: 'cuenta',
        loadComponent: () =>
          import('../pages/modulo-administrativo/cuenta/cuenta.component')
            .then(m => m.CuentaComponent),
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-insumos/admin-insumos.component')
            .then(m => m.AdminInsumoComponent),
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-proveedor/admin-proveedor.component')
            .then(m => m.AdminProveedorComponent),
      },
      {
        path: 'unidad-medida',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-unidad-medida/admin-unidad-medida.component')
            .then(m => m.AdminUnidadMedidaComponent),
      },
      {
        path: 'receta-torta',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-receta-torta/admin-receta-torta.component')
            .then(m => m.AdminRecetaTortaComponent),
      },
      {
        path: 'categoria-torta',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-categoria-torta/admin-categoria-torta.component')
            .then(m => m.AdminCategoriaTortaComponent),
      },
      {
        path: 'tipo-movimiento',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-tipo-movimiento/admin-tipo-movimiento.component')
            .then(m => m.AdminTipoMovimientoComponent),
      },
      {
        path: 'movimiento-insumo',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-movimiento-insumo/admin-movimiento-insumo.component')
            .then(m => m.AdminMovimientoInsumoComponent),
      },
      {
        path: 'movimiento-torta',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-movimiento-torta/admin-movimiento-torta.component')
            .then(m => m.AdminMovimientoTortaComponent),
      },
      {
        path: 'produccion',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-produccion/admin-produccion.component')
            .then(m => m.AdminProduccionComponent),
      },
      {
        path: 'venta',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-venta/admin-venta.component')
            .then(m => m.AdminVentaComponent),
      },
      {
        path: 'delivery',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-delivery/admin-delivery.component')
            .then(m => m.AdminDeliveryComponent),
      },
      {
path: 'validar-pagos',
          loadComponent: () => import('../pages/modulo-administrativo/admin-validar-pagos/admin-validar-pagos.component')
            .then(m => m.AdminValidarPagosComponent)
        },
        {
          path: 'validar-entradas',
          loadComponent: () => import('../pages/modulo-administrativo/admin-validar-entradas/admin-validar-entradas.component')
            .then(m => m.AdminValidarEntradasComponent)
        },
      {
        path: 'reportes',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-reportes/admin-reportes.component')
            .then(m => m.AdminReportesComponent),
      },
      {
        path: 'personal',
        loadComponent: () =>
          import('./pages/modulo-administrativo/admin-personal/admin-personal.component')
            .then(m => m.AdminPersonalComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/modulo-administrativo/admin-clientes/admin-clientes.component')
            .then(m => m.AdminClientesComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/modulo-administrativo/admin-roles/admin-roles.component')
            .then(m => m.AdminRolesComponent),
      },
      {
        path: 'repartidor',
        loadComponent: () =>
          import('../pages/modulo-administrativo/repartidor/repartidor.component')
            .then(m => m.RepartidorComponent),
      },
    ],
  },

  {
    path: '**',
    redirectTo: ''
  }
];
