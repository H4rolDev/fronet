import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../environments/environment';

const API_URL = environment.apiUrl;

let ultimaValidacion: { [key: string]: number } = {};
const INTERVALO_VALIDACION_MS = 60 * 60 * 1000; // 1 hora

function obtenerHeaders(): HttpHeaders {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      return new HttpHeaders({ Authorization: `Bearer ${user.token}` });
    }
  }
  return new HttpHeaders();
}

async function validarToken(): Promise<{ valido: boolean; mensaje?: string }> {
  const http = inject(HttpClient);
  const router = inject(Router);
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    return { valido: false, mensaje: 'No hay sesión activa' };
  }

  const user = JSON.parse(userStr);
  const key = `admin_${user.username}`;

  // Verificar si ya validamos recientemente (cada 1 hora)
  const ahora = Date.now();
  const ultima = ultimaValidacion[key] || 0;
  
  // Si passed menos de 1 hora y ya tenemos datos válidos en memoria, permitir
  if (ahora - ultima < INTERVALO_VALIDACION_MS && user.tokenValido) {
    return { valido: true };
  }

  try {
    const response = await fetch(`${API_URL}/Auth/ValidarToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valido) {
        // Actualizar última validación y marcar como válido
        ultimaValidacion[key] = ahora;
        
        // Actualizar el usuario con la info más reciente
        user.tokenValido = true;
        localStorage.setItem('user', JSON.stringify(user));
        
        return { valido: true };
      }
    }

    // Token inválido - limpiar sesión
    localStorage.removeItem('user');
    return { valido: false, mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' };
  } catch (error) {
    // Si hay error de conexión, permitir acceso si ya tenía sesión previa
    console.error('Error validando token:', error);
    
    // En caso de error de red, permitir si tiene datos de usuario
    if (user && user.idUsuario && user.username) {
      return { valido: true };
    }
    
    return { valido: false, mensaje: 'Error de conexión. No se pudo validar la sesión.' };
  }
}

export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const raw = localStorage.getItem('user');

  if (!raw) {
    router.navigate(['/iniciar']);
    return false;
  }

  const user = JSON.parse(raw);
  const roles: string[] = user.roles ?? [];
  const url = state?.url || '';

  // Verificar si tiene rol que permite acceso al admin
  const adminRoles = ['administrador', 'atencion', 'produccion'];
  const tieneAccesoAdmin = roles.some(r => adminRoles.includes(r.toLowerCase().trim()));

  if (!tieneAccesoAdmin) {
    // Repartidor solo puede acceder a /admin/repartidor
    if (roles.some(r => r.toLowerCase().trim() === 'repartidor')) {
      if (url === '/admin/repartidor' || url.startsWith('/admin/repartidor')) {
        return true;
      }
      router.navigate(['/admin/repartidor']);
      return false;
    }
    // Otros roles van a cuenta
    router.navigate(['/cuenta']);
    return false;
  }

  // Validar token contra backend
  const resultado = await validarToken();
  
  if (!resultado.valido) {
    // Mostrar alerta y redirigir a login
    alert(resultado.mensaje || 'Sesión inválida');
    router.navigate(['/iniciar']);
    return false;
  }

  return true;
};

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const raw = localStorage.getItem('user');

  if (!raw) {
    router.navigate(['/iniciar']);
    return false;
  }

  return true;
};

export const repartidorGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const raw = localStorage.getItem('user');

  if (!raw) {
    router.navigate(['/iniciar']);
    return false;
  }

  const user = JSON.parse(raw);
  const roles = user.roles || [];

  const tieneRolRepartidor = roles.some((rol: string) => {
    const rolLower = rol.toLowerCase().trim();
    return rolLower === 'repartidor';
  });

  if (!tieneRolRepartidor) {
    router.navigate(['/iniciar']);
    return false;
  }

  // Validar token del repartidor
  const resultado = await validarToken();
  
  if (!resultado.valido) {
    alert(resultado.mensaje || 'Sesión expirada');
    router.navigate(['/iniciar']);
    return false;
  }

  return true;
};