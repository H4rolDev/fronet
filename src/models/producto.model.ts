// producto.model.ts
export class ProductoModel {
  id = 0;
  nombre = '';
  descripcion = '';
  precio = 0;
  categoria = '';
  imagen?: string;

  constructor(data: Partial<ProductoModel>) {
    Object.assign(this, data);
  }
}
