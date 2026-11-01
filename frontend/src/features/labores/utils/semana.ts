const MS_POR_DIA = 24 * 60 * 60 * 1000;

const aISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Los 7 días, de lunes a domingo, de la semana de esa fecha (yyyy-mm-dd). En UTC, para que la zona no corra el día.
export function diasDeSemana(fechaIso: string): string[] {
  const ms = Date.parse(`${fechaIso}T00:00:00Z`);
  const desdeLunes = (new Date(ms).getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => aISO(ms + (i - desdeLunes) * MS_POR_DIA));
}

export const moverSemanas = (fechaIso: string, semanas: number) =>
  aISO(Date.parse(`${fechaIso}T00:00:00Z`) + semanas * 7 * MS_POR_DIA);
