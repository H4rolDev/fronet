import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DeliveryConfiguration } from '../models/delivery-configuration';

const DEFAULT_CONFIGURATION: DeliveryConfiguration = {
  costoBase: 5,
  costoPorKilometro: 1.5,
  latitudCentro: -13.53195,
  longitudCentro: -71.96746,
  radioMaximoKm: 35,
  activo: true,
};

@Injectable({ providedIn: 'root' })
export class DeliveryConfigurationService {
  private readonly url = `${environment.apiUrl}/DeliveryConfiguration`;

  constructor(private http: HttpClient) {}

  getDefault(): DeliveryConfiguration { return { ...DEFAULT_CONFIGURATION }; }

  obtener(): Observable<DeliveryConfiguration> {
    return this.http.get<DeliveryConfiguration>(this.url, { headers: this.headers() });
  }

  actualizar(configuracion: DeliveryConfiguration): Observable<DeliveryConfiguration> {
    return this.http.put<DeliveryConfiguration>(this.url, configuracion, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const raw = localStorage.getItem('user');
    const token = raw ? JSON.parse(raw).token : null;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
