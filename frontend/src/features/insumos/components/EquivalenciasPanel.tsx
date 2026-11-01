import { useState } from 'react';
import Button from '../../../components/ui/Button';
import { useCarga } from '../../../hooks/useCarga';
import { formatCantidad } from '../../../utils/formato';
import type { Insumo } from '../models/Insumo';
import { insumoService } from '../services/insumoService';

interface EquivalenciasPanelProps {
  insumo: Insumo;
  insumos: Insumo[];
  puedeGestionar: boolean;
  onCerrar: () => void;
}

export default function EquivalenciasPanel({ insumo, insumos, puedeGestionar, onCerrar }: EquivalenciasPanelProps) {
  const { datos: equivalentes, loading, error, recargar } = useCarga<Insumo[]>(
    (signal) => insumoService.listarEquivalentes(insumo.id, signal),
    [],
    insumo.id,
  );
  const [nuevo, setNuevo] = useState('');
  const [accionError, setAccionError] = useState('');

  const ejecutar = async (accion: () => Promise<void>) => {
    setAccionError('');
    try {
      await accion();
      recargar();
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  };

  const disponibles = insumos.filter((item) => item.id !== insumo.id && !equivalentes.some((e) => e.id === item.id));

  return (
    <div className="entity-form">
      <h3 className="panel-title">Equivalentes de {insumo.nombre}</h3>
      {loading && <p className="muted">Cargando...</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && equivalentes.length === 0 && <p className="muted">No tiene equivalentes registrados.</p>}
      {equivalentes.length > 0 && (
        <ul>
          {equivalentes.map((item) => (
            <li key={item.id} className="table-actions">
              <span>{item.nombre}{item.marca ? ` · ${item.marca}` : ''}: <strong>{formatCantidad(item.stockActual, item.unidadMedida)}</strong></span>
              {puedeGestionar && (
                <Button variant="secondary" size="sm" type="button" onClick={() => ejecutar(() => insumoService.quitarEquivalente(insumo.id, item.id))}>Quitar</Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {accionError && <div className="form-error">{accionError}</div>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
        {puedeGestionar && (
          <>
            <select className="select-celda" aria-label="Insumo equivalente" value={nuevo} onChange={(e) => setNuevo(e.target.value)}>
              <option value="">Elegir insumo...</option>
              {disponibles.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.marca ? ` · ${item.marca}` : ''}</option>)}
            </select>
            <Button type="button" disabled={!nuevo} onClick={() => ejecutar(async () => {
              await insumoService.agregarEquivalente(insumo.id, Number(nuevo));
              setNuevo('');
            })}>Vincular</Button>
          </>
        )}
      </div>
    </div>
  );
}
