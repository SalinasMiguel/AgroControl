import { apiFetch } from '../../../api/apiClient';
import type { CategoriaInsumo, Insumo, MovimientoInsumo, SalidaDeAlmacen, TipoMovimiento } from '../models/Insumo';

export interface InsumoCreateRequest {
  nombre: string;
  unidadMedida: string;
  categoria: CategoriaInsumo;
  stockMinimo: number;
}

export interface MovimientoRequest {
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
}

export const insumoService = {
  listar(signal?: AbortSignal): Promise<Insumo[]> {
    return apiFetch<Insumo[]>('/insumos', { signal });
  },

  crear(data: InsumoCreateRequest): Promise<Insumo> {
    return apiFetch<Insumo>('/insumos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mismos campos que al crear; el stock no se edita a mano
  actualizar(id: number, data: InsumoCreateRequest): Promise<Insumo> {
    return apiFetch<Insumo>(`/insumos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Sin fechas: lo que va del mes
  salidas(signal?: AbortSignal): Promise<SalidaDeAlmacen[]> {
    return apiFetch<SalidaDeAlmacen[]>('/insumos/salidas', { signal });
  },

  listarMovimientos(insumoId: number, signal?: AbortSignal): Promise<MovimientoInsumo[]> {
    return apiFetch<MovimientoInsumo[]>(`/insumos/${insumoId}/movimientos`, { signal });
  },

  registrarMovimiento(insumoId: number, data: MovimientoRequest): Promise<MovimientoInsumo> {
    return apiFetch<MovimientoInsumo>(`/insumos/${insumoId}/movimientos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  anularMovimiento(insumoId: number, movimientoId: number, motivo: string): Promise<MovimientoInsumo> {
    return apiFetch<MovimientoInsumo>(`/insumos/${insumoId}/movimientos/${movimientoId}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  ajustar(insumoId: number, stockContado: number, motivo: string): Promise<MovimientoInsumo> {
    return apiFetch<MovimientoInsumo>(`/insumos/${insumoId}/ajustes`, {
      method: 'POST',
      body: JSON.stringify({ stockContado, motivo }),
    });
  },
};
