import { Component } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-registrarse",
  templateUrl: './registrarse.component.html',
  imports: [ReactiveFormsModule, CommonModule]
})

export class RegistrarseComponent{
  //logica de negocio
  miFormulario1: FormGroup;
  constructor(private forBuilder: FormBuilder) {
    this.miFormulario1 = this.forBuilder.group({
      nombres:['', [Validators.required]],
      apellidos:['', [Validators.required]],
      direccion:['', [Validators.required]],
      telefono:['', [Validators.required]],
      correo:['', [Validators.required]],
      contrasena:['', [Validators.required]]
    })
  }
  get nombres(){
    return this.miFormulario1.get('nombres');
  }
  get apellidos(){
    return this.miFormulario1.get('apellidos');
  }
  get direccion(){
    return this.miFormulario1.get('direccion');
  }
  get telefono(){
    return this.miFormulario1.get('telefono');
  }
  get correo(){
    return this.miFormulario1.get('correo');
  }
  get contrasena(){
    return this.miFormulario1.get('contrasena');
  }
}
