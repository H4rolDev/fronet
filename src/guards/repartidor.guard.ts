import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const repartidorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    router.navigate(['/iniciar']);
    return false;
  }

  const user = JSON.parse(userStr);
  const roles = user.roles || [];

  const tieneRolRepartidor = roles.some((rol: string) => {
    const rolLower = rol.toLowerCase().trim();
    return rolLower === 'repartidor' || rolLower === 'Repartidor';
  });

  if (!tieneRolRepartidor) {
    router.navigate(['/iniciar']);
    return false;
  }

  return true;
};