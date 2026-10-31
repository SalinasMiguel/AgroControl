import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import StatsGrid from '../components/common/StatsGrid';
import { useAuth } from '../features/auth/context/useAuth';
import type { Rol } from '../features/auth/models/Sesion';
import { NOMBRE_ROL } from '../features/auth/permisos';
import { campanaAbierta, laborPendiente, sinAnulados } from '../shared/utils/estados';
import { diasAtraso, insumosPorReponer, siembrasAtrasadas } from '../shared/utils/resumenInicio';
import type { Campana } from '../features/campanas/models/Campana';
import { campanaService } from '../features/campanas/services/campanaService';
import { etiquetaCampana, type Catalogos } from '../features/campanas/utils/etiquetas';
import type { Cosecha } from '../features/cosechas/models/Cosecha';
import { cosechaService } from '../features/cosechas/services/cosechaService';
import { cultivoService } from '../features/cultivos/services/cultivoService';
import type { Insumo } from '../features/insumos/models/Insumo';
import { insumoService } from '../features/insumos/services/insumoService';
import type { AsignacionLabor, Labor } from '../features/labores/models/Labor';
import { laborService } from '../features/labores/services/laborService';
import { parcelaService } from '../features/parcelas/services/parcelaService';
import type { Predio } from '../features/predios/models/Predio';
import { predioService } from '../features/predios/services/predioService';
import type { Usuario } from '../features/usuarios/models/Usuario';
import { usuarioService } from '../features/usuarios/services/usuarioService';
import { useCarga } from '../hooks/useCarga';
import { formatArea } from '../utils/area';
import { formatCantidad, formatFecha, hoyISO } from '../utils/formato';

// Cada rol pide solo lo que su panel muestra (y lo que el backend le permite leer).
const cargarResumen = (rol: Rol) => async (signal: AbortSignal) => {
  const vePlanificacion = rol !== 'ALMACENERO';
  const veCosechas = rol !== 'OPERARIO';
  const [predios, parcelas, cultivos, campanas, labores, insumos, cosechas, usuarios, asignaciones] = await Promise.all([
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    campanaService.listar(signal),
    vePlanificacion ? laborService.listar(signal) : Promise.resolve<Labor[]>([]),
    insumoService.listar(signal),
    veCosechas ? cosechaService.listar(signal) : Promise.resolve<Cosecha[]>([]),
    rol === 'ADMINISTRADOR' ? usuarioService.listar(signal) : Promise.resolve<Usuario[]>([]),
    rol === 'JEFE_DE_CAMPO' ? laborService.listarAsignaciones(signal) : Promise.resolve<AsignacionLabor[]>([]),
  ]);
  return { predios, parcelas, cultivos, campanas, labores, insumos, cosechas, usuarios, asignaciones };
};

const vacio = {
  predios: [] as Predio[],
  parcelas: [],
  cultivos: [],
  campanas: [] as Campana[],
  labores: [] as Labor[],
  insumos: [] as Insumo[],
  cosechas: [] as Cosecha[],
  usuarios: [] as Usuario[],
  asignaciones: [] as AsignacionLabor[],
};

const SALUDO: Record<Rol, string> = {
  ADMINISTRADOR: 'Configuración general: usuarios, predios, parcelas y el estado de toda la operación.',
  JEFE_DE_CAMPO: 'Planificación: campañas abiertas, labores por asignar y avance en el campo.',
  OPERARIO: 'Su agenda de campo: las labores que tiene asignadas.',
  ALMACENERO: 'Inventario: stock de insumos y cosechas registradas.',
  SUPERVISOR: 'Indicadores de la operación: avance de campañas, labores y producción.',
};

