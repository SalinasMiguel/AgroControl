import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

interface ClaveTemporalDialogProps {
  // La clave solo vive en el estado de la página: al cerrar se pierde y el backend no la guarda.
  clave: string | null;
  nombre: string;
  onCerrar: () => void;
}

export default function ClaveTemporalDialog({ clave, nombre, onCerrar }: ClaveTemporalDialogProps) {
  return (
    <Modal open={clave !== null} title="Contraseña temporal" onClose={onCerrar}>
      <p>Entregue esta contraseña a {nombre}. Deberá cambiarla al ingresar.</p>
      <p><code>{clave}</code></p>
      <p className="muted">Anótela ahora: no se volverá a mostrar.</p>
      <div className="form-actions">
        <Button variant="primary" onClick={onCerrar}>Listo</Button>
      </div>
    </Modal>
  );
}
