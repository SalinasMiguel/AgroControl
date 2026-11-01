import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { aCsv, descargarCsv, nombreArchivo, type ColumnaExportar } from '../../shared/utils/exportar';
import { formatFecha, hoyISO } from '../../utils/formato';
import Button from './Button';

interface ExportarBotonesProps<T> {
  titulo: string;
  columnas: ColumnaExportar<T>[];
  filas: T[];
}

// Exporta lo filtrado completo, no solo la página visible. PDF = imprimir y "Guardar como PDF".
export default function ExportarBotones<T>({ titulo, columnas, filas }: ExportarBotonesProps<T>) {
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    if (!imprimiendo) return;
    const terminar = () => setImprimiendo(false);
    window.addEventListener('afterprint', terminar);
    window.print();
    return () => window.removeEventListener('afterprint', terminar);
  }, [imprimiendo]);

  return (
    <div className="exportar">
      <Button variant="secondary" size="sm" type="button" disabled={filas.length === 0}
        onClick={() => descargarCsv(nombreArchivo(titulo, hoyISO()), aCsv(columnas, filas))}>
        Excel
      </Button>
      <Button variant="secondary" size="sm" type="button" disabled={filas.length === 0} onClick={() => setImprimiendo(true)}>
        PDF
      </Button>
      {imprimiendo && createPortal(
        <div className="hoja-impresion">
          <h1>{titulo}</h1>
          <p>AgroControl · {formatFecha(hoyISO())} · {filas.length} registros</p>
          <table>
            <thead><tr>{columnas.map((c) => <th key={c.titulo}>{c.titulo}</th>)}</tr></thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={i}>{columnas.map((c) => <td key={c.titulo}>{c.valor(fila) ?? '—'}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
        document.body,
      )}
    </div>
  );
}
