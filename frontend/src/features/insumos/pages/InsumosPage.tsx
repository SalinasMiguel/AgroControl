import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import { useCarga } from '../../../hooks/useCarga';
import { formatCantidad } from '../../../utils/formato';
import type { Usuario } from '../../usuarios/models/Usuario';
import { usuarioService } from '../../usuarios/services/usuarioService';
import { useAuth } from '../../auth/context/useAuth';
import InsumoForm from '../components/InsumoForm';
import MovimientosPanel from '../components/MovimientosPanel';
import SalidasDelMes from '../components/SalidasDelMes';
import { TriangleAlert } from 'lucide-react';
import CategoriaIcono from '../components/CategoriaIcono';
import CompraPanel from '../components/CompraPanel';
import EquivalenciasPanel from '../components/EquivalenciasPanel';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import { CATEGORIAS, type CategoriaInsumo, type Insumo } from '../models/Insumo';
import { insumoService } from '../services/insumoService';
import Button from '../../../components/ui/Button';
import { buscarInsumos } from '../utils/buscarInsumos';
import SearchInput from '../../../components/ui/SearchInput';
import EmptyState from '../../../components/ui/EmptyState';

const cargarDatos = async (signal: AbortSignal) => {
  const [insumos, usuarios] = await Promise.all([insumoService.listar(signal), usuarioService.listar(signal)]);
  return { insumos, usuarios };
};

