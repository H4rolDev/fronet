import { Component, OnInit, signal } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { VentaService } from "../../services/venta.service";
import { CarritoService } from "../../services/carrito.service";
import { environment } from "../../environments/environment";

const BASE = environment.apiUrl;

@Component({
  selector: "widget-pagar",
  templateUrl: './pagar.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class PagarComponent implements OnInit {
  miFormulario: FormGroup;
  estadoPeticion = "nothing";
  mensajeRespuesta = "";
  
  imagenPreview: string | null = null;
  imagenFile: File | null = null;
  imagenUrl: string | null = null;
  subiendoImagen = signal(false);
  numeroOperacion = "";

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private ventaService: VentaService,
    private carritoService: CarritoService,
    private sanitizer: DomSanitizer
  ) {
    this.miFormulario = this.fb.group({
      nombre: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      direccion: [''],
      metodoEntrega: ['1', [Validators.required]]
    });
  }

  get nombre() { return this.miFormulario.get('nombre'); }
  get telefono() { return this.miFormulario.get('telefono'); }
  get direccion() { return this.miFormulario.get('direccion'); }
  get metodoEntrega() { return this.miFormulario.get('metodoEntrega'); }
  
  get isSuccess() { return this.estadoPeticion === "success"; }
  get isError() { return this.estadoPeticion === "error"; }
  get isLoading() { return this.estadoPeticion === "loading"; }

  ngOnInit(): void {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar 5MB');
        return;
      }
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async subirImagen(): Promise<string | null> {
    if (!this.imagenFile) return null;
    
    this.subiendoImagen.set(true);
    
    const formData = new FormData();
    formData.append('file', this.imagenFile);
    formData.append('upload_preset', 'ml_default');
    
    try {
      const response: any = await this.http.post(
        'https://api.cloudinary.com/v1_1/dnqtkwvmr/image/upload',
        formData
      ).toPromise();
      
      this.subiendoImagen.set(false);
      return response.secure_url;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      this.subiendoImagen.set(false);
      return null;
    }
  }

  async onSubmit() {
    if (!this.nombre?.value || !this.telefono?.value) {
      alert('Por favor complete los datos de contacto');
      return;
    }

    if (!this.imagenFile || !this.numeroOperacion) {
      alert('Debe subir el comprobante de pago y el número de operación');
      return;
    }

    this.estadoPeticion = "loading";
    this.mensajeRespuesta = "";

    try {
      // 1. Subir imagen
      const imagenUrl = await this.subirImagen();
      if (!imagenUrl) {
        throw new Error('Error al subir la imagen del comprobante');
      }

      // 2. Obtener items del carrito
      const items = this.carritoService.obtenerCarrito();
      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // 3. Calcular total
      const total = items.reduce((sum: number, item: any) => sum + (item.precio * item.cantidad), 0);

      // 4. Datos de entrega
      const esDelivery = this.miFormulario.value.metodoEntrega === '2';
      
      // 5. Construir payload
      const idTipoEntrega: 1 | 2 = parseInt(this.miFormulario.value.metodoEntrega) as 1 | 2;
      const payload: any = {
        idPersona: 1,
        idTipoEntrega: idTipoEntrega,
        usuario: 'cliente',
        imagenComprobante: imagenUrl,
        numeroOperacion: this.numeroOperacion,
        detalles: items.map((item: any) => ({
          idTorta: item.id,
          cantidad: item.cantidad,
          precioBase: item.precio,
          precioPersonalizacion: 0
        })),
        pagos: [{
          idMetodoPago: 1, // Efectivo/Yape
          monto: total
        }],
        entrega: esDelivery ? {
          direccion: this.miFormulario.value.direccion || '',
          telefono: this.miFormulario.value.telefono,
          nombreContacto: this.miFormulario.value.nombre,
          costoDelivery: 10
        } : null
      };

      // 6. Enviar al backend
      this.ventaService.registrar(payload).subscribe({
        next: (idVenta: number) => {
          console.log('Venta creada con ID:', idVenta);
          this.estadoPeticion = "success";
          this.mensajeRespuesta = "¡Pago enviado! Tu comprobante está siendo validado. Te notificaremos cuando sea aprobado.";
          this.carritoService.limpiarCarrito();
        },
        error: (err: any) => {
          console.error('Error al registrar venta:', err);
          this.estadoPeticion = "error";
          this.mensajeRespuesta = err.message || 'Error al procesar el pago. Intenta de nuevo.';
        }
      });

    } catch (error: any) {
      console.error('Error:', error);
      this.estadoPeticion = "error";
      this.mensajeRespuesta = error.message || 'Error al procesar el pago';
    }
  }

  quitarImagen() {
    this.imagenFile = null;
    this.imagenPreview = null;
    this.imagenUrl = null;
  }

  triggerFileInput() {
    const input = document.getElementById('input-comprobante') as HTMLInputElement;
    if (input) input.click();
  }

  get isDelivery() {
    return this.miFormulario.get('metodoEntrega')?.value === '2';
  }
}