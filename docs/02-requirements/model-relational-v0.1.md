# Modelo Relacional v0.1 — AgroControl

> Deriva del modelo conceptual v0.1 (Clase 02) y del documento contractual del proyecto (sección F — Modelo de información mínimo esperado). Este documento transforma las entidades conceptuales en tablas candidatas, sin escribir SQL todavía.

---

## 1. Entidades núcleo que soportan el flujo crítico

El flujo crítico contractual (sección J) es:

> Jefe crea campaña sobre parcela → planifica labores → asigna operario → almacén entrega insumo → operario ejecuta y reporta desde móvil → se actualiza bitácora → se registra cosecha → supervisor revisa indicadores.

Entidades que **participan directamente** en ese flujo (núcleo):

| # | Entidad | Rol en el flujo crítico |
|---|---|---|
| 1 | `USUARIO` | Jefe de campo, Operario, Almacenero, Supervisor actúan sobre el sistema |
| 2 | `PARCELA` | Sobre la que se crea la campaña |
| 3 | `CAMPANA` | Punto de partida del flujo |
| 4 | `LABOR` | Se planifica y se asigna |
| 5 | `ASIGNACION_LABOR` | Vincula operario ↔ labor |
| 6 | `INSUMO` | Lo que el almacén entrega |
| 7 | `CONSUMO_LABOR` | Insumo aplicado a una labor específica |
| 8 | `BITACORA_CAMPO` | Se actualiza cuando el operario reporta |
| 9 | `COSECHA` | Cierre del ciclo |

Entidades **de soporte** (no están en la ruta crítica, pero son obligatorias por alcance contractual):

| # | Entidad | Por qué es de soporte |
|---|---|---|
| 10 | `ROL` | Clasifica a `USUARIO`, no participa en el flujo por sí sola |
| 11 | `PREDIO` | Contenedor de `PARCELA`, un nivel arriba del flujo |
| 12 | `CULTIVO` | Catálogo consultado por `CAMPANA`, no transaccional |
| 13 | `MOVIMIENTO_INSUMO` | Entradas/salidas de stock — sostiene a `CONSUMO_LABOR` pero no es el paso ejecutado por el operario |
| 14 | `INCIDENCIA` | Puede o no ocurrir en una ejecución particular del flujo |
| 15 | `AUDITORIA` | Transversal — registra acciones sobre cualquier entidad, no es parte narrativa del flujo |

**Criterio de selección aplicado:** se consideró núcleo toda entidad que aparece como sujeto u objeto directo de un verbo en la narrativa del flujo crítico (sección J). Las de soporte son catálogos, clasificadores o registros transversales que el flujo *presupone* pero no *menciona explícitamente*.

---

## 2. Entidades → Tablas candidatas

Transformación 1 a 1 de entidad conceptual a tabla candidata (nombres en `snake_case`, singular, prefijo de dominio implícito):

| Entidad conceptual | Tabla candidata |
|---|---|
| Rol | `rol` |
| Usuario | `usuario` |
| Predio | `predio` |
| Parcela | `parcela` |
| Cultivo | `cultivo` |
| Campaña | `campana` |
| Labor | `labor` |
| AsignacionLabor | `asignacion_labor` |
| Insumo | `insumo` |
| ConsumoLabor | `consumo_labor` |
| MovimientoInsumo | `movimiento_insumo` |
| BitacoraCampo | `bitacora_campo` |
| Cosecha | `cosecha` |
| Incidencia | `incidencia` |
| Auditoria | `auditoria` |

No se identificaron entidades conceptuales que deban dividirse en más de una tabla, ni pares que deban fusionarse, en esta versión v0.1.

---

## 3. Claves primarias (PK) propuestas y justificación

| Tabla | PK propuesta | Justificación |
|---|---|---|
| `rol` | `id` (surrogate, `BIGSERIAL`) | El nombre del rol podría cambiar de redacción sin cambiar su identidad; se evita atar la PK a un texto |
| `usuario` | `id` (surrogate) | El email es candidata a UNIQUE, no a PK — un usuario podría necesitar cambiar de correo sin perder su identidad referencial en el resto del sistema |
| `predio` | `id` (surrogate) | No existe código natural estable de predio en el dominio descrito |
| `parcela` | `id` (surrogate) | Aunque `(predio_id, nombre)` podría ser clave natural, se prefiere surrogate por estabilidad ante renombres |
| `cultivo` | `id` (surrogate) | `(nombre, variedad)` es candidata a UNIQUE, no PK |
| `campana` | `id` (surrogate) | Una campaña no tiene identificador natural fuera del sistema |
| `labor` | `id` (surrogate) | Igual razón — es un evento planificado, no tiene código externo |
| `asignacion_labor` | `id` (surrogate) | Aunque `(labor_id, usuario_id)` podría ser PK compuesta, se usa surrogate para simplificar referencias futuras (por ejemplo, si una bitácora quisiera referenciar la asignación puntual) |
| `insumo` | `id` (surrogate) | El nombre del insumo puede repetirse entre proveedores; no es identidad confiable |
| `consumo_labor` | `id` (surrogate) | Registro transaccional, no natural |
| `movimiento_insumo` | `id` (surrogate) | Registro transaccional, no natural |
| `bitacora_campo` | `id` (surrogate) | Registro de evento, sin identidad natural |
| `cosecha` | `id` (surrogate) | Registro de evento, sin identidad natural |
| `incidencia` | `id` (surrogate) | Registro de evento, sin identidad natural |
| `auditoria` | `id` (surrogate) | Registro de evento, sin identidad natural; además crece indefinidamente, conviene PK simple para performance de inserción |

**Regla general aplicada:** se usa PK surrogate (`BIGSERIAL`) en las 15 tablas porque ninguna entidad del dominio agrícola descrito posee un identificador natural verdaderamente estable e inmutable en el tiempo. Los candidatos naturales identificados se registran como restricciones `UNIQUE` en la sección 7, no como PK.

---

## 4. Claves foráneas (FK) — relaciones 1:N

| Tabla (lado N) | FK | Referencia (lado 1) | Relación |
|---|---|---|---|
| `usuario` | `rol_id` | `rol.id` | Un rol clasifica muchos usuarios |
| `parcela` | `predio_id` | `predio.id` | Un predio contiene muchas parcelas |
| `campana` | `parcela_id` | `parcela.id` | Una parcela registra muchas campañas |
| `campana` | `cultivo_id` | `cultivo.id` | Un cultivo define muchas campañas |
| `labor` | `campana_id` | `campana.id` | Una campaña agrupa muchas labores |
| `asignacion_labor` | `labor_id` | `labor.id` | Una labor tiene muchas asignaciones |
| `asignacion_labor` | `usuario_id` | `usuario.id` | Un usuario participa en muchas asignaciones |
| `consumo_labor` | `labor_id` | `labor.id` | Una labor registra muchos consumos |
| `consumo_labor` | `insumo_id` | `insumo.id` | Un insumo origina muchos consumos |
| `movimiento_insumo` | `insumo_id` | `insumo.id` | Un insumo tiene muchos movimientos |
| `movimiento_insumo` | `usuario_id` | `usuario.id` | Un usuario ejecuta muchos movimientos (típicamente el almacenero) |
| `bitacora_campo` | `campana_id` | `campana.id` | Una campaña documenta muchas entradas de bitácora |
| `bitacora_campo` | `labor_id` | `labor.id` | Una labor origina muchas entradas de bitácora |
| `bitacora_campo` | `usuario_id` | `usuario.id` | Un usuario es autor de muchas entradas de bitácora |
| `cosecha` | `campana_id` | `campana.id` | Una campaña produce muchas cosechas (parciales o por lote) |
| `incidencia` | `parcela_id` | `parcela.id` | Una parcela presenta muchas incidencias |
| `incidencia` | `labor_id` | `labor.id` | Una labor puede originar muchas incidencias |
| `incidencia` | `usuario_id` | `usuario.id` | Un usuario reporta muchas incidencias |
| `auditoria` | `usuario_id` | `usuario.id` | Un usuario genera muchos registros de auditoría |

No se detectaron relaciones N:N directas entre entidades base; las dos que naturalmente lo serían ya están resueltas mediante tabla puente (ver sección 5).

---

## 5. Relaciones N:M resueltas mediante tabla puente

| Relación conceptual N:M | Tabla puente | Atributos propios de la tabla puente |
|---|---|---|
| `LABOR` ↔ `USUARIO` (un operario participa en varias labores; una labor tiene varios responsables) | `asignacion_labor` | `fecha`, y a futuro podría incorporar `rol_en_labor` (responsable/apoyo) y `estado` |
| `LABOR` ↔ `INSUMO` (una labor consume varios insumos; un insumo se consume en varias labores) | `consumo_labor` | `cantidad` |

**Justificación de crear tabla puente y no una FK directa:** en ambos casos la relación conceptual permite múltiples combinaciones simultáneas en ambos sentidos (un operario en varias labores del mismo día; un insumo usado en varias labores de la misma campaña), lo que viola la regla de cardinalidad 1:N. Además, cada tabla puente necesita guardar información propia del vínculo (cantidad, fecha) que no pertenece a ninguna de las dos entidades originales — señal inequívoca de que se requiere una entidad asociativa y no solo una tabla de cruce vacía.

