# ADR-002: Corregir anulando, no borrando

## Contexto
No había forma de corregir un error de carga. RN-09 prohíbe eliminar el historial de campañas terminadas y el Banco exige saber quién hizo qué y cuándo (criterios de aceptación globales, RNF-07).

## Decisión
- Lo planificado (campañas y labores que no empezaron, cultivos) se edita.
- Lo que ya pasó (cosechas, consumos, movimientos, incidencias) se anula con motivo obligatorio: queda tachado, fuera de los totales y con quién, cuándo y por qué.
- Anular stock crea el movimiento contrario. El stock nunca se escribe a mano: `stock_actual` siempre es igual a entradas menos salidas.
- Un conteo físico registra la diferencia como movimiento `AJUSTE`.

## Alternativas consideradas
- **`DELETE` con auditoría:** contradice RN-09 y rompe la regla de stock.
- **`PUT` sobre los hechos:** el valor anterior solo quedaría en la auditoría y los totales cambiarían sin rastro visible.
- **Bloqueo optimista:** ante un doble clic daría un error de versión; el bloqueo pesimista hace que la segunda anulación espere y responda "ya anulado".

## Consecuencias
- Corregir una cantidad son dos pasos: anular y volver a registrar.
- Cada anulación bloquea primero el registro y luego el insumo. Dos índices únicos en V9 lo respaldan en la base.
