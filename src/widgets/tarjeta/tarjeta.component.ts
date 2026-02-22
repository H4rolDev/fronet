import { Component, input, Input } from "@angular/core";
import { ProductoModel } from "../../models/producto.model";
//import { PagarComponent } from "../../widgets/pagar/pagar.component";



@Component({
selector: "widget-tarjeta",
templateUrl: './tarjeta.component.html',
styleUrl: './tarjeta.component.css',
imports: []
})

export class TarjetaComponent{
//logica de negocio
@Input() producto: ProductoModel = new ProductoModel({});


texto: string = 'comprar';
fondo: string = 'btn primary'
comprar() {
  this.texto = 'pagar';
  this.fondo = 'btn btn-success';
}

  //
  onSubmit() {
  //get id(){
  this.producto.nombre
    console.log();
  //}
  }
}
