import { Component, input, Input } from "@angular/core";
import { PasswordComponent } from "../form-password/form-password";
import { PersonalComponent } from "../form-personal/form-personal";


@Component({
  selector: "widget-listarpersonal",
  templateUrl: './listar-personal.html',
  imports: [PasswordComponent, PersonalComponent]
})

export class ListarpersonalComponent{
  //logica de negocio

}
