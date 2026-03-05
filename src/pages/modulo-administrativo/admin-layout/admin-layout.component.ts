import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIf],
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userName = '';
  userInitials = '';
  userRoles: string[] = [];
  currentPageTitle = 'Dashboard';
  currentDate = '';

  private pageTitles: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/tortas':    'Tortas',
    '/admin/recetas':   'Recetas de Tortas',
    '/admin/produccion':'Producción de Torta',
    '/admin/insumos':   'Insumos',
  };

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.setCurrentDate();
    this.trackRoute();
  }

  private loadUserData(): void {
   /*  const raw = localStorage.getItem('user');
    if (!raw) {
      this.router.navigate(['/iniciar']);
      return;
    }
    const user = JSON.parse(raw);
    this.userName   = user.username ?? 'Usuario';
    this.userRoles  = user.roles ?? [];
    const names     = (user.persona?.nombres ?? this.userName).split(' ');
    this.userInitials = names.length >= 2
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase(); */
  }

  private setCurrentDate(): void {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private trackRoute(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentPageTitle = this.pageTitles[e.urlAfterRedirects] ?? 'Admin';
      });

    // Set initial
    this.currentPageTitle = this.pageTitles[this.router.url] ?? 'Admin';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/iniciar']).then(() => window.location.reload());
  }
}
