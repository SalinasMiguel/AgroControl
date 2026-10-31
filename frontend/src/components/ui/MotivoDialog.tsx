import { useId, useState } from 'react';
import { hoyISO } from '../../utils/formato';
import Button from './Button';
import Modal from './Modal';

const MAX_MOTIVO = 200;

interface MotivoDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  aviso?: string;
  // Etiqueta del campo de fecha; sin ella el diálogo solo pide el motivo
  conFecha?: string;
  maxLength?: number;
  onConfirm: (motivo: string, fecha: string) => Promise<void>;
  onCancel: () => void;
}

// Cancelar, anular o reabrir siempre dicen por qué. Si la API rechaza, el diálogo sigue abierto con el error.
export default function MotivoDialog({
  open,
  title,
  confirmLabel,
  aviso,
  conFecha,
  maxLength = MAX_MOTIVO,
  onConfirm,
  onCancel,
}: MotivoDialogProps) {
  const idMotivo = useId();
  const idFecha = useId();
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    if (enviando) return;
    setMotivo('');
    setError('');
    onCancel();
  };

  const confirmar = async () => {
    if (!motivo.trim()) {
      setError('Indique el motivo.');
      return;
    }
    if (conFecha && !fecha) {
      setError(`Indique: ${conFecha}.`);
      return;
    }
    try {
      setEnviando(true);
      setError('');
      await onConfirm(motivo.trim(), fecha);
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={cerrar}>
      <div className="entity-form">
        {aviso && <p className="confirm-dialog__message">{aviso}</p>}
        <label htmlFor={idMotivo}>Motivo</label>
        <textarea
          id={idMotivo}
          rows={3}
          maxLength={maxLength}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        {conFecha && (
          <>
            <label htmlFor={idFecha}>{conFecha}</label>
            <input id={idFecha} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions">
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void confirmar()} loading={enviando} loadingText="Guardando...">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
