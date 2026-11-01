import { ArrowRight, CalendarDays, ChartPie, Sprout, Tractor, Warehouse, Wheat, type LucideIcon } from 'lucide-react';
import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import StatsGrid from '../components/common/StatsGrid';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../features/auth/context/useAuth';
import type { Rol } from '../features/auth/models/Sesion';
import { NOMBRE_ROL, type Seccion } from '../features/auth/permisos';
import { campanaAbierta, laborPendiente, sinAnulados } from '../shared/utils/estados';
import { diasAtraso, insumosPorReponer, siembrasAtrasadas } from '../shared/utils/resumenInicio';
import type { Campana } from '../features/campanas/models/Campana';
import { campanaService } from '../features/campanas/services/campanaService';
import { etiquetaCampana, type Catalogos } from '../features/campanas/utils/etiquetas';
import type { Cosecha } from '../features/cosechas/models/Cosecha';
import { cosechaService } from '../features/cosechas/services/cosechaService';
import { cultivoService } from '../features/cultivos/services/cultivoService';
import { CATEGORIAS, categoria, type Insumo } from '../features/insumos/models/Insumo';
import { insumoService } from '../features/insumos/services/insumoService';
import type { AsignacionLabor, Labor } from '../features/labores/models/Labor';
import { laborService } from '../features/labores/services/laborService';
import { parcelaService } from '../features/parcelas/services/parcelaService';
import type { Predio } from '../features/predios/models/Predio';
import { predioService } from '../features/predios/services/predioService';
import type { Usuario } from '../features/usuarios/models/Usuario';
import { usuarioService } from '../features/usuarios/services/usuarioService';
import { useCarga } from '../hooks/useCarga';
import { ICONO_SECCION, iconoLabor } from '../shared/utils/iconos';
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

const ACCESOS: { seccion: Exclude<Seccion, 'inicio'>; nombre: string; detalle: string }[] = [
  { seccion: 'predios', nombre: 'Predios', detalle: 'Campos y ubicaciones' },
  { seccion: 'parcelas', nombre: 'Parcelas', detalle: 'Lotes y superficies' },
  { seccion: 'cultivos', nombre: 'Cultivos', detalle: 'Catálogo de cultivos' },
  { seccion: 'campanas', nombre: 'Campañas', detalle: 'Planificación por temporada' },
  { seccion: 'labores', nombre: 'Labores', detalle: 'Trabajo en el campo' },
  { seccion: 'insumos', nombre: 'Insumos', detalle: 'Inventario y movimientos' },
  { seccion: 'cosechas', nombre: 'Cosechas', detalle: 'Producción registrada' },
  { seccion: 'incidencias', nombre: 'Incidencias', detalle: 'Problemas reportados' },
  { seccion: 'usuarios', nombre: 'Usuarios', detalle: 'Cuentas y roles' },
  { seccion: 'auditoria', nombre: 'Auditoría', detalle: 'Historial de cambios' },
];

const fechaDeHoy = () =>
  new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function Fila({ icono: Icono, children }: { icono: LucideIcon; children: ReactNode }) {
  return (
    <span className="fila">
      <span className="fila__icono"><Icono size={16} aria-hidden /></span>
      <span>{children}</span>
    </span>
  );
}