export default function DashboardPage() {
  const { sesion } = useAuth();
  const rol = sesion?.rol ?? 'SUPERVISOR';
  const { datos, loading, error } = useCarga(cargarResumen(rol), vacio, rol);
  const { predios, parcelas, cultivos, campanas, labores, insumos, usuarios, asignaciones } = datos;
  const cosechas = sinAnulados(datos.cosechas);
  const catalogos: Catalogos = { predios, parcelas, cultivos };

  const areaTotal = parcelas.reduce((suma, parcela) => suma + (parcela.areaHa ?? 0), 0);
  const campanasAbiertas = campanas.filter(campanaAbierta);
  const pendientes = labores.filter(laborPendiente);
  const proximasLabores = [...pendientes].sort((a, b) => a.fechaPlan.localeCompare(b.fechaPlan)).slice(0, 5);
  const sinAsignar = pendientes.filter((labor) => !asignaciones.some((a) => a.laborId === labor.id)).length;
  const insumosSinStock = insumos.filter((insumo) => insumo.stockActual <= 0).length;
  const porReponer = insumosPorReponer(insumos).slice(0, 5);
  const hoy = hoyISO();
  const atrasadas = siembrasAtrasadas(campanas, hoy);
  const toneladas = cosechas.reduce((suma, c) => suma + c.toneladas, 0);
  const avance = labores.length === 0 ? 0 : Math.round(((labores.length - pendientes.length) / labores.length) * 100);
  const campana = (id: number) => campanas.find((item) => item.id === id);

  const stats: Record<Rol, { etiqueta: string; valor: string | number }[]> = {
    ADMINISTRADOR: [
      { etiqueta: 'Usuarios activos', valor: usuarios.filter((u) => u.estado === 'ACTIVO').length },
      { etiqueta: 'Predios activos', valor: predios.filter((predio) => predio.activo).length },
      { etiqueta: `Parcelas (${formatArea(areaTotal)})`, valor: parcelas.length },
      { etiqueta: 'Campañas abiertas', valor: campanasAbiertas.length },
      { etiqueta: 'Siembras atrasadas', valor: atrasadas },
    ],
    JEFE_DE_CAMPO: [
      { etiqueta: 'Campañas abiertas', valor: campanasAbiertas.length },
      { etiqueta: 'Labores pendientes', valor: pendientes.length },
      { etiqueta: 'Pendientes sin operario', valor: sinAsignar },
      { etiqueta: 'Insumos sin stock', valor: insumosSinStock },
      { etiqueta: 'Siembras atrasadas', valor: atrasadas },
    ],
    OPERARIO: [
      { etiqueta: 'Asignadas a mí', valor: labores.length },
      { etiqueta: 'Pendientes', valor: pendientes.length },
      { etiqueta: 'Ejecutadas', valor: labores.length - pendientes.length },
    ],
    ALMACENERO: [
      { etiqueta: 'Insumos', valor: insumos.length },
      { etiqueta: 'Sin stock', valor: insumosSinStock },
      { etiqueta: 'Cosechas registradas', valor: cosechas.length },
      { etiqueta: 'Cosechado (t)', valor: formatCantidad(toneladas, 't') },
    ],
    SUPERVISOR: [
      { etiqueta: 'Campañas abiertas', valor: campanasAbiertas.length },
      { etiqueta: 'Avance de labores', valor: `${avance} %` },
      { etiqueta: 'Cosechado (t)', valor: formatCantidad(toneladas, 't') },
      { etiqueta: 'Insumos sin stock', valor: insumosSinStock },
      { etiqueta: 'Siembras atrasadas', valor: atrasadas },
    ],
  };

  const tarjetaLabores = (
    <article className="list-card">
      <h3>{rol === 'OPERARIO' ? 'Mis próximas labores' : 'Próximas labores'}</h3>
      {proximasLabores.length === 0 ? (
        <p className="muted">No hay labores pendientes.</p>
      ) : (
        <ul>
          {proximasLabores.map((labor) => {
            const campanaLabor = campana(labor.campanaId);
            return (
              <li key={labor.id}>
                <span>
                  <strong>{labor.tipo.replace(/_/g, ' ')}</strong>
                  <br />
                  <small className="muted">
                    {campanaLabor ? etiquetaCampana(campanaLabor, catalogos) : `Campaña ${labor.campanaId}`}
                  </small>
                </span>
                <span>
                  {formatFecha(labor.fechaPlan)}
                  {diasAtraso(labor.fechaPlan, hoy) > 0 && (
                    <small className="celda-nota field-error">Atrasada · {diasAtraso(labor.fechaPlan, hoy)} días</small>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Link className="button-link" to="/labores">{rol === 'OPERARIO' ? 'Ir a mis labores' : 'Ver labores'}</Link>
    </article>
  );

  const tarjetaStock = (
    <article className="list-card">
      <h3>Por reponer</h3>
      {porReponer.length === 0 ? (
        <p className="muted">No hay insumos registrados.</p>
      ) : (
        <ul>
          {porReponer.map((insumo) => (
            <li key={insumo.id}>
              <span>{insumo.nombre}</span>
              <strong className={insumo.stockActual <= 0 ? 'field-error' : ''}>
                {formatCantidad(insumo.stockActual, insumo.unidadMedida)}
              </strong>
            </li>
          ))}
        </ul>
      )}
      <Link className="button-link" to="/insumos">Ver inventario</Link>
    </article>
  );

  const tarjetaCosechas = (
    <article className="list-card">
      <h3>Últimas cosechas</h3>
      {cosechas.length === 0 ? (
        <p className="muted">No hay cosechas registradas.</p>
      ) : (
        <ul>
          {[...cosechas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5).map((cosecha) => {
            const campanaCosecha = campana(cosecha.campanaId);
            return (
              <li key={cosecha.id}>
                <span>
                  {campanaCosecha ? etiquetaCampana(campanaCosecha, catalogos) : `Campaña ${cosecha.campanaId}`}
                  <br />
                  <small className="muted">{formatFecha(cosecha.fecha)}</small>
                </span>
                <strong>{formatCantidad(cosecha.cantidad, cosecha.unidadMedida)}</strong>
              </li>
            );
          })}
        </ul>
      )}
      <Link className="button-link" to="/cosechas">Ver cosechas</Link>
    </article>
  );

  const tarjetas: Record<Rol, ReactNode[]> = {
    ADMINISTRADOR: [tarjetaLabores, tarjetaStock],
    JEFE_DE_CAMPO: [tarjetaLabores, tarjetaStock],
    OPERARIO: [tarjetaLabores],
    ALMACENERO: [tarjetaStock, tarjetaCosechas],
    SUPERVISOR: [tarjetaLabores, tarjetaCosechas],
  };

  return (
    <section className="feature-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PANEL · {NOMBRE_ROL[rol].toUpperCase()}</p>
          <h1>Hola, {sesion?.nombreCompleto.split(' ')[0]}</h1>
          <p>{SALUDO[rol]}</p>
        </div>
      </div>

      {loading && <div className="state-card">Cargando resumen...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid stats={stats[rol]} />
          <div className="dashboard-grid">
            {tarjetas[rol].map((tarjeta, i) => <Fragment key={i}>{tarjeta}</Fragment>)}
          </div>
        </>
      )}
    </section>
  );
}
