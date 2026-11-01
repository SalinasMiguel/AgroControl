import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Button from '../../../components/ui/Button';
import { useCarga } from '../../../hooks/useCarga';
import { isAbortError } from '../../../shared/utils/isAbortError';
import type { FotoIncidencia, Incidencia } from '../models/Incidencia';
import { incidenciaService } from '../services/incidenciaService';

const MAX_FOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;

function Miniatura({ foto }: { foto: FotoIncidencia }) {
  const [url, setUrl] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const control = new AbortController();
    let creada: string | null = null;
    incidenciaService.verFoto(foto.incidenciaId, foto.id, control.signal)
      .then((blob) => {
        creada = URL.createObjectURL(blob);
        setUrl(creada);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) setFallo(true);
      });
    return () => {
      control.abort();
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [foto.incidenciaId, foto.id]);

  if (fallo) return <span className="muted">No se pudo abrir</span>;
  if (!url) return <span className="muted">Cargando...</span>;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Foto ${foto.id} de la incidencia`} /></a>;
}

interface FotosPanelProps {
  incidencia: Incidencia;
  puedeAgregar: boolean;
  onCerrar: () => void;
}

export default function FotosPanel({ incidencia, puedeAgregar, onCerrar }: FotosPanelProps) {
  const { datos: fotos, setDatos: setFotos, loading, error } = useCarga<FotoIncidencia[]>(
    (signal) => incidenciaService.listarFotos(incidencia.id, signal),
    [],
    incidencia.id,
  );
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState('');
  const entrada = useRef<HTMLInputElement>(null);

  const subir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setErrorSubida('');
    if (archivo.size > MAX_BYTES) {
      setErrorSubida('La foto no puede pesar más de 5 MB.');
      return;
    }
    try {
      setSubiendo(true);
      const nueva = await incidenciaService.agregarFoto(incidencia.id, archivo);
      setFotos((prev) => [...prev, nueva]);
    } catch (err) {
      setErrorSubida(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="entity-form">
      <h3 className="panel-title">Fotos de la incidencia</h3>
      {loading && <p className="muted">Cargando fotos...</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && fotos.length === 0 && <p className="muted">Todavía no tiene fotos.</p>}
      <div className="fotos">{fotos.map((foto) => <Miniatura key={foto.id} foto={foto} />)}</div>
      {errorSubida && <div className="form-error">{errorSubida}</div>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
        {puedeAgregar && fotos.length < MAX_FOTOS && (
          <>
            <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={subir} />
            <Button type="button" disabled={subiendo} onClick={() => entrada.current?.click()}>
              {subiendo ? 'Subiendo...' : 'Agregar foto'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
