import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.css']
})
export class EditarPerfilComponent {
  @Input() campo: 'nombre' | 'email' | 'celular' | 'direccion' | 'foto' = 'nombre';
  @Input() valor: any = '';
  @Output() guardar = new EventEmitter<{ campo: 'nombre' | 'email' | 'celular' | 'direccion' | 'foto', valor: any }>();
  @Output() cerrar = new EventEmitter<void>();

  nuevoValor: any = '';

  ngOnInit() {
    this.nuevoValor = this.valor;
  }

  guardarCambios() {
    this.guardar.emit({ campo: this.campo, valor: this.nuevoValor });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
