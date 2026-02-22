// app/src/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
providedIn: 'root'
})
export class AuthGuard implements CanActivate {
constructor(private router: Router) {}

canActivate(): boolean {
const user = localStorage.getItem('user'); // verifica si hay sesión
if (!user) {
    this.router.navigate(['/iniciar']); // redirige si no hay usuario
    return false;
}
return true;
}
}
