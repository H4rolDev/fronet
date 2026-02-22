// Importa HttpClient y NgForm
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {

  contacto = {
    nombre: '',
    email: '',
    mensaje: ''
  };
   mensajeConfirmacion: string = ''; // <-- Aquí guardaremos el mensaje para mostrar
  esError: boolean | undefined;
mensajeExito: any;
mensajeError: any;

  constructor(private http: HttpClient) {}

    enviarFormulario(form: NgForm) {
  if (form.invalid) {
    this.mensajeError = 'Por favor, completa todos los campos.';
    this.mensajeExito = '';
    return;
  }

  this.http.post('http://localhost/php/contacto.php', this.contacto).subscribe(
    (response: any) => {
      if (response.error) {
        this.mensajeError = 'Error: ' + response.error;
        this.mensajeExito = '';
      } else {
        this.mensajeExito = 'Gracias por contactarnos, tu mensaje ha sido recibido con éxito.';
        this.mensajeError = '';
        form.resetForm();
      }
    },
    (error) => {
      this.mensajeError = 'Error al enviar el mensaje, intenta nuevamente más tarde.';
      this.mensajeExito = '';
    }
  );
  }
}