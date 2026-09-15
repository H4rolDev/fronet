import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CustomerChatProduct {
  id: number;
  name: string;
  currentPrice: number | null;
  stockAvailable: number;
}

export interface CustomerChatResponse {
  message: string;
  intent: string;
  products: CustomerChatProduct[];
  hasCustomRequestOption?: boolean;
  addToCart?: { productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number };
}

@Injectable({ providedIn: 'root' })
export class CustomerChatService {
  constructor(private http: HttpClient) {}

  send(message: string): Observable<CustomerChatResponse> {
    return this.http.post<CustomerChatResponse>(`${environment.apiUrl}/Chat`, { message });
  }
}
