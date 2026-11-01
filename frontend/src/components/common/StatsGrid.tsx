import { iconoEstadistica, tonoEstadistica } from '../../shared/utils/iconos';

interface Stat {
  etiqueta: string;
  valor: string | number;
}

interface StatsGridProps {
  stats: Stat[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="stats-grid">
      {stats.map((stat) => {
        const Icono = iconoEstadistica(stat.etiqueta);
        return (
          <article key={stat.etiqueta} className={`stat-card stat-card--${tonoEstadistica(stat.etiqueta, stat.valor)}`}>
            <span className="stat-card__icono"><Icono size={22} aria-hidden /></span>
            <div>
              <span>{stat.etiqueta}</span>
              <strong>{stat.valor}</strong>
            </div>
          </article>
        );
      })}
    </div>
  );
}
