import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-reportes',
  templateUrl: './admin-reportes.component.html',
  styleUrls: ['./admin-reportes.component.css']
})
export class AdminReportesComponent {
  ventasPorMes = [
    { mes: 'Enero', total: 500 },
    { mes: 'Febrero', total: 700 },
    { mes: 'Marzo', total: 900 },
  ];

  productosTop = [
    { nombre: 'Torta de Chocolate', vendidos: 25 },
    { nombre: 'Torta de Vainilla', vendidos: 18 },
    { nombre: 'Chisket de Maracuyá', vendidos: 12 },
  ];
}

