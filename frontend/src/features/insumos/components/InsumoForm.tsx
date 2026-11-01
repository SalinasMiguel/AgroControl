import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { CATEGORIAS, categoria as datosCategoria, type CategoriaInsumo, type Insumo } from '../models/Insumo';
import { insumoService } from '../services/insumoService';
import Button from '../../../components/ui/Button';

const UNIDADES = ['kg', 'L', 't', 'unidad', 'bolsa', 'caja', 'juego'];

interface InsumoFormProps {
  // Con insumo se edita; sin insumo se crea uno nuevo
  insumo?: Insumo;
  onGuardado: (insumo: Insumo) => void;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'nombre' | 'unidadMedida' | 'stockMinimo' | 'codigo' | 'marca', string>>;

export default function InsumoForm({ insumo, onGuardado, onCerrar }: InsumoFormProps) {
  const editando = Boolean(insumo);
  const [nombre, setNombre] = useState(insumo?.nombre ?? '');
  const [codigo, setCodigo] = useState(insumo?.codigo ?? '');
  const [marca, setMarca] = useState(insumo?.marca ?? '');
  const [categoria, setCategoria] = useState<CategoriaInsumo>(insumo?.categoria ?? 'SEMILLA');
  const [unidadMedida, setUnidadMedida] = useState(insumo?.unidadMedida ?? 'kg');
  const [stockMinimo, setStockMinimo] = useState(insumo ? String(insumo.stockMinimo) : '');
  const esRepuesto = categoria === 'REPUESTO';
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Al elegir la categoría se propone su unidad habitual (diésel en L, filtros por unidad)
  const cambiarCategoria = (valor: CategoriaInsumo) => {
    setCategoria(valor);
    if (!editando) setUnidadMedida(datosCategoria(valor).unidad);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
    if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
    else if (nombre.trim().length > 100) errores.nombre = 'El nombre admite como máximo 100 caracteres.';
    if (codigo.trim().length > 40) errores.codigo = 'El código admite como máximo 40 caracteres.';
    if (marca.trim().length > 60) errores.marca = 'La marca admite como máximo 60 caracteres.';
    if (!unidadMedida) errores.unidadMedida = 'La unidad es obligatoria.';
    const minimo = stockMinimo.trim() === '' ? 0 : Number(stockMinimo);
    if (Number.isNaN(minimo) || minimo < 0) errores.stockMinimo = 'Use un número igual o mayor que 0.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    const datos = {
      nombre: nombre.trim(), unidadMedida, categoria, stockMinimo: minimo,
      codigo: codigo.trim() || null, marca: marca.trim() || null,
    };
    try {
      setSubmitting(true);
      if (insumo) {
        onGuardado(await insumoService.actualizar(insumo.id, datos));
        return;
      }
      onGuardado(await insumoService.crear(datos));
      setNombre('');
      setCodigo('');
      setMarca('');
      setMensaje('Insumo creado con stock 0. Registre una ENTRADA en "Movimientos" para cargar existencias.');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      {editando && <h3 className="panel-title">Editar {insumo?.nombre}</h3>}
      <div className="form-grid">
        <label>
          Categoría
          <select value={categoria} onChange={(e) => cambiarCategoria(e.target.value as CategoriaInsumo)}>
            {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.nombre}</option>)}
          </select>
        </label>
        <label>
          {esRepuesto ? 'Nombre del repuesto' : 'Nombre'}
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={esRepuesto ? 'Ej.: Rodamiento de rueda delantera' : 'Ej.: Diésel, Urea 46%'}
          />
          {errors.nombre && <small className="field-error">{errors.nombre}</small>}
        </label>
        <label>
          Código (opcional)
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder={esRepuesto ? 'Ej.: 6205-2RS1' : 'Si trae código'} />
          {errors.codigo && <small className="field-error">{errors.codigo}</small>}
        </label>
        <label>
          Marca (opcional)
          <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder={esRepuesto ? 'Ej.: SKF, CAT, John Deere' : 'Si tiene marca'} />
          {errors.marca && <small className="field-error">{errors.marca}</small>}
        </label>
        <label>
          Unidad de medida
          <select value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)}>
            {[...new Set([unidadMedida, ...UNIDADES])].map((unidad) => <option key={unidad} value={unidad}>{unidad}</option>)}
          </select>
          {errors.unidadMedida && <small className="field-error">{errors.unidadMedida}</small>}
        </label>
        <label>
          Stock mínimo (avisa al llegar)
          <input type="number" min="0" step="0.01" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} placeholder="0 = sin aviso" />
          {errors.stockMinimo && <small className="field-error">{errors.stockMinimo}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        {onCerrar && <Button variant="secondary" type="button" onClick={onCerrar} disabled={submitting}>Cancelar</Button>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar insumo'}
        </Button>
      </div>
    </form>
  );
}
