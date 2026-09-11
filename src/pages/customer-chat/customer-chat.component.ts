import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerChatService } from '../../services/customer-chat.service';

@Component({ selector:'app-customer-chat', standalone:true, imports:[CommonModule, FormsModule, RouterModule], templateUrl:'./customer-chat.component.html', styleUrl:'./customer-chat.component.css' })
export class CustomerChatComponent {
  input = '';
  messages = [{ from: 'bot', text: 'Hola, soy Yani. Puedo ayudarte a elegir una torta del catálogo.' }];

  constructor(private chat: CustomerChatService) {}

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
      },
      error: () => this.messages.push({ from: 'bot', text: 'No pude consultar el catálogo local. Intenta nuevamente.' }),
    });
  }
}
