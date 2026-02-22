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
import { PersonalComponent } from '../widgets/form-personal/form-personal';
import { ListarpersonalComponent } from '../widgets/listar-personal/listar-personal';
import { PagoyapeComponent } from '../pages/pagoyape/pagoyape.component';
import { BienvenidaComponent } from '../bienvenida/bienvenida.component';
import { TortasespecialesComponent } from '../pages/tortasespeciales/tortasespeciales.component';
import { TortamatrimonioComponent } from '../pages/tortasmatrimonio/tortamatrimonio';

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

  // 🔥 CORREGIDO AQUÍ
  { path: 'pagoyape', component: PagoyapeComponent },

  { path: 'app-tortasespeciales', component: TortasespecialesComponent },
  { path: 'app-tortamatrimonio', component: TortamatrimonioComponent },

  { path: 'cuenta',
    loadComponent: () => import('../pages/cuenta/cuenta.component')
      .then(m => m.CuentaComponent)
  }

];
