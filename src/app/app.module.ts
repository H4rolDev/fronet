import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from '../pages/home/home.component';
import { EditarPerfilComponent } from '../editar-perfil/editar-perfil.component';
import { PerfilComponent } from '../perfil/perfil.component';
import { ConfiguracionComponent } from '../pages/configuracion/configuracion.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    // aquí sólo componentes NO standalone
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ConfiguracionComponent,  // porque es standalone
    FormsModule
  ],
 
})
export class AppModule { }