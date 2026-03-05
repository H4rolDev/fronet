import { Component } from '@angular/core';
import { TortaService } from '../../../services/torta.service';
import { Torta } from '../../../models/torta';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TortaModalComponent } from './torta-modal/torta-modal.component';
import { TortaDeleteModalComponent } from './torta-delete-modal/torta-delete-modal.component';

@Component({
  selector: 'app-admin-tortas',
  templateUrl: './admin-tortas.component.html',
  styleUrl: './admin-tortas.component.css',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIf, TortaModalComponent, TortaDeleteModalComponent],
})
export class AdminTortasComponent {
tortas: Torta[] = [];
  loading = false;
  error = '';

  showModal = false;
  showDeleteModal = false;
  selectedTorta: Torta | null = null;
  tortaToDelete: Torta | null = null;

  searchTerm = '';
  filteredTortas: Torta[] = [];

  constructor(private tortaService: TortaService) {}

  ngOnInit(): void {
    this.cargarTortas();
  }

  cargarTortas(): void {
    this.loading = true;
    this.tortaService.obtenerCombo().subscribe({
      next: (combo) => {
        const requests = combo.map(c =>
          new Promise<Torta>((resolve, reject) => {
            this.tortaService.obtenerPorId(c.id).subscribe({ next: resolve, error: reject });
          })
        );
        Promise.all(requests)
          .then(tortas => {
            this.tortas = tortas;
            this.filteredTortas = tortas;
            this.loading = false;
          })
          .catch(() => {
            this.error = 'Error al cargar las tortas';
            this.loading = false;
          });
      },
      error: () => {
        this.error = 'Error al cargar las tortas';
        this.loading = false;
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    const t = term.toLowerCase();
    this.filteredTortas = this.tortas.filter(x =>
      x.nombre.toLowerCase().includes(t) ||
      x.descripcion?.toLowerCase().includes(t)
    );
  }

  openCreate(): void {
    this.selectedTorta = null;
    this.showModal = true;
  }

  openEdit(torta: Torta): void {
    this.selectedTorta = { ...torta };
    this.showModal = true;
  }

  openDelete(torta: Torta): void {
    this.tortaToDelete = torta;
    this.showDeleteModal = true;
  }

  onModalClose(): void {
    this.showModal = false;
    this.selectedTorta = null;
  }

  onModalSaved(): void {
    this.showModal = false;
    this.selectedTorta = null;
    this.cargarTortas();
  }

  onDeleteClose(): void {
    this.showDeleteModal = false;
    this.tortaToDelete = null;
  }

  onDeleteConfirmed(): void {
    this.showDeleteModal = false;
    this.tortaToDelete = null;
    this.cargarTortas();
  }

  getUsuario(): string {
    const raw = localStorage.getItem('user');
    if (!raw) return 'admin';
    return JSON.parse(raw)?.username ?? 'admin';
  }
}
