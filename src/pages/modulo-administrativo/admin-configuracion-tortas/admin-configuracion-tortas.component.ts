import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TortaListadoDTO } from '../../../models/torta-dto';
import { ProductoService } from '../../../services/producto.service';
import { TortaOpcionesService, TortaOpcion } from '../../../services/torta-opciones.service';

type OptionType = TortaOpcion['tipo'];

@Component({
  selector: 'app-admin-configuracion-tortas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-configuracion-tortas.component.html',
  styleUrls: ['./admin-configuracion-tortas.component.css']
})
export class AdminConfiguracionTortasComponent implements OnInit {
  tortas = signal<TortaListadoDTO[]>([]);
  opciones = signal<TortaOpcion[]>([]);
  seleccionada = signal<TortaListadoDTO | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  editandoId = 0;
  editorVisible = signal(false);
  tipos: { value: OptionType; label: string }[] = [
    { value: 'sabor', label: 'Sabor del bizcocho' }, { value: 'tamanio', label: 'Tamaño' },
    { value: 'porciones', label: 'Porciones' }, { value: 'relleno', label: 'Relleno' },
    { value: 'pisos', label: 'Pisos' }, { value: 'cobertura', label: 'Cobertura' },
    { value: 'color', label: 'Color' }, { value: 'decoracion', label: 'Decoración' },
    { value: 'evento', label: 'Celebración' }
  ];
  draft: Partial<TortaOpcion> = this.blank();

  constructor(private products: ProductoService, private options: TortaOpcionesService) {}

  ngOnInit(): void {
    this.cargando.set(true);
    this.products.traerProductos().subscribe({
      next: items => { this.tortas.set(items as TortaListadoDTO[]); this.cargando.set(false); if (items[0]) this.select(items[0]); },
      error: () => { this.error.set('No se pudo cargar el catálogo de tortas.'); this.cargando.set(false); }
    });
  }

  select(torta: TortaListadoDTO): void {
    this.seleccionada.set(torta);
    this.editandoId = 0;
    this.editorVisible.set(false);
    this.draft = this.blank();
    this.error.set('');
    this.options.obtenerAdmin(torta.id).subscribe({ next: items => this.opciones.set(items), error: () => this.error.set('No se pudieron cargar las opciones. Verifica tu sesión de administrador.') });
  }

  nuevo(): void { this.editandoId = 0; this.draft = this.blank(); this.mensaje.set(''); this.error.set(''); this.editorVisible.set(true); }

  editar(option: TortaOpcion): void {
    this.editandoId = option.id;
    this.draft = { ...option, modoPrecio: option.modoPrecio || 'fijo' };
    this.mensaje.set(''); this.error.set(''); this.editorVisible.set(true);
  }

  guardar(): void {
    const cake = this.seleccionada();
    const value = String(this.draft.valor || '').trim();
    if (!cake || !value) { this.error.set('Selecciona una torta y escribe el valor de la opción.'); return; }
    this.guardando.set(true);
    const payload: TortaOpcion = {
      id: this.editandoId, idTorta: cake.id, tipo: (this.draft.tipo || 'sabor') as OptionType,
      valor: value, precioExtra: Number(this.draft.precioExtra || 0),
      modoPrecio: this.draft.modoPrecio === 'incremental' ? 'incremental' : 'fijo',
      precioPorUnidad: Number(this.draft.precioPorUnidad || 0), obligatorio: Boolean(this.draft.obligatorio),
      minimo: this.draft.minimo == null ? null : Number(this.draft.minimo), maximo: this.draft.maximo == null ? null : Number(this.draft.maximo),
      activo: this.draft.activo !== false, orden: Number(this.draft.orden || this.opciones().length)
    };
    this.options.guardar(payload).subscribe({
      next: option => {
        this.opciones.update(items => this.editandoId ? items.map(item => item.id === option.id ? option : item) : [...items, option]);
        this.mensaje.set('Configuración guardada. El cliente verá estos cambios inmediatamente.'); this.editandoId = 0; this.draft = this.blank(); this.guardando.set(false);
      }, error: () => { this.error.set('No se pudo guardar la configuración.'); this.guardando.set(false); }
    });
  }

  toggle(option: TortaOpcion): void {
    this.options.cambiarActivo(option.id, !option.activo).subscribe({
      next: updated => { this.opciones.update(items => items.map(item => item.id === updated.id ? updated : item)); this.mensaje.set(updated.activo ? 'Opción visible para el cliente.' : 'Opción ocultada para el cliente.'); },
      error: () => this.error.set('No se pudo cambiar la visibilidad. Verifica que tu sesión siga activa.')
    });
  }
  eliminar(option: TortaOpcion): void {
    if (!confirm(`¿Eliminar ${option.valor}?`)) return;
    this.options.eliminar(option.id).subscribe({
      next: () => { this.opciones.update(items => items.filter(item => item.id !== option.id)); this.mensaje.set('Opción eliminada correctamente.'); },
      error: () => this.error.set('No se pudo eliminar la opción. Verifica que tu sesión siga activa.')
    });
  }
  tipoLabel(type: string): string { return this.tipos.find(item => item.value === type)?.label || type; }
  private blank(): Partial<TortaOpcion> { return { tipo: 'sabor', valor: '', precioExtra: 0, precioPorUnidad: 0, modoPrecio: 'fijo', obligatorio: false, minimo: null, maximo: null, activo: true, orden: 0 }; }
}
