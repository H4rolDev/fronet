import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: "app-tortamatrimonio",
templateUrl: './tortamatrimonio.html',

  imports: [CommonModule, RouterModule],
})
export class TortamatrimonioComponent {
  tortasMatrimonio = [
    {
      nombre: 'Torta Nupcial Clásica',
      descripcion: 'Torta de 3 pisos con fondant blanco y flores comestibles.',
      imagen: 'assets/img/torta-matrimonio-1.jpg',
      precio: 200
    },
    {
      nombre: 'Torta Elegancia de Oro',
      descripcion: 'Diseño minimalista con toques dorados y detalles florales.',
      imagen: 'assets/img/torta-matrimonio-2.jpg',
      precio: 250
    },
    {
      nombre: 'Torta Romántica Rosas',
      descripcion: 'Cubierta de crema, con rosas naturales y sabores a vainilla.',
      imagen: 'assets/img/torta-matrimonio-3.jpg',
      precio: 220
    },
    {

      id: 104,
      nombre: 'Torta Boho Chic',
      descripcion: 'Decoración rústica con flores silvestres y crema batida.',
      precio: 230,
      imagen: '/assets/img/torta-matrimonio-4.jpg'
    },
    // puedes añadir más si desea



  ];
}

