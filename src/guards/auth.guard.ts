import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  /* const router = inject(Router);
  const raw = localStorage.getItem('user');

  if (!raw) {
    router.navigate(['/iniciar']);
    return false;
  }

  const user = JSON.parse(raw);
  const roles: string[] = user.roles ?? [];

  if (roles.includes('Administrador')) {
    return true;
  }

  // Cliente → mandarlo a su cuenta
  router.navigate(['/cuenta']);
  return false; */
  return true;
};

export const authGuard: CanActivateFn = () => {
  // const router = inject(Router);
  // const raw = localStorage.getItem('user');
/*
  if (!raw) {
    router.navigate(['/iniciar']);
    return false;
  } */

  return true;
};
