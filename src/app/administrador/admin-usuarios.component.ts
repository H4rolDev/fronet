import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent {
  usuarios = [
    { id: 1, nombre: 'Juan Perez', estado: 'Activo' },
    { id: 2, nombre: 'Maria Lopez', estado: 'Inactivo' }
  ];
}


