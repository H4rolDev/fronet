import { Component, input, Input } from "@angular/core";
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ContabilidadService } from "../../services/contabilidad.service";
import { UsuarioService } from "../../services/usuario.service";

@Component({
  selector: "widget-pagar",
  templateUrl: './pagar.component.html',
  imports: [CommonModule, ReactiveFormsModule]
})

export class PagarComponent{
  [x: string]: any;
  //logica de negocio
  miFormulario: FormGroup;
  estadoPeticion: string = "nothing";

  //consumir el servicio
  constructor(private _usuarioService: UsuarioService, private forBuilder: FormBuilder, private contabilidadService: ContabilidadService) {
    this.miFormulario = this.forBuilder.group({
      tarjeta:['', [Validators.required, Validators.minLength(5)]],
      expiracion:['', [Validators.required, Validators.minLength(5)]],
      cvv:['', [Validators.required, Validators.maxLength(3)]],
      monto:['', [Validators.required]],
      nombre:['', [Validators.required]],
      direccion:['', [Validators.required]],
      telefono:['', [Validators.required]],
      correo:['', [Validators.required]],
      metodo:['', [Validators.required, Validators.minLength(5)]]
    })
  }
  get tarjeta(){
    return this.miFormulario.get('tarjeta');
  }
  get expiracion(){
    return this.miFormulario.get('expiracion');
  }
  get cvv(){
    return this.miFormulario.get('cvv');
  }
  get monto(){
    return this.miFormulario.get('monto');
  }
  get nombre(){
    return this.miFormulario.get('nombre');
  }
  get direccion(){
    return this.miFormulario.get('direccion');
  }
  get telefono(){
    return this.miFormulario.get('telefono');
  }
  get correo(){
    return this.miFormulario.get('correo');
  }
  get metodo(){
    return this.miFormulario.get('metodo');
  }
  get isSuccess(){
    return this.estadoPeticion === "success";
  }
  get isError(){
    return this.estadoPeticion === "error";
  }
  get isLoading(){
    return this.estadoPeticion === "loading";
  }

  onSubmit() {
    if(this.miFormulario.valid){
      this.estadoPeticion = "loading";
      console.log('formulario enviandose');
      console.log("valores: ", this.miFormulario.value);
      this.contabilidadService.registrarPago({
        'numero_tarjeta': this.miFormulario.value['tarjeta'],
        'expiracion': this.miFormulario.value['expiracion'],
        'cvv': this.miFormulario.value['cvv'],
        'monto': this.miFormulario.value['monto'],
        'nombre': this.miFormulario.value['nombre'],
        'direccion': this.miFormulario.value['direccion'],
        'telefono': this.miFormulario.value['telefono'],
        'correo': this.miFormulario.value['correo'],
        'metodo': this.miFormulario.value['metodo'],
      }).subscribe({
        next: (data) => {
          setTimeout(() => {
            this.estadoPeticion = "success";
          }, 2000);
        },
        error: (err) => {
          this.estadoPeticion = "error";
        }
      })
    }
    else{
      console.log('error en formulario');
      console.log("fields: ", this.miFormulario.get('tarjeta')?.errors);
    }
  }



  //logica de negocio

    ngOnInit(): void {
      console.log('ngmInit');
      this._usuarioService.generateToken().subscribe({
        next: (data:any) => {
          console.log('gg', data);
          localStorage.setItem("xangulary", data.token);
        },
        error: (err) => {

        }
      });
      }




}
