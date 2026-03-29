import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header-client',
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
  templateUrl: './header-client.component.html',
  styleUrl: './header-client.component.css',
  standalone: true,
})
export class HeaderClientComponent {

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
    // Aos.init({ duration: 1000, once: true });
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

  isLoggedIn(): boolean { return !!this.user; }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  logout() {
    this.auth.logout();
    this.dropdownOpen  = false;
    this.menuMobileOpen = false;
    this.router.navigate(['/iniciar']);
  }
}
