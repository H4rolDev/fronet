import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TipoMovimientoDetalleDTO, TipoMovimientoListadoDTO, TipoMovimientoRequestDTO } from '../models/tipo-movimiento-dto';
import { environment } from '../environments/environment';

const BASE_URL = `${environment.apiUrl}/TipoMovimiento`;
const USUARIO_ACTUAL = 'admin';

@Injectable({
  providedIn: 'root'
})
export class TipoMovimientoService {
constructor(private http: HttpClient) {}

  /**
   * Retorna todos los registros de unidades de medida.
   * El componente de listado llama este método al inicializarse
   * y después de cada operación exitosa (crear / editar / eliminar).
   */
  obtenerListado(): Observable<TipoMovimientoListadoDTO[]> {
    return this.http.get<TipoMovimientoListadoDTO[]>(`${BASE_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Obtiene el detalle completo de una unidad de medida por su ID.
   * Se llama cuando el usuario hace clic en "Editar" antes de abrir el modal.
   *
   * @param id - ID de la unidad de medida a consultar
   */
  obtenerPorId(id: number): Observable<TipoMovimientoDetalleDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<TipoMovimientoDetalleDTO>(`${BASE_URL}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.manejarError));
  }

  /**
   * Crea una nueva unidad de medida.
   * El campo `id` debe ser 0 para que el backend lo trate como INSERT.
   *
   * @param datos - Nombre y abreviatura ingresados en el formulario
   */
  insertar(datos: { nombre: string}): Observable<any> {
    const payload: TipoMovimientoRequestDTO = {
      id: 0,
      activo: true,
      nombre: datos.nombre.trim(),
      usuarioCreacion: USUARIO_ACTUAL,
      usuarioModificacion: USUARIO_ACTUAL,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };

    return this.http
      .post<any>(`${BASE_URL}/Insertar`, payload)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Actualiza una unidad de medida existente.
   * Requiere el ID del registro y los datos actualizados.
   *
   * @param id         - ID del registro existente
   * @param datos      - Campos actualizados desde el formulario
   * @param detalle    - Datos originales del registro (para preservar fechaCreacion, etc.)
   */
  modificar(
    id: number,
    datos: { nombre: string},
    detalle: TipoMovimientoDetalleDTO
  ): Observable<any> {
    const payload: TipoMovimientoRequestDTO = {
      id,
      activo: detalle.activo,
      nombre: datos.nombre.trim(),
      usuarioCreacion: detalle.usuarioCreacion,
      usuarioModificacion: USUARIO_ACTUAL,
      fechaCreacion: detalle.fechaCreacion,
      fechaModificacion: new Date().toISOString(),
    };

    return this.http
      .put<any>(`${BASE_URL}/Modificar`, payload)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Elimina una unidad de medida por su ID.
   * El usuario se envía como query param según el contrato de la API.
   *
   * @param id - ID de la unidad de medida a eliminar
   */
  eliminar(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString()).set('usuario', USUARIO_ACTUAL);

    return this.http.delete<any>(`${BASE_URL}/Eliminar`, { params })
      .pipe(catchError(this.manejarError));
  }

  /**
   * Transforma errores HTTP en mensajes legibles para el componente.
   * El componente solo recibe un string; nunca manipula HttpErrorResponse.
   *
   * Uso: .pipe(catchError(this.manejarError))
   *
   * @param error - HttpErrorResponse de Angular HttpClient
   */
  private manejarError(error: any): Observable<never> {
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.';

    if (error.status === 0) {
      mensaje = 'No se puede conectar al servidor. Verifica tu conexión.';
    } else if (error.status === 400) {
      // El backend puede enviar un mensaje en error.error.message o error.error
      mensaje = error.error?.message ?? error.error ?? 'Datos inválidos.';
    } else if (error.status === 404) {
      mensaje = 'El recurso solicitado no existe.';
    } else if (error.status === 409) {
      mensaje = 'Ya existe un registro con esos datos.';
    } else if (error.status >= 500) {
      mensaje = 'Error interno del servidor. Contacta al administrador.';
    }

    console.error('[TipoMovimientoService] Error HTTP:', error);
    return throwError(() => new Error(mensaje));
  }
}
