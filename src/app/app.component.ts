import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import AOS from 'aos';
import 'aos/dist/aos.css';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'cakes';
  terminoBusqueda = '';
  searchFocused   = false;
  menuMobileOpen  = false;
  user: any       = null;
  dropdownOpen    = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    AOS.init({ duration: 1000, once: true });
  }

  // ✅ Solo busca al presionar Enter o clic en lupa — NO en cada tecla
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
