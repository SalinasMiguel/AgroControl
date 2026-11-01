import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import Button from '../../../components/ui/Button';
import { parseArea } from '../../../utils/area';
import type { Predio } from '../../predios/models/Predio';
import { ESTADOS_MANUALES, type Parcela } from '../models/Parcela';
import { parcelaService } from '../services/parcelaService';
import type { ParcelaFormData } from '../types/ParcelaFormData';
import { validarParcela, type ParcelaFormErrors } from '../utils/parcelaValidation';

const initialParcelaForm: ParcelaFormData = {
  codigo: '',
  areaHa: '',
  predioId: '',
  estado: 'DISPONIBLE',
};

function desdeParcela(parcela: Parcela): ParcelaFormData {
  return {
    codigo: parcela.codigo,
    areaHa: parcela.areaHa === null ? '' : String(parcela.areaHa),
    predioId: String(parcela.predioId),
    estado: parcela.estado,
  };
}

interface ParcelaFormProps {
  predios: Predio[];
  parcela?: Parcela | null;
  onSaved?: (parcela: Parcela) => void;
  onCancel?: () => void;
}

export default function ParcelaForm({ predios, parcela, onSaved, onCancel }: ParcelaFormProps) {
  const editando = Boolean(parcela);
  const [formData, setFormData] = useState<ParcelaFormData>(parcela ? desdeParcela(parcela) : initialParcelaForm);
  const [errors, setErrors] = useState<ParcelaFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  // Al editar se muestra el predio actual aunque esté inactivo; al crear, solo predios activos.
  const opcionesPredio = predios.filter((predio) => predio.activo || String(predio.id) === formData.predioId);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validarParcela(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const codigo = formData.codigo.trim().toUpperCase();
    const areaHa = parseArea(formData.areaHa);
    const predioId = Number(formData.predioId);

    try {
      setSaving(true);
      const guardada = parcela
        ? await parcelaService.actualizar(parcela.id, { predioId, codigo, areaHa, estado: formData.estado })
        : await parcelaService.crear({ predioId, codigo, areaHa });
      onSaved?.(guardada);
      if (!parcela) {
        setFormData(initialParcelaForm);
      }
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const limpiar = () => {
    setFormData(initialParcelaForm);
    setErrors({});
    setApiError('');
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label>
          Predio
          <select name="predioId" value={formData.predioId} onChange={handleChange}>
            <option value="">Seleccione un predio</option>
            {opcionesPredio.map((predio) => (
              <option key={predio.id} value={predio.id}>
                {predio.nombre}
              </option>
            ))}
          </select>
          {errors.predioId && <small className="field-error">{errors.predioId}</small>}
        </label>
        <label>
          Codigo
          <input name="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ej.: SJ-03" />
          {errors.codigo && <small className="field-error">{errors.codigo}</small>}
        </label>
        <label>
          Area (ha)
          <input type="number" step="0.01" min="0" name="areaHa" value={formData.areaHa} onChange={handleChange} />
          {errors.areaHa && <small className="field-error">{errors.areaHa}</small>}
        </label>
        {editando && (
          <label>
            Estado
            {formData.estado === 'EN_PRODUCCION' ? (
              <input value="En producción" readOnly />
            ) : (
              <select name="estado" value={formData.estado} onChange={handleChange}>
                {ESTADOS_MANUALES.map((estado) => (
                  <option key={estado} value={estado}>{estado.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
            {errors.estado && <small className="field-error">{errors.estado}</small>}
          </label>
        )}
      </div>

      {apiError && <div className="form-error">{apiError}</div>}

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        {!editando && (
          <Button variant="secondary" onClick={limpiar} disabled={saving}>
            Limpiar
          </Button>
        )}
        <Button type="submit" loading={saving} loadingText="Guardando...">
          {editando ? 'Guardar cambios' : 'Guardar parcela'}
        </Button>
      </div>
    </form>
  );
}
