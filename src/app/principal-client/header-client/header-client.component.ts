import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService, PersonaInfo } from '../../../services/auth.service';

@Component({
  selector: 'app-header-client',
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
  templateUrl: './header-client.component.html',
  styleUrl: './header-client.component.css',
  standalone: true,
})
export class HeaderClientComponent implements OnInit {

  title = 'cakes';
  terminoBusqueda = '';
  searchFocused   = false;
  menuMobileOpen  = false;
  user: any       = null;
  dropdownOpen    = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
  }

  ejecutarBusqueda() {
    const termino = this.terminoBusqueda.trim();
    if (!termino) return;
    this.router.navigate(['/products'], { queryParams: { search: termino } });
  }

  onKeyEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') this.ejecutarBusqueda();
  }

  toggleMenu() {
    this.menuMobileOpen = !this.menuMobileOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const t = event.target as HTMLElement;
    if (!t.closest('.user-menu'))    this.dropdownOpen   = false;
    if (!t.closest('.mobile-nav') && !t.closest('.hamburger')) this.menuMobileOpen = false;
  }

  isLoggedIn(): boolean { 
    this.user = this.auth.getUser();
    return !!this.user; 
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  logout() {
    this.auth.logout();
    this.dropdownOpen  = false;
    this.menuMobileOpen = false;
    this.router.navigate(['/iniciar']);
  }

  get userName(): string {
    const persona = this.user?.persona;
    if (persona?.nombres) {
      return persona.nombres;
    }
    return this.user?.username || 'Mi cuenta';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }
}
