import { AdminInsumosComponent } from './../pages/modulo-administrativo/admin-insumos/admin-insumos.component';
import { Routes } from '@angular/router';
import { adminGuard } from '../guards/auth.guard';
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

      { path: 'pago', loadComponent: () => import('./pago/pago.component').then(m => m.PagoComponent) },
      { path: 'pagoyape', loadComponent: () => import('../pages/pagoyape/pagoyape.component').then(m => m.PagoyapeComponent) },

      { path: 'pagar', loadComponent: () => import('../widgets/pagar/pagar.component').then(m => m.PagarComponent) },
      { path: 'password', loadComponent: () => import('../widgets/form-password/form-password').then(m => m.PasswordComponent) },
      { path: 'widget-listarpersonal', loadComponent: () => import('../widgets/listar-personal/listar-personal').then(m => m.ListarpersonalComponent) },

      { path: 'tortas-especiales', loadComponent: () => import('../pages/tortasespeciales/tortasespeciales.component').then(m => m.TortasespecialesComponent) },
      { path: 'tortas-matrimonio', loadComponent: () => import('../pages/tortasmatrimonio/tortamatrimonio').then(m => m.TortamatrimonioComponent) },

      { path: 'iniciar', loadComponent: () => import('../pages/iniciar/iniciar.component').then(m => m.IniciarComponent) },
      { path: 'registrarse', loadComponent: () => import('../pages/registrarse/registrarse.component').then(m => m.RegistrarseComponent) },
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
            .then(m => m.AdminInsumosComponent),
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
    ],
  },

  {
    path: '**',
    redirectTo: ''
  }
];
