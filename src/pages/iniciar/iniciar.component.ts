import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';


@Component({
  standalone: true,
  selector: 'app-iniciar',
  templateUrl: './iniciar.component.html',
  styleUrls: ['./iniciar.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class IniciarComponent implements OnInit {
recoverPassword() {
throw new Error('Method not implemented.');
}
  loginForm: FormGroup;
  registerForm: FormGroup;
  isRegisterMode = false;
  message = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem('user')) {
      this.router.navigate(['/cuenta']);
    }
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.message = '';
  }

  login() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      this.auth.login(username, password).subscribe({
        next: (res: any) => {
          if (res) {
            localStorage.setItem('user', JSON.stringify(res.token));
            this.router.navigate(['/cuenta']);
          } else {
            this.message = res.error || 'Credenciales inválidas';
          }
        },
        error: () => {
          this.message = 'Error en conexión o credenciales inválidas';
        },
      });
    } else {
      this.message = 'Completa todos los campos del login';
    }
  }

  register() {
    if (this.registerForm.valid) {
      const { nombre, email, password } = this.registerForm.value;

      this.auth.register(nombre, email, password).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.message = '✅ Registrado correctamente. Ahora inicia sesión.';
            this.isRegisterMode = false;
          } else {
            this.message = res.error || 'Error al registrar';
          }
        },
        error: () => {
          this.message = 'Error en el registro';
        },
      });
    } else {
      this.message = 'Completa todos los campos del registro';
    }
  }
}
