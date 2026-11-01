import { useCarga } from '../../../hooks/useCarga';
import { formatCantidad } from '../../../utils/formato';
import CategoriaIcono from '../../insumos/components/CategoriaIcono';
import type { AvanceCampana } from '../models/AvanceCampana';
import type { Campana } from '../models/Campana';
import { campanaService } from '../services/campanaService';
import Button from '../../../components/ui/Button';

interface AvancePanelProps {
  campana: Campana;
  titulo: string;
  onCerrar: () => void;
}

function Barra({ etiqueta, porcentaje, detalle }: { etiqueta: string; porcentaje: number; detalle: string }) {
  return (
    <div className="avance-barra">
      <div className="avance-barra__texto">
        <strong>{etiqueta}</strong>
        <span className="muted">{detalle}</span>
      </div>
      <div className="avance-barra__pista" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
        <div className="avance-barra__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

// RF-15: de un vistazo, cuánto se avanzó, qué se gastó y qué se cosechó en la campaña
export default function AvancePanel({ campana, titulo, onCerrar }: AvancePanelProps) {
  const { datos: avance, loading, error } = useCarga<AvanceCampana | null>(
    (signal) => campanaService.avance(campana.id, signal),
    null,
    campana.id,
  );

  return (
    <div className="entity-form">
      <h3 className="panel-title">Avance de {titulo}</h3>
      {loading && <p className="muted">Calculando avance...</p>}
      {error && <div className="form-error">{error}</div>}
      {avance && (
        <>
          <Barra
            etiqueta="Labores ejecutadas"
            porcentaje={avance.porcentajeLabores}
            detalle={`${avance.laboresEjecutadas} de ${avance.laboresTotal} · ${avance.laboresEnCurso} en curso · ${avance.porcentajeLabores} %`}
          />
          {avance.porcentajeCiclo !== null && (
            <Barra
              etiqueta={`Ciclo del cultivo${avance.cultivo ? ` (${avance.cultivo})` : ''}`}
              porcentaje={avance.porcentajeCiclo}
              detalle={`Día ${avance.diasTranscurridos} de ${avance.cicloDias} · ${avance.porcentajeCiclo} %`}
            />
          )}
          <div className="avance-grid">
            <div>
              <strong>Insumos usados</strong>
              {avance.insumos.length === 0 ? (
                <p className="muted">Ninguno todavía.</p>
              ) : (
                <ul>
                  {avance.insumos.map((insumo) => (
                    <li key={insumo.insumoId}>
                      <CategoriaIcono valor={insumo.categoria} /> {insumo.nombre}: {formatCantidad(insumo.cantidad, insumo.unidadMedida)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <strong>Cosecha</strong>
              {avance.cosecha.length === 0 ? (
                <p className="muted">Sin cosecha registrada.</p>
              ) : (
                <ul>
                  {avance.cosecha.map((total) => (
                    <li key={total.unidadMedida}>{formatCantidad(total.cantidad, total.unidadMedida)}</li>
                  ))}
                  <li>Total: <strong>{formatCantidad(avance.cosechaToneladas, 't')}</strong></li>
                  <li>Neto (humedad e impurezas): <strong>{formatCantidad(avance.cosechaToneladasNetas, 't')}</strong></li>
                  {avance.rendimientoToneladasPorHa !== null && (
                    <li>Rendimiento: <strong>{formatCantidad(avance.rendimientoToneladasPorHa, 't/ha')}</strong></li>
                  )}
                </ul>
              )}
            </div>
            <div>
              <strong>Incidencias</strong>
              <p className={avance.incidenciasAbiertas > 0 ? 'form-error' : 'muted'}>
                {avance.incidenciasAbiertas} sin resolver de {avance.incidenciasTotal}
              </p>
            </div>
          </div>
        </>
      )}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
      </div>
    </div>
  );
}
