import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerChatService } from '../../services/customer-chat.service';
import { Router } from '@angular/router';

@Component({ selector:'app-customer-chat', standalone:true, imports:[CommonModule, FormsModule, RouterModule], templateUrl:'./customer-chat.component.html', styleUrl:'./customer-chat.component.css' })
export class CustomerChatComponent {
  input = '';
  messages: Array<{ from: string; text: string; action?: boolean }> = [{ from: 'bot', text: 'Hola, soy Yani. Puedo ayudarte a elegir una torta del catálogo.' }];

  constructor(private chat: CustomerChatService, private router: Router) {}

  send(): void {
    const text = this.input.trim();
    if (!text) return;
    this.messages.push({ from: 'user', text });
    this.input = '';
    this.chat.send(text).subscribe({
      next: response => {
        const products = response.products?.length
          ? `\n\n${response.products.map(product => `• ${product.name}: S/ ${(product.currentPrice ?? 0).toFixed(2)} (${product.stockAvailable} disponibles)`).join('\n')}`
          : '';
        this.messages.push({ from: 'bot', text: `${response.message}${products}` });
        if (response.hasCustomRequestOption) this.messages.push({ from: 'bot', text: 'Si tu idea no aparece en el catálogo, puedes enviarnos el diseño para que lo revisemos y te coticemos.', action: true });
      },
      error: () => this.messages.push({ from: 'bot', text: 'No pude consultar el catálogo local. Intenta nuevamente.' }),
    });
  }

  openCustomRequest(): void { this.router.navigate(['/personalizado']); }
}
