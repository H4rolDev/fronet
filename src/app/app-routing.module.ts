import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from '../pages/home/home.component';
import { AboutComponent } from '../pages/about/about.component';
import { ContactComponent } from '../pages/contact/contact.component';
import { ProductsComponent } from '../pages/products/products.component';
import { CuentaComponent } from '../pages/cuenta/cuenta.component';
import { IniciarComponent } from '../pages/iniciar/iniciar.component'; // Aquí es "IniciarComponent"
import { AuthGuard } from '../guards/auth.guard';
import { ConfiguracionComponent } from '../pages/configuracion/configuracion.component';
import { PedidosComponent } from '../pages/pedidos/pedidos.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'iniciar', component: IniciarComponent },
  { path: 'cuenta', component: CuentaComponent },
   { path: 'configuracion', component: ConfiguracionComponent },
  { path: 'pedidos', component: PedidosComponent },
  
  //{ path: '', redirectTo: '/iniciar', pathMatch: 'full' }
  // puedes agregar más rutas si creas más componentes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