export default function InsumosPage() {
  const { datos, setDatos, loading, error, recargar } = useCarga(cargarDatos, {
    insumos: [] as Insumo[],
    usuarios: [] as Usuario[],
  });
  const { insumos, usuarios } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { puede } = useAuth();
  const puedeGestionar = puede('insumos.gestionar');
  const puedeVerMovimientos = puede('insumos.verMovimientos');
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [comprando, setComprando] = useState(false);
  const [conEquivalentes, setConEquivalentes] = useState<Insumo | null>(null);
  const [filtro, setFiltro] = useState<CategoriaInsumo | 'TODOS' | 'POR_AGOTARSE'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  // Sube con cada movimiento para que el resumen del mes se vuelva a calcular
  const [versionSalidas, setVersionSalidas] = useState(0);

  // Se busca por id para que el panel muestre el stock actualizado después de recargar.
  const seleccionado = insumos.find((insumo) => insumo.id === seleccionadoId) ?? null;
  const porAgotarse = insumos.filter((insumo) => insumo.porAgotarse || insumo.stockActual <= 0).length;
  const visibles = buscarInsumos(insumos, busqueda).filter((insumo) =>
    filtro === 'TODOS' ? true
      : filtro === 'POR_AGOTARSE' ? insumo.porAgotarse || insumo.stockActual <= 0
        : insumo.categoria === filtro);
  const categoriasConInsumos = CATEGORIAS.filter((c) => insumos.some((insumo) => insumo.categoria === c.valor));

  const abrirMovimientos = (insumo: Insumo) => {
    setEditando(null);
    setSeleccionadoId(insumo.id);
  };

  const abrirEdicion = (insumo: Insumo) => {
    setSeleccionadoId(null);
    setEditando(insumo);
  };

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="ALMACÉN"
        titulo="Insumos"
        descripcion="Todo lo que entra y sale del almacén: semillas, fertilizantes, agroquímicos, combustible, aceites y repuestos."
        accion={
          puedeGestionar ? (
            <div className="table-actions">
              <Button variant="secondary" type="button" onClick={() => setComprando((prev) => !prev)}>Registrar compra</Button>
              <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
                {mostrarFormulario ? 'Cerrar formulario' : '+ Nuevo insumo'}
              </Button>
            </div>
          ) : undefined
        }
      />

      {puedeGestionar && mostrarFormulario && (
        <InsumoForm onGuardado={(nuevo) => setDatos((prev) => ({ ...prev, insumos: [...prev.insumos, nuevo] }))} />
      )}

      {comprando && (
        <CompraPanel
          insumos={insumos}
          onRegistrada={() => {
            recargar();
            setVersionSalidas((v) => v + 1);
          }}
          onCerrar={() => setComprando(false)}
        />
      )}

      {conEquivalentes && (
        <EquivalenciasPanel
          key={conEquivalentes.id}
          insumo={conEquivalentes}
          insumos={insumos}
          puedeGestionar={puedeGestionar}
          onCerrar={() => setConEquivalentes(null)}
        />
      )}

      {editando && (
        <InsumoForm
          key={editando.id}
          insumo={editando}
          onGuardado={(actualizado) => {
            setDatos((prev) => ({
              ...prev,
              insumos: prev.insumos.map((item) => (item.id === actualizado.id ? actualizado : item)),
            }));
            setEditando(null);
          }}
          onCerrar={() => setEditando(null)}
        />
      )}

      {seleccionado && (
        <MovimientosPanel
          insumo={seleccionado}
          usuarios={usuarios}
          puedeRegistrar={puedeGestionar}
          onMovimientoRegistrado={() => {
            recargar();
            setVersionSalidas((v) => v + 1);
          }}
          onCerrar={() => setSeleccionadoId(null)}
        />
      )}

      {loading && <div className="state-card">Cargando insumos...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Insumos', valor: insumos.length },
              { etiqueta: 'Por agotarse o sin stock', valor: porAgotarse },
              { etiqueta: 'Combustibles', valor: insumos.filter((i) => i.categoria === 'COMBUSTIBLE').length },
              { etiqueta: 'Repuestos', valor: insumos.filter((i) => i.categoria === 'REPUESTO').length },
            ]}
          />

          {puedeVerMovimientos && <SalidasDelMes version={versionSalidas} />}

          <SearchInput
            label="Buscar insumo"
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Código, marca o nombre"
          />
          <div className="barra-resultados">
            <ExportarBotones
              titulo="Insumos"
              filas={visibles}
              columnas={[
                { titulo: 'Insumo', valor: (i) => i.nombre },
                { titulo: 'Código', valor: (i) => i.codigo },
                { titulo: 'Marca', valor: (i) => i.marca },
                { titulo: 'Categoría', valor: (i) => i.categoria },
                { titulo: 'Stock', valor: (i) => i.stockActual },
                { titulo: 'Unidad', valor: (i) => i.unidadMedida },
                { titulo: 'Mínimo', valor: (i) => i.stockMinimo },
              ]}
            />
          </div>
          <div className="chips" role="tablist" aria-label="Filtrar por categoría">
            <button type="button" className={`chip${filtro === 'TODOS' ? ' chip--activo' : ''}`} onClick={() => setFiltro('TODOS')}>
              Todos ({insumos.length})
            </button>
            {porAgotarse > 0 && (
              <button type="button" className={`chip chip--alerta${filtro === 'POR_AGOTARSE' ? ' chip--activo' : ''}`} onClick={() => setFiltro('POR_AGOTARSE')}>
                <TriangleAlert size={14} aria-hidden /> Por agotarse ({porAgotarse})
              </button>
            )}
            {categoriasConInsumos.map((c) => (
              <button key={c.valor} type="button" className={`chip${filtro === c.valor ? ' chip--activo' : ''}`} onClick={() => setFiltro(c.valor)}>
                <CategoriaIcono valor={c.valor} /> {c.nombre} ({insumos.filter((i) => i.categoria === c.valor).length})
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <EmptyState title={insumos.length === 0 ? 'No hay insumos registrados.' : 'No hay insumos en este filtro.'} />
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Insumo</th><th>Código</th><th>Marca</th><th>Categoría</th><th>Stock actual</th><th>Mínimo</th>
                      {puedeVerMovimientos && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((insumo) => {
                      const alerta = insumo.stockActual <= 0 ? 'Sin stock' : insumo.porAgotarse ? 'Por agotarse' : '';
                      return (
                        <tr key={insumo.id}>
                          <td>{insumo.nombre}</td>
                          <td className={insumo.codigo ? 'code-cell' : 'muted'}>{insumo.codigo ?? '—'}</td>
                          <td className={insumo.marca ? undefined : 'muted'}>{insumo.marca ?? '—'}</td>
                          <td><CategoriaIcono valor={insumo.categoria} conNombre /></td>
                          <td className={alerta ? 'field-error' : ''}>
                            {formatCantidad(insumo.stockActual, insumo.unidadMedida)}
                            {alerta && <small className="celda-nota icono-texto"><TriangleAlert size={13} aria-hidden /> {alerta}</small>}
                          </td>
                          <td className="muted">{insumo.stockMinimo > 0 ? formatCantidad(insumo.stockMinimo, insumo.unidadMedida) : '—'}</td>
                          {puedeVerMovimientos && (
                            <td>
                              <div className="table-actions">
                                <Button variant="secondary" size="sm" type="button" onClick={() => abrirMovimientos(insumo)}>
                                  {puedeGestionar ? 'Entrada / salida' : 'Movimientos'}
                                </Button>
                                <Button variant="secondary" size="sm" type="button" onClick={() => setConEquivalentes(insumo)}>Equivalentes</Button>
                                {puedeGestionar && (
                                  <Button variant="secondary" size="sm" type="button" onClick={() => abrirEdicion(insumo)}>Editar</Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
