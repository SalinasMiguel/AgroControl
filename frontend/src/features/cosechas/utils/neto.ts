import type { Cosecha } from '../models/Cosecha';

// Igual que Cosecha.getToneladasNetas del backend: descuenta impurezas y el agua por encima del estándar.
export function toneladasNetas(cosecha: Pick<Cosecha, 'toneladas' | 'humedadPct' | 'impurezasPct'>, humedadEstandar: number | null): number {
  let netas = cosecha.toneladas;
  if (cosecha.impurezasPct != null) netas *= (100 - cosecha.impurezasPct) / 100;
  if (cosecha.humedadPct != null && humedadEstandar !== null && cosecha.humedadPct > humedadEstandar) {
    netas *= (100 - cosecha.humedadPct) / (100 - humedadEstandar);
  }
  return netas;
}
