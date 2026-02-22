
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.css'],
  imports: [CommonModule]
})
export class BienvenidaComponent {
productos = [
  {
    nombre: 'Torta de Chocolate',
    imagen: 'assets/choco.jpg',
    descripcion: 'Una deliciosa torta elaborada con cacao premium, suave y húmeda, perfecta para celebraciones o simplemente para consentirte. Su cobertura de ganache realza aún más su sabor intenso y profundo.'
  },
  {
    nombre: 'Torta de Fresa',
    imagen: 'assets/fresa.jpg',
    descripcion: 'El equilibrio ideal entre lo dulce y lo frutal. Rellena con crema batida y mermelada artesanal de fresas frescas. Perfecta para momentos especiales o una tarde dulce.'
  },
  {
    nombre: 'Torta de Vainilla',
    imagen: 'assets/vainilla.jpg',
    descripcion: 'Una receta clásica con esencia natural de vainilla y textura suave, acompañada de una ligera capa de crema pastelera que despierta recuerdos de infancia con cada bocado.'
  },
  {
    nombre: 'Torta Red Velvet',
    imagen: 'assets/velvet.jpg',
    descripcion: 'Suave, elegante y con un toque de cacao, esta torta se distingue por su color rojo profundo y su relleno de crema de queso que le da ese contraste perfecto.'
  },
  {
    nombre: 'Torta de Moca',
    imagen: 'assets/moca.jpg',
    descripcion: 'Una mezcla sofisticada de café y chocolate, ideal para los amantes de los sabores intensos. Con mousse de moca y una cobertura espolvoreada de cacao, cada porción es irresistible.'
  },
  {
    nombre: 'Torta de Leche',
    imagen: 'assets/torta-leche.jpg',
    descripcion: 'Inspirada en la clásica torta tres leches, esta versión casera es jugosa, dulce y está decorada con merengue dorado. Un postre tradicional que nunca pasa de moda.'
  }
];



  verProducts(): void {
    const seccion = document.getElementById('productos');
    if (seccion) {
      seccion.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
