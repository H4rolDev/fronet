import { Component } from "@angular/core";
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  selector: "widget-personal",
  templateUrl: './form-personal.html',
  imports: [CommonModule, ReactiveFormsModule]
})

export class PersonalComponent{
  //logica de negocio
  miFormulario: FormGroup;
  constructor(private forBuilder: FormBuilder) {
    this.miFormulario = this.forBuilder.group({
      nombre:['', [Validators.required]],
      apellido:['', [Validators.required]],
      direccion:['', [Validators.required]]
    })
  }
  get nombre(){
    return this.miFormulario.get('nombre');
  }
  get apellido(){
    return this.miFormulario.get('apellido');
  }
  get direccion(){
    return this.miFormulario.get('direccion');
  }
  onSubmit() {
    if(this.miFormulario.valid){
      alert('Usuario guardado');
    }
    else{
      alert('Falta rellenar campos')
    }
  }
}
