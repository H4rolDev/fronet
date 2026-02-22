// producto.model.ts
export class ProductoModel {
  id: number = 0;
  nombre: string = '';
  descripcion: string = '';
  precio: number = 0;
  categoria: string = '';
  imagen?: string;

  constructor(data: Partial<ProductoModel>) {
    Object.assign(this, data);
  }
}
