import { Component } from '@angular/core';
import { EditarPerfilComponent } from "../editar-perfil/editar-perfil.component";
import { CommonModule } from '@angular/common';


type UserField = 'nombre' | 'email' | 'celular' | 'direccion' | 'foto';

interface User {
  nombre: string;
  email: string;
  celular: string;
  direccion: string;
  foto: string | null;
}
@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  imports: [EditarPerfilComponent, CommonModule]
})

export class PerfilComponent {
  user: User = {
    nombre: 'María',
    email: 'maria@tortas.com',
    celular: '',
    direccion: '',
    foto: null
  };

  defaultFoto = 'https://i.pravatar.cc/150?u=default';

 editField: UserField | null = null;

  openEdit(campo: UserField) {
    this.editField = campo;
  }

  actualizarCampo(event: { campo: UserField, valor: any }) {
    this.user[event.campo] = event.valor;
    this.editField = null;
  }

  logout() {
    alert('Sesión cerrada');
    // lógica logout real
  }
getValorCampo(): any {
  if (this.editField) {
    return this.user[this.editField];
  }
  return null;
}

  verProductos() {
    alert('Navegar a productos');
  }

  verPedidos() {
    alert('Navegar a pedidos');
  }

  administrarCuenta() {
    alert('Navegar a administrar cuenta');
  }
}
