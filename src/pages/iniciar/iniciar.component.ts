import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-iniciar',
  templateUrl: './iniciar.component.html',
  styleUrls: ['./iniciar.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class IniciarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: [''],
      numeroDocumento: ['', Validators.required],
      idTipoDocumento: [1, Validators.required],
      telefono: [''],
      direccion: [''],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    } else if (roles.includes('Atencion')) {
      ruta = '/admin/dashboard';
    } else if (roles.includes('Produccion')) {
      ruta = '/admin/dashboard';
    } else if (roles.includes('Repartidor')) {
      ruta = '/admin/repartidor';
    } else if (roles.includes('Cliente')) {
      ruta = '/cuenta';
    }

    this.router.navigate([ruta]).then(() => {
      window.location.reload();
    });
  }

  register() {
    if (this.registerForm.invalid) {
      this.message = 'Completa todos los campos obligatorios';
      return;
    }

    const { confirmarPassword, ...data } = this.registerForm.value;
    
    if (data.password !== confirmarPassword) {
      this.message = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.message = '';

    this.auth.register(data).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.idUsuario) {
          this.message = '✅ Registrado correctamente. Iniciando sesión...';
          this.registerForm.reset({ idTipoDocumento: 1 });
          this.loginAfterRegister(data.username, data.password);
        } else {
          this.message = res.mensaje || res.error || 'Error al registrar';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err.error?.mensaje || 'Error en el registro';
      },
    });
  }

  private loginAfterRegister(username: string, password: string): void {
    this.auth.login(username, password).subscribe({
      next: (res: any) => {
        localStorage.setItem('user', JSON.stringify(res));
        this.redirectByRole(res);
      },
      error: () => {
        this.message = '✅ Registrado. Ahora inicia sesión.';
        this.isRegisterMode = false;
      }
    });
  }
}
