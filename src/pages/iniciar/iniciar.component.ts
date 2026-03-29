import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
  loginForm: FormGroup;
  registerForm: FormGroup;
  isRegisterMode = false;
  message = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.redirectByRole(JSON.parse(user));
    }
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.message = '';
  }

  login() {
    // var ruta = '/admin/dashboard';
    // this.router.navigate(['/admin/dashboard']);
    // this.router.navigate([ruta]).then(() => {
    //   window.location.reload();
    // });
    if (this.loginForm.invalid) {
      this.message = 'Completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.message = '';
    const { username, password } = this.loginForm.value;

    this.auth.login(username, password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        localStorage.setItem('user', JSON.stringify(res));
        this.redirectByRole(res);
      },
      error: () => {
        this.isLoading = false;
        this.message = 'Credenciales inválidas o error de conexión';
      },
    });
  }

  redirectByRole(userData: any) {
    const roles: string[] = userData.roles ?? [];

    let ruta = '/cuenta';

    if (roles.includes('Administrador')) {
      ruta = '/admin/dashboard';
    } else if (roles.includes('Cliente')) {
      ruta = '/cuenta';
    }

    this.router.navigate([ruta]).then(() => {
      window.location.reload();
    });
  }

  register() {
    if (this.registerForm.invalid) {
      this.message = 'Completa todos los campos del registro';
      return;
    }

    this.isLoading = true;
    this.message = '';
    const { nombre, username, password } = this.registerForm.value;

    this.auth.register(nombre, username, password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.message = '✅ Registrado correctamente. Ahora inicia sesión.';
          this.isRegisterMode = false;
        } else {
          this.message = res.error || 'Error al registrar';
        }
      },
      error: () => {
        this.isLoading = false;
        this.message = 'Error en el registro';
      },
    });
  }
}