No se identificaron otras relaciones N:M en el modelo v0.1; el resto de los vínculos son 1:N genuinos.

---

## 6. Optionalidad de las relaciones

| FK | Obligatoria / Opcional | Justificación |
|---|---|---|
| `usuario.rol_id` | **Obligatoria** | Todo usuario del sistema debe tener un rol para que la autorización funcione (RF de seguridad, Parcial 2) |
| `parcela.predio_id` | **Obligatoria** | Una parcela no existe fuera de un predio en este dominio |
| `campana.parcela_id` | **Obligatoria** | RN-02: toda labor pertenece a una campaña y parcela → la campaña ya nace ligada a una parcela |
| `campana.cultivo_id` | **Obligatoria** | No se planifica una campaña sin saber qué se va a cultivar |
| `labor.campana_id` | **Obligatoria** | RN-02 lo exige explícitamente |
| `asignacion_labor.labor_id` / `.usuario_id` | **Obligatorias ambas** | La asignación no tiene sentido sin ambos extremos |
| `consumo_labor.labor_id` / `.insumo_id` | **Obligatorias ambas** | RF-11: el consumo siempre se asocia a una labor y a un insumo |
| `movimiento_insumo.insumo_id` | **Obligatoria** | Todo movimiento es sobre un insumo concreto |
| `movimiento_insumo.usuario_id` | **Obligatoria** | RN-09/trazabilidad: todo movimiento debe tener responsable |
| `bitacora_campo.campana_id` | **Obligatoria** | RF-15: la bitácora se consulta por parcela vía campaña |
| `bitacora_campo.labor_id` | **Opcional** | Puede registrarse una observación general de campaña sin estar ligada a una labor puntual |
| `bitacora_campo.usuario_id` | **Obligatoria** | Trazabilidad: toda entrada necesita autor |
| `cosecha.campana_id` | **Obligatoria** | RN-06: la cosecha se registra contra una campaña activa/finalizable |
| `incidencia.parcela_id` | **Obligatoria** | RN-08: la incidencia queda vinculada a parcela |
| `incidencia.labor_id` | **Opcional** | RN-08 dice "parcela/campaña/labor" — una incidencia puede no estar ligada a una labor específica (ej. incidencia climática general) |
| `incidencia.usuario_id` | **Obligatoria** | Alguien siempre reporta la incidencia |
| `auditoria.usuario_id` | **Obligatoria** (con excepción a evaluar) | Toda acción auditada normalmente tiene actor; se evaluará en v0.2 si procesos automáticos del sistema requieren un usuario "sistema" reservado |

---

## 7. Claves naturales y candidatas a UNIQUE

| Tabla | Combinación candidata | Motivo |
|---|---|---|
| `rol` | `nombre` | No debe haber dos roles con el mismo nombre |
| `usuario` | `email` | Identificador natural de login, debe ser único |
| `predio` | `nombre` | Evita duplicar predios con el mismo nombre (a validar con el cliente si dos predios de distinto dueño podrían compartir nombre) |
| `parcela` | `(predio_id, nombre)` | Dos parcelas del mismo predio no deberían llamarse igual; el mismo nombre sí puede repetirse en predios distintos |
| `cultivo` | `(nombre, variedad)` | Evita catálogo duplicado del mismo cultivo/variedad |
| `campana` | `(parcela_id, cultivo_id, fecha_inicio)` | Apoya RN-01: evita registrar por error dos campañas idénticas superpuestas en la misma parcela |
| `asignacion_labor` | `(labor_id, usuario_id, fecha)` | Evita asignar dos veces al mismo operario a la misma labor el mismo día |
| `insumo` | `nombre` | Evita duplicar insumos en el catálogo (a revisar si debe incluir unidad de medida en la combinación) |
| `movimiento_insumo` | *(ninguna — es un log)* | Cada movimiento es un evento distinto por naturaleza, no requiere UNIQUE más allá de la PK |

---

## 8. Redundancias y listas multivaluadas detectadas (normalización básica)

Revisión aplicada bajo 1FN, 2FN y 3FN sobre el modelo v0.1:

