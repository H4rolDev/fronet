import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { UsuarioService } from "../../services/usuario.service";
import { CommonModule } from "@angular/common"; // 🔹 Necesario para *ngIf, *ngFor

@Component({
  selector: "app-pago",
  templateUrl: './pago.component.html',
  standalone: true,
  imports: [CommonModule] // 🔹 Importa CommonModule para directivas estructurales
})
export class PagoComponent implements OnInit {

  productoSeleccionado: any;

  productos = [
    {
      id: 12,
      nombre: 'Torta de Chocolate',
      descripcion: 'Torta sabor chocolate, relleno de fudge y mermelada de sauco. Cubierta con crema chantilly blanca. Decorada con virutas chocolate y cerezas.',
      imagen: '/torta.png',
      precio: 50,
      porciones: 12
    },
    {
      id: 13,
      nombre: 'Torta de Vainilla',
      descripcion: 'Torta esponjosa de vainilla, con relleno de fresa y crema pastelera. Decorada con frutas frescas.',
      imagen: '',
      precio: 45,
      porciones: 10
    },
    {
      id: 14,
      nombre: 'Torta de tres leches',
      descripcion: 'Torta con mousse de maracuyá, base de bizcochuelo y cubierta de merengue. Toques cítricos ideales para el verano.',
      imagen: 'assets/img/torta-maracuya.jpg',
      precio: 48,
      porciones: 10
    },
    {
      id: 15,
      nombre: 'Chisket de Maracuya',
      descripcion: 'Torta sabor maracuya, relleno de fudge y mermelada de sauco. Cubierta con crema chantilly blanca. Decorada con virutas chocolate y cerezas.',
      precio: 50,
      imagen:'chisket.jpg'
    },
    {
      id: 16,
      nombre: 'selva Negra',
      descripcion: 'Torta sabor selva negra,un postre exquisito y delicioso compuesto por capas de bizcocho de chocolate, crema batida y cerezas .',
      precio: 50,
      imagen:'selva.negra.jpg'
    },{
     id: 17,
     nombre: 'torta de piña',
     descripcion: 'Torta sabor piña, postre clásico y delicioso. Su glaseado de caramelo cubre jugosos trozos de piña.',
     precio: 50,
     imagen:'torta.piña.jpg'


    },

  ];

  constructor(
    private _usuarioService: UsuarioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('producto'));
    console.log("ID recibido desde URL:", id); // 🐞 Depuración

    this.productoSeleccionado = this.productos.find(p => p.id === id);
    console.log("Producto seleccionado:", this.productoSeleccionado); // 🐞 Verifica si encontró el producto

    if (!this.productoSeleccionado) {
      console.warn("⚠️ No se encontró un producto con ese ID.");
    }

    this._usuarioService.generateToken().subscribe({
      next: (data: any) => {
        localStorage.setItem("xangulary", data.token);
      },
      error: (err) => {
        console.error("Error al generar token:", err);
      }
    });
  }
}

