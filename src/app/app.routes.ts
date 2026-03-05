import { Routes } from '@angular/router';
import { HomeComponent } from '../pages/home/home.component';
import { AboutComponent } from '../pages/about/about.component';
import { ContactComponent } from '../pages/contact/contact.component';
import { ProductsComponent } from '../pages/products/products.component';
import { PagoComponent } from './pago/pago.component';
import { ProductosComponent } from '../pages/productos/lista-productos.component';
import { IniciarComponent } from '../pages/iniciar/iniciar.component';
import { RegistrarseComponent } from '../pages/registrarse/registrarse.component';
import { PagarComponent } from '../widgets/pagar/pagar.component';
import { PasswordComponent } from '../widgets/form-password/form-password';
import { ListarpersonalComponent } from '../widgets/listar-personal/listar-personal';
import { PagoyapeComponent } from '../pages/pagoyape/pagoyape.component';
import { BienvenidaComponent } from '../bienvenida/bienvenida.component';
import { TortasespecialesComponent } from '../pages/tortasespeciales/tortasespeciales.component';
import { TortamatrimonioComponent } from '../pages/tortasmatrimonio/tortamatrimonio';
import { adminGuard } from '../guards/auth.guard';

export const routes: Routes = [

  { path: '', component: BienvenidaComponent },

  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'products', component: ProductsComponent },

  { path: 'pago', component: PagoComponent },
  { path: 'lista', component: ProductosComponent },

  { path: 'iniciar', component: IniciarComponent },
  { path: 'registrarse', component: RegistrarseComponent },

  { path: 'pagar', component: PagarComponent },
  { path: 'password', component: PasswordComponent },
  { path: 'widget-listarpersonal', component: ListarpersonalComponent },

  { path: 'pagoyape', component: PagoyapeComponent },

  { path: 'app-tortasespeciales', component: TortasespecialesComponent },
  { path: 'app-tortamatrimonio', component: TortamatrimonioComponent },

  { path: 'cuenta',
    loadComponent: () => import('../pages/modulo-administrativo/cuenta/cuenta.component')
      .then(m => m.CuentaComponent)
  },

  {
    path: 'admin',
    // canActivate: [adminGuard],
    loadComponent: () =>
      import('../pages/modulo-administrativo/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
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
      /* {
        path: 'recetas',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-recetas/admin-recetas.component')
            .then(m => m.AdminRecetasComponent),
      },
      {
        path: 'produccion',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-produccion/admin-produccion.component')
            .then(m => m.AdminProduccionComponent),
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('../pages/modulo-administrativo/admin-insumos/admin-insumos.component')
            .then(m => m.AdminInsumosComponent),
      }, */
    ],
  },

];