| Hallazgo | Forma normal afectada | Resolución aplicada |
|---|---|---|
| Riesgo inicial: guardar "insumos usados" como lista de texto dentro de `labor` (ej. `"urea, fungicida"`) | 1FN — viola atomicidad | Resuelto: se modela `consumo_labor` como tabla independiente en vez de columna multivaluada |
| Riesgo inicial: guardar `rol` como columna de texto libre en `usuario` en vez de tabla aparte | 3FN — dependencia no llave a llave (el nombre del rol determinaría permisos, generando redundancia si se repite en cada fila) | Resuelto: `rol` es tabla independiente referenciada por `usuario.rol_id` |
| Riesgo detectado: `stock` como atributo directo de `insumo` | Potencial redundancia si también se calcula sumando `movimiento_insumo` | **Pendiente de decisión de diseño (a documentar en ADR):** mantener `stock` como campo materializado en `insumo` (desnormalización intencional por performance de RN-04 "validar stock antes de consumo") vs. calcularlo siempre a partir de `movimiento_insumo`. Se recomienda materializar `stock` en `insumo` y actualizarlo transaccionalmente en cada `movimiento_insumo`/`consumo_labor`, dejando explícito que es una desnormalización controlada, no un descuido |
| Riesgo inicial: repetir `parcela_id` y `cultivo_id` en `labor` (redundante, ya están en `campana`) | 3FN — dependencia transitiva | Resuelto: `labor` solo referencia `campana_id`; parcela y cultivo se obtienen navegando por FK, no se duplican |
| Riesgo inicial: guardar nombre de usuario/rol como texto plano dentro de `bitacora_campo`, `incidencia`, `auditoria` en vez de FK | 2FN/3FN — redundancia y riesgo de inconsistencia si el usuario cambia de nombre | Resuelto: todas estas tablas referencian `usuario_id`, nunca datos descriptivos del usuario |

**Conclusión de la revisión de normalización:** el modelo v0.1 cumple 1FN, 2FN y 3FN en todas las tablas, con una única desnormalización intencional identificada (`insumo.stock`) que debe justificarse formalmente en un ADR (`docs/03-decisions/`) antes del Parcial 1, tal como exige la regla de trabajo del proyecto (todo cambio debe ser "comprensible, trazable y defendible").

---

## 9. Resumen de tablas candidatas (vista consolidada)

| Tabla | Atributos propios | PK | FK obligatorias | FK opcionales | UNIQUE candidata |
|---|---|---|---|---|---|
| `rol` | nombre | id | — | — | nombre |
| `usuario` | nombre, email | id | rol_id | — | email |
| `predio` | nombre, ubicacion | id | — | — | nombre |
| `parcela` | nombre, area_ha | id | predio_id | — | (predio_id, nombre) |
| `cultivo` | nombre, variedad | id | — | — | (nombre, variedad) |
| `campana` | fecha_inicio, estado | id | parcela_id, cultivo_id | — | (parcela_id, cultivo_id, fecha_inicio) |
| `labor` | tipo, estado | id | campana_id | — | — |
| `asignacion_labor` | fecha | id | labor_id, usuario_id | — | (labor_id, usuario_id, fecha) |
| `insumo` | nombre, unidad_medida, stock | id | — | — | nombre |
| `consumo_labor` | cantidad | id | labor_id, insumo_id | — | — |
| `movimiento_insumo` | tipo, cantidad | id | insumo_id, usuario_id | — | — |
| `bitacora_campo` | nota | id | campana_id, usuario_id | labor_id | — |
| `cosecha` | cantidad_kg, fecha | id | campana_id | — | — |
| `incidencia` | descripcion | id | parcela_id, usuario_id | labor_id | — |
| `auditoria` | accion, fecha | id | usuario_id | — | — |

---

## 10. Próximos pasos (no incluidos en esta versión)

- Traducir este documento a migraciones Flyway (`V1__init_schema.sql`)
- Definir tipos de datos exactos y longitudes por columna
- Definir `CHECK` constraints para los estados enumerados de `labor` (planificada, asignada, en ejecución, completada, cancelada — RN-03)
- Redactar el ADR de la desnormalización de `insumo.stock`
- Definir índices justificados para las consultas de RF-15 (bitácora por parcela) y RF-16 (avance por campaña)

---

*Documento generado en el marco de la Clase 03. Fuente de verdad: documento contractual del proyecto (secciones D, E, F, J) y modelo conceptual v0.1 (Clase 02).*

---

## Cambios del modelo hasta V10

El esquema vigente está en `database/esquema_actual.sql`.

| Tabla | Cambio | Migración |
|---|---|---|
| `usuario` | `token_version`, `debe_cambiar_password` | V8 |
| `labor` | `motivo_cancelacion`; estados `ASIGNADA` y `CANCELADA` | V9 |
| `campana` | `motivo_cierre`; estados `CANCELADA` y `PERDIDA` | V9 |
| `cosecha`, `consumo_labor` | `anulado`, `motivo_anulacion`, `anulado_por`, `anulado_en` | V9 |
| `movimiento_insumo` | Los de anulación, más `origen`, `id_consumo` e `id_movimiento_anulado`, con índices únicos | V9 |
| `incidencia` | `motivo_anulacion`, `anulado_por`, `anulado_en`; estado `ANULADA` | V9 |
| `cosecha` | `cosecha_unidad_check`: `t`, `kg` o `qq` | V10 |
