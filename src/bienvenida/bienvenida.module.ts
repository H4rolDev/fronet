import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BienvenidaComponent } from './bienvenida.component'; // ✅ verifica esta ruta

@NgModule({
  imports: [CommonModule, BienvenidaComponent],
  exports: [BienvenidaComponent]
})
export class BienvenidaModule {}
