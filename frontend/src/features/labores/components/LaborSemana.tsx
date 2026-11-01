import { useState } from 'react';
import Button from '../../../components/ui/Button';
import { laborPendiente } from '../../../shared/utils/estados';
import { formatFecha, hoyISO } from '../../../utils/formato';
import type { Labor } from '../models/Labor';
import { diasDeSemana, moverSemanas } from '../utils/semana';

const NOMBRE_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface LaborSemanaProps {
  labores: Labor[];
  detalle: (labor: Labor) => string;
}

export default function LaborSemana({ labores, detalle }: LaborSemanaProps) {
  const hoy = hoyISO();
  const [referencia, setReferencia] = useState(hoy);
  const dias = diasDeSemana(referencia);

  return (
    <>
      <div className="semana-nav">
        <Button variant="secondary" size="sm" type="button" onClick={() => setReferencia(moverSemanas(referencia, -1))}>Anterior</Button>
        <Button variant="secondary" size="sm" type="button" onClick={() => setReferencia(hoy)}>Esta semana</Button>
        <Button variant="secondary" size="sm" type="button" onClick={() => setReferencia(moverSemanas(referencia, 1))}>Siguiente</Button>
        <span className="muted">{formatFecha(dias[0])} al {formatFecha(dias[6])}</span>
      </div>
      <div className="semana">
        {dias.map((dia, i) => (
          <div key={dia} className={`semana__dia${dia === hoy ? ' semana__dia--hoy' : ''}`}>
            <h4>{NOMBRE_DIA[i]} {dia.slice(8)}</h4>
            {labores.filter((labor) => labor.fechaPlan === dia).map((labor) => (
              <span key={labor.id} className={`semana__labor${laborPendiente(labor) && dia < hoy ? ' semana__labor--atrasada' : ''}`}>
                <strong>{labor.tipo.replace(/_/g, ' ')}</strong>
                <br />
                <small className="muted">{detalle(labor)} · {labor.estado.replace(/_/g, ' ').toLowerCase()}</small>
              </span>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
