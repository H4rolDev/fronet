import { Component } from "@angular/core";
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { CommonModule } from "@angular/common";


@Component({
  standalone: true,
  selector: "widget-password",
  templateUrl: './form-password.html',
  imports: [CommonModule, ReactiveFormsModule]
})

export class PasswordComponent{
  //logica de negocio
  miFormulario: FormGroup;
  constructor(private forBuilder: FormBuilder) {
    this.miFormulario = this.forBuilder.group({
      contrasena:['', [Validators.required]],
      nuevacontrasena:['', [Validators.required]]
    })
  }
  get contrasena(){
    return this.miFormulario.get('contrasena');
  }
  get nuevacontrasena(){
    return this.miFormulario.get('nuevacontrasena');
  }
  onSubmit() {
    if(this.miFormulario.valid){
      alert('Contraseña guardada');
    }
    else{
      alert('Falta rellenar campos')
    }
  }
}
