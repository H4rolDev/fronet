import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TortaService } from '../../../../services/torta.service';
import { Torta, TortaForm } from '../../../../models/torta';

@Component({
  standalone: true,
  selector: 'app-torta-modal',
  templateUrl: './torta-modal.component.html',
  styleUrls: ['./torta-modal.component.css'],
  imports: [CommonModule, FormsModule],
})
export class TortaModalComponent implements OnInit, OnChanges {
  @Input() torta: Torta | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isEdit = false;
  loading = false;
  error = '';
  success = '';

  form: TortaForm = this.emptyForm();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  imageError = '';

  readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(private tortaService: TortaService) {}

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(): void {
    this.init();
  }

  private init(): void {
    this.error = '';
    this.success = '';
    this.imageError = '';
    this.selectedFile = null;

    if (this.torta) {
      this.isEdit = true;
      this.form = {
        id: this.torta.id,
        nombre: this.torta.nombre,
        descripcion: this.torta.descripcion ?? '',
        precioVenta: this.torta.precioVenta,
        stockDisponible: this.torta.stockDisponible,
        imagenUrl: this.torta.imagenUrl ?? '',
        imagenPublicId: this.torta.imagenPublicId ?? '',
        estado: this.torta.estado,
        usuarioCreacion: this.torta.usuarioCreacion,
        usuarioModificacion: this.getUsuario(),
        fechaCreacion: this.torta.fechaCreacion ?? new Date().toISOString(),
        fechaModificacion: new Date().toISOString(),
      };
      this.previewUrl = this.torta.imagenUrl || null;
    } else {
      this.isEdit = false;
      this.form = this.emptyForm();
      this.previewUrl = null;
    }
  }

  private emptyForm(): TortaForm {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      precioVenta: null,
      stockDisponible: null,
      imagenUrl: '',
      imagenPublicId: '',
      estado: true,
      usuarioCreacion: this.getUsuario(),
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
  }

  getUsuario(): string {
    const raw = localStorage.getItem('user');
    if (!raw) return 'admin';
    return JSON.parse(raw)?.username ?? 'admin';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageError = '';
    if (!file) return;

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.imageError = 'Formato no permitido. Use JPG, PNG o WEBP.';
      input.value = '';
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.imageError = 'El archivo supera los 5 MB permitidos.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.form.imagenUrl = '';
    this.form.imagenPublicId = '';
    this.imageError = '';
  }

  validateForm(): boolean {
    if (!this.form.nombre?.trim()) {
      this.error = 'El nombre es obligatorio.'; return false;
    }
    if (this.form.nombre.trim().length < 3) {
      this.error = 'El nombre debe tener al menos 3 caracteres.'; return false;
    }
    if (this.form.precioVenta === null || this.form.precioVenta === undefined) {
      this.error = 'El precio de venta es obligatorio.'; return false;
    }
    if (this.form.precioVenta <= 0) {
      this.error = 'El precio de venta debe ser mayor a 0.'; return false;
    }
    if (this.form.stockDisponible === null || this.form.stockDisponible === undefined) {
      this.error = 'El stock disponible es obligatorio.'; return false;
    }
    if (this.form.stockDisponible < 0) {
      this.error = 'El stock no puede ser negativo.'; return false;
    }
    return true;
  }

  submit(ngForm: NgForm): void {
    this.error = '';
    this.success = '';
    if (!this.validateForm()) return;
    this.loading = true;
    this.isEdit ? this.doUpdate() : this.doCreate();
  }

  private buildFormData(): FormData {
    const fd = new FormData();
    fd.append('id', String(this.form.id));
    fd.append('nombre', this.form.nombre.trim());
    fd.append('descripcion', this.form.descripcion?.trim() ?? '');
    fd.append('precioVenta', String(this.form.precioVenta));
    fd.append('stockDisponible', String(this.form.stockDisponible));
    fd.append('estado', String(this.form.estado));
    fd.append('usuarioCreacion', this.form.usuarioCreacion);
    fd.append('usuarioModificacion', this.getUsuario());
    fd.append('fechaCreacion', this.form.fechaCreacion);
    fd.append('fechaModificacion', new Date().toISOString());
    // Conservar imagen existente si no se seleccionó una nueva
    if (this.form.imagenUrl) fd.append('imagenUrl', this.form.imagenUrl);
    if (this.form.imagenPublicId) fd.append('imagenPublicId', this.form.imagenPublicId);
    // Imagen nueva si la hay
    if (this.selectedFile) {
      fd.append('imagen', this.selectedFile, this.selectedFile.name);
    }
    return fd;
  }

  private doCreate(): void {
    const fd = new FormData();
    fd.append('nombre', this.form.nombre.trim());
    fd.append('descripcion', this.form.descripcion?.trim() ?? '');
    fd.append('precioVenta', String(this.form.precioVenta));
    fd.append('stockDisponible', String(this.form.stockDisponible));
    fd.append('estado', String(this.form.estado));
    fd.append('usuarioCreacion', this.form.usuarioCreacion);
    if (this.selectedFile) {
      fd.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    this.tortaService.insertarConImagen(fd).subscribe({
      next: () => {
        this.loading = false;
        this.success = '¡Torta creada exitosamente!';
        setTimeout(() => this.saved.emit(), 900);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error al crear la torta.';
      }
    });
  }

  private doUpdate(): void {
    // Usamos ModificarConImagen que acepta [FromForm] + IFormFile opcional
    const fd = this.buildFormData();

    this.tortaService.modificarConImagen(fd).subscribe({
      next: () => {
        this.loading = false;
        this.success = '¡Torta actualizada correctamente!';
        setTimeout(() => this.saved.emit(), 900);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error al actualizar la torta.';
      }
    });
  }

  close(): void { this.closed.emit(); }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