function Enlace({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="button-link" to={to}>{children}<ArrowRight size={16} aria-hidden /></Link>;
}

export default function DashboardPage() {
  const { sesion, puedeVer } = useAuth();
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
  const contarLabores = (estado: Labor['estado']) => labores.filter((labor) => labor.estado === estado).length;
  const [fechaLarga] = useState(fechaDeHoy);

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
      <h3><Tractor size={18} aria-hidden />{rol === 'OPERARIO' ? 'Mis próximas labores' : 'Próximas labores'}</h3>
      {proximasLabores.length === 0 ? (
        <EmptyState title="No hay labores pendientes." description="Cuando se planifiquen aparecerán aquí." />
      ) : (
        <ul>
          {proximasLabores.map((labor) => {
            const campanaLabor = campana(labor.campanaId);
            return (
              <li key={labor.id}>
                <Fila icono={iconoLabor(labor.tipo)}>
                  <strong>{labor.tipo.replace(/_/g, ' ')}</strong>
                  <br />
                  <small className="muted">
                    {campanaLabor ? etiquetaCampana(campanaLabor, catalogos) : `Campaña ${labor.campanaId}`}
                  </small>
                </Fila>
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
      <Enlace to="/labores">{rol === 'OPERARIO' ? 'Ir a mis labores' : 'Ver labores'}</Enlace>
    </article>
  );

  const tarjetaStock = (
    <article className="list-card">
      <h3><Warehouse size={18} aria-hidden />Por reponer</h3>
      {porReponer.length === 0 ? (
        <EmptyState title="Nada por reponer." description="Los insumos con poco stock aparecerán aquí." />
      ) : (
        <ul>
          {porReponer.map((insumo) => (
            <li key={insumo.id}>
              <Fila icono={categoria(insumo.categoria).icono}>{insumo.nombre}</Fila>
              <strong className={insumo.stockActual <= 0 ? 'field-error' : ''}>
                {formatCantidad(insumo.stockActual, insumo.unidadMedida)}
              </strong>
            </li>
          ))}
        </ul>
      )}
      <Enlace to="/insumos">Ver inventario</Enlace>
    </article>
  );

  const tarjetaCosechas = (
    <article className="list-card">
      <h3><Wheat size={18} aria-hidden />Últimas cosechas</h3>
      {cosechas.length === 0 ? (
        <EmptyState title="No hay cosechas registradas." description="Las últimas aparecerán aquí." />
      ) : (
        <ul>
          {[...cosechas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5).map((cosecha) => {
            const campanaCosecha = campana(cosecha.campanaId);
            return (
              <li key={cosecha.id}>
                <Fila icono={Wheat}>
                  {campanaCosecha ? etiquetaCampana(campanaCosecha, catalogos) : `Campaña ${cosecha.campanaId}`}
                  <br />
                  <small className="muted">{formatFecha(cosecha.fecha)}</small>
                </Fila>
                <strong>{formatCantidad(cosecha.cantidad, cosecha.unidadMedida)}</strong>
              </li>
            );
          })}
        </ul>
      )}
      <Enlace to="/cosechas">Ver cosechas</Enlace>
    </article>
  );

  const tarjetaAvance = (
    <article className="list-card">
      <h3><ChartPie size={18} aria-hidden />{rol === 'OPERARIO' ? 'Mi avance' : 'Avance de labores'}</h3>
      {labores.length === 0 ? (
        <EmptyState title="Aún no hay labores." description="El avance se calcula con las labores ejecutadas." />
      ) : (
        <div className="avance-anillo">
          <div
            className="avance-anillo__circulo"
            role="img"
            aria-label={`${avance} % de labores ejecutadas`}
            style={{ '--avance': `${avance}%` } as CSSProperties}
          >
            <strong>{avance} %</strong>
          </div>
          <ul>
            <li><span>Planificadas</span><strong>{contarLabores('PLANIFICADA')}</strong></li>
            <li><span>En curso</span><strong>{contarLabores('EN_CURSO')}</strong></li>
            <li><span>Ejecutadas</span><strong>{contarLabores('EJECUTADA')}</strong></li>
          </ul>
        </div>
      )}
    </article>
  );

  const tarjetaCategorias = (
    <article className="list-card">
      <h3><ChartPie size={18} aria-hidden />Inventario por categoría</h3>
      <ul>
        {CATEGORIAS.map((c) => (
          <li key={c.valor}>
            <Fila icono={c.icono}>{c.nombre}</Fila>
            <strong>{insumos.filter((insumo) => insumo.categoria === c.valor).length}</strong>
          </li>
        ))}
      </ul>
    </article>
  );

  const tarjetas: Record<Rol, ReactNode[]> = {
    ADMINISTRADOR: [tarjetaLabores, tarjetaAvance, tarjetaStock],
    JEFE_DE_CAMPO: [tarjetaLabores, tarjetaAvance, tarjetaStock],
    OPERARIO: [tarjetaLabores, tarjetaAvance],
    ALMACENERO: [tarjetaStock, tarjetaCategorias, tarjetaCosechas],
    SUPERVISOR: [tarjetaLabores, tarjetaAvance, tarjetaCosechas],
  };

  return (
    <section className="feature-page">
      <div className="inicio-hero">
        <p className="eyebrow">PANEL · {NOMBRE_ROL[rol].toUpperCase()}</p>
        <h1>Hola, {sesion?.nombreCompleto.split(' ')[0]}</h1>
        <p>{SALUDO[rol]}</p>
        <span className="inicio-hero__fecha"><CalendarDays size={15} aria-hidden />{fechaLarga}</span>
        <Sprout className="inicio-hero__dibujo" size={190} strokeWidth={1.25} aria-hidden />
      </div>

      {loading && <div className="state-card">Cargando resumen...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid stats={stats[rol]} />
          <h2 className="inicio-titulo">Accesos rápidos</h2>
          <nav className="accesos-grid" aria-label="Accesos rápidos">
            {ACCESOS.filter((acceso) => puedeVer(acceso.seccion)).map(({ seccion, nombre, detalle }) => {
              const Icono = ICONO_SECCION[seccion];
              return (
                <Link key={seccion} className="acceso" to={`/${seccion}`}>
                  <span className="acceso__icono"><Icono size={19} aria-hidden /></span>
                  <span>
                    <strong>{seccion === 'labores' && rol === 'OPERARIO' ? 'Mis labores' : nombre}</strong>
                    <small>{detalle}</small>
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="dashboard-grid">
            {tarjetas[rol].map((tarjeta, i) => <Fragment key={i}>{tarjeta}</Fragment>)}
          </div>
        </>
      )}
    </section>
  );
}
