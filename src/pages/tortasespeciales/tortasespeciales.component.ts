import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TarjetaComponent } from "../../widgets/tarjeta/tarjeta.component";
import { ProductoModel } from "../../models/producto.model";
import { ProductoService } from "../../services/producto.service";

@Component({
  selector: "app-tortasespeciales",
  templateUrl: './tortasespeciales.component.html',
  styleUrls: ['./tortasespeciales.component.css'], // para los estilos personalizados
  standalone: true,
  imports: [CommonModule,TarjetaComponent]
})

export class TortasespecialesComponent{
  myproducto: ProductoModel;
  segundoprod: ProductoModel;
  tercerprod: ProductoModel;
  cuartoprod: ProductoModel;
  quintoprod: ProductoModel;
  sextoprod: ProductoModel;

  constructor(_productoServise: ProductoService) {
    this.myproducto = new ProductoModel({
      'id': 12,
      'nombre': 'Torta de Chocolate',
      'descripcion': 'Torta sabor chocolate, relleno de fudge y mermelada de sauco. Cubierta con crema chantilly blanca. Decorada con virutas chocolate y cerezas.',
      'precio': 50,
      'imagen':'/torta.png'
    });
    this.segundoprod = new ProductoModel({
      id: 13,
      nombre: 'Torta Trufada Deluxe',
      descripcion: 'Capa doble de trufa con base de bizcocho de cacao puro. Decoración elegante con láminas de oro comestible.',
      precio: 70,
      imagen: 'trufada-deluxe.jpg'
    });

     this.tercerprod = new ProductoModel({
      id: 14,
      nombre: 'Torta de Frambuesa & Queso',
      descripcion: 'Suave torta de queso con cobertura de frambuesas naturales y base de galleta de mantequilla.',
      precio: 65,
      imagen: 'frambuesa-queso.jpg'
    });

    this.cuartoprod = new ProductoModel({
      id: 15,
      nombre: 'Torta Tres Leches Tropical',
      descripcion: 'Versión tropical de la clásica torta, infusionada con maracuyá y mango, decorada con frutas frescas.',
      precio: 60,
      imagen: 'tresleches-tropical.jpg'
    });

    this.quintoprod = new ProductoModel({
      id: 16,
      nombre: 'Torta Oreo Explosiva',
      descripcion: 'Bizcocho de chocolate con crema de Oreo, decorada con mini Oreos, fudge y galleta molida.',
      precio: 62,
      imagen: 'oreo-explosiva.jpg'
    });

    this.sextoprod = new ProductoModel({
      id: 17,
      nombre: 'Torta de Caramelo y Nuez',
      descripcion: 'Torta suave con capas de caramelo salado y crocante de nueces. Una delicia otoñal.',
      precio: 68,
      imagen: 'caramelo-nuez.jpg'
    });

  }
}
  //logica de negocio
