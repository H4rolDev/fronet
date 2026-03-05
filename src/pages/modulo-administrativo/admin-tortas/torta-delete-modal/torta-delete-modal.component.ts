import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TortaService } from '../../../../services/torta.service';
import { Torta } from '../../../../models/torta';

@Component({
  standalone: true,
  selector: 'app-torta-delete-modal',
  templateUrl: './torta-delete-modal.component.html',
  styleUrls: ['./torta-delete-modal.component.css'],
  imports: [CommonModule],
})
export class TortaDeleteModalComponent {
  @Input() torta: Torta | null = null;
  @Input() usuario = 'admin';
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  loading = false;
  error = '';

  constructor(private tortaService: TortaService) {}

  confirm(): void {
    if (!this.torta) return;
    this.loading = true;
    this.error = '';

    this.tortaService.eliminar(this.torta.id, this.usuario).subscribe({
      next: () => {
        this.loading = false;
        this.deleted.emit();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error al eliminar la torta.';
      }
    });
  }

  close(): void {
    if (this.loading) return;
    this.closed.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
