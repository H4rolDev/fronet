import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';  // Importa AuthService

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],  // módulos necesarios para la plantilla
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent {
  user: any = {};

  constructor(private auth: AuthService) {
    this.auth.user$.subscribe(u => {
      if (u) this.user = { ...u };
    });
  }

  guardarCambios() {
    // Asegúrate que AuthService tiene este método setUser
    this.auth.setUser(this.user);
    alert('Cambios guardados correctamente');
  }
}
