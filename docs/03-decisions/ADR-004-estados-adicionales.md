# ADR-004: Estados adicionales de campaña e incidencia

## Contexto
RN-03 fija los estados de la labor: planificada, asignada, en ejecución, completada o cancelada. El sistema no tenía `ASIGNADA` ni `CANCELADA`. Para la campaña y la incidencia el Banco no fija una lista, y faltaba cómo cerrar una siembra que nunca empezó, una cosecha perdida o un reporte cargado por error.

## Decisión
- **Labor:** `PLANIFICADA`, `ASIGNADA`, `EN_CURSO` (en ejecución), `EJECUTADA` (completada), `CANCELADA`. Asignar un operario la pasa a `ASIGNADA`.
- **Campaña:** agrega `CANCELADA` (no empezó) y `PERDIDA` (empezó y no llegó a cosecha). `finalizar` solo se acepta desde `EN_CURSO`.
- **Incidencia:** agrega `ANULADA`.
- Cerrar una campaña cancela sus labores pendientes.
- RN-06: la cosecha se registra solo en campañas `EN_CURSO`; una cosecha tardía exige reabrir la campaña.

## Alternativas consideradas
- **Renombrar a los términos del Banco (`EN_EJECUCION`, `COMPLETADA`):** obliga a migrar datos y a cambiar clientes sin cambiar el significado; el Banco permite refinar nombres si se preserva el significado.
- **Marcar perdida con una bandera:** el estado ya existe para eso y lo protege el CHECK.

## Consecuencias
- Reabrir exige motivo. Los datos del cierre anterior quedan en la auditoría de `FINALIZAR` o `MARCAR_PERDIDA`.
- Las labores canceladas no vuelven al reabrir: se planifican de nuevo.
