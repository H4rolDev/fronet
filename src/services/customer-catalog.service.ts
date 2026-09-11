import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TortaService } from './torta.service';
import { TortaListadoDTO } from '../models/torta-dto';

export interface CustomerProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
  categoria: string;
  personalizable: boolean;
  tamanios: string[];
}

export interface CustomerOption {
  id: number;
  idTorta: number;
  tipo: 'sabor' | 'tamanio' | 'relleno' | 'color' | 'pisos';
  valor: string;
  precioExtra: number;
  maximo?: number | null;
  orden: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerCatalogService {
  constructor(private tortaService: TortaService) {}

  obtenerProductos(): Observable<CustomerProduct[]> {
    return this.tortaService.obtenerListado().pipe(map(items => items
      .filter(item => String(item.activo).toLowerCase() !== 'false')
      .map(item => this.mapear(item))));
  }

  obtenerOpciones(idTorta: number): Observable<CustomerOption[]> {
    return this.tortaService.obtenerOpciones(idTorta);
  }

  private mapear(item: TortaListadoDTO): CustomerProduct {
    return {
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion || 'Producto artesanal Tortas Yani.',
      precio: Number(item.precioVenta || 0),
      stock: Number(item.stockDisponible || 0),
      imagen: item.imagenUrl || '/assets/logotienda.png',
      categoria: item.nombreCategoriaTorta || 'Tortas',
      personalizable: item.esPersonalizable !== false,
      tamanios: item.cantidades ? item.cantidades.split(',').map(x => x.trim()).filter(Boolean) : ['Mediana']
    };
  }
}
