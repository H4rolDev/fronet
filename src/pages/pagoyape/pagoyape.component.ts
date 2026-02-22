import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { CarritoService } from "../../services/carrito.service";
import { ProductoModel } from "../../models/producto.model";
import { Subscription } from "rxjs";

@Component({
  selector: "app-pagoyape",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./pagoyape.component.html",
  styleUrls: ["./pagoyape.component.css"]
})
export class PagoyapeComponent implements OnInit, OnDestroy {

  carrito: ProductoModel[] = [];
  total = 0;
  mensajeExito = '';
  private carritoSubscription!: Subscription;

  constructor(
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carritoSubscription = this.carritoService.carrito$.subscribe(productos => {
      this.carrito = productos;
      this.total = this.carritoService.obtenerTotal();
    });
  }

  confirmarPedido() {
    if (this.carrito.length === 0) return;

    this.carritoService.limpiarCarrito();
    this.mensajeExito = "¡Pedido confirmado correctamente! 🎉";

    setTimeout(() => {
      this.router.navigate(['/']);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }
}