# AgroControl: Parte 1, base confiable

Fecha: 2026-10-31. Estado: borrador para revisión.

## 1. Objetivo

Dejar AgroControl listo para que una sola empresa lo use con datos reales: que pueda instalarse vacío, administrar sus cuentas, corregir errores sin perder historial y mostrar números correctos.

**Terminado significa:**
- Una instalación de producción arranca sin datos de ejemplo, con los 5 roles y un administrador que debe cambiar su clave.
- Cuentas, campañas, labores y hechos registrados se corrigen desde la web, con motivo y auditoría.
- Cosechas, fechas, parcelas y alertas de inicio son correctas en web y móvil.
- La demo con `agro123` sigue funcionando.
- Pasan las pruebas de backend y web. El móvil pasa tipos y lint, y se prueba en el emulador.
- Cada hito se probó de punta a punta.

**Supuestos:** no hay productor todavía; una empresa por instalación; la defensa del 2026-11-02 usa `feat/movil-api`, que no recibe este trabajo.

## 2. Alcance

**Incluye:** cuentas, instalación limpia, corrección y anulación, unidades, hora, estado de parcelas e inicio web.

**Queda fuera:**
- **Parte 2:** registro desde el móvil, cola sin señal, duplicados, APK y cambio de clave en el móvil.
- **Parte 3:** HTTPS, copias, límite de intentos, Swagger, puertos, usuario root del contenedor y correos visibles para todo rol. Hasta entonces, el perfil de producción no debe exponerse a internet.
- **Parte 4:** clasificación de incidencias y avisos.
- **Parte 5:** costos y maquinaria.
- **Sin cambio:** recuperar clave por correo, varias empresas por instalación, editar labores en curso y reabrir registros cancelados.

## 3. Hito 1: cuentas e instalación limpia

### Perfiles y migraciones

| Ubicación | Contenido | Demo (por defecto) | `produccion` |
|---|---|---|---|
| `db/migration` | V1, V4, V5, V6, V8 en adelante | Sí | Sí |
| `db/demo` | V2, V3 y V7 actuales, movidos sin cambios | Sí | No |
| `db/produccion` | `V2__roles.sql` (5 roles) y `V7__categorias_insumo.sql` (solo estructura) | No | Sí |

- `application.properties` usa `classpath:db/migration,classpath:db/demo`. Nuevo `application-produccion.properties` usa `db/migration,db/produccion`.
- En producción, `AGROCONTROL_JWT_SECRET` no tiene valor por defecto: si falta, la aplicación no arranca.
- En producción, `spring.jpa.show-sql` queda apagado.
- Una base creada con un perfil no abre con el otro, porque Flyway rechaza V2 y V7. La producción necesita base vacía.
- `agrocontrol.demo` vale `true` por defecto y `false` en producción. `GET /api/health` lo devuelve como `demo`.
- `LoginPage` muestra los usuarios de prueba solo si `demo` es `true`; mientras carga o si falla, los oculta.

### Primer administrador

Un `ApplicationRunner` del perfil `produccion` actúa si no hay usuarios:
- Lee `AGROCONTROL_ADMIN_EMAIL` y `AGROCONTROL_ADMIN_PASSWORD`. Si faltan o la clave tiene menos de 8 caracteres, el arranque falla.
- Crea al administrador con `debe_cambiar_password = true`.
- Con usuarios existentes, ignora esas variables.

### Datos (V8)

`usuario` agrega `token_version integer NOT NULL DEFAULT 0` y `debe_cambiar_password boolean NOT NULL DEFAULT false`.

### API

| Método y ruta | Datos | Reglas |
|---|---|---|
| `POST /api/auth/cambiar-password` | `passwordActual`, `passwordNueva` | Exige la clave actual; 8 a 72 caracteres; distinta de la actual. Sube la versión, limpia la obligación y devuelve una sesión nueva |
| `PUT /api/usuarios/{id}` | `rolId`, `nombreCompleto`, `email` | Solo admin; email único. Si cambia el rol, sube la versión |
| `POST /api/usuarios/{id}/desactivar` | | Solo admin |
| `POST /api/usuarios/{id}/activar` | | Solo admin |
| `POST /api/usuarios/{id}/restablecer-password` | | Solo admin. Genera 12 caracteres con `SecureRandom`, activa la obligación, sube la versión y responde `passwordTemporal` con `Cache-Control: no-store` |

- `SesionResponse` y `UsuarioResponse` agregan `debeCambiarPassword`.
- Nadie puede desactivarse a sí mismo.
- Ninguna operación puede dejar el sistema sin administrador activo.
- La clave temporal solo se muestra una vez y no se guarda.

### Sesiones

- El JWT agrega el claim `ver` con `token_version`. Un token sin `ver` cuenta como versión 0, así las sesiones abiertas siguen válidas.
- Un filtro, ubicado después de `BearerTokenAuthenticationFilter`, llama a `AuthService.estadoCuenta(id)` en cada petición con token:
  - Usuario inexistente, inactivo o con otra versión: 401.
  - Clave pendiente: 403, salvo `POST /api/auth/cambiar-password` y `GET /api/auth/me`.

### Auditoría sin claves

`AuditoriaAspect` guarda los argumentos de texto en `detalle`. Por eso el caso de uso recibe `CambiarPasswordCommand`, un objeto que el aspecto omite, y nunca dos `String`. Una prueba comprueba que la clave no aparece en `auditoria`.

### Web y móvil

- **UsuariosPage:** editar, desactivar, activar y restablecer clave, con diálogo que muestra la temporal una vez.
- **Encabezado:** acción "Cambiar contraseña".
- **Ruta `/cambiar-password`:** `RequireAuth` lleva allí mientras `debeCambiarPassword` sea verdadero.
- **Móvil:** si el login trae `debeCambiarPassword`, muestra "Cambie su contraseña en la web antes de usar la app".

## 4. Hito 2: corregir y anular

### Estados

- **Campaña:** agrega `CANCELADA` y `PERDIDA`. `Campana.estaCerrada()` reemplaza a `estaFinalizada()` en labores, consumos y bitácora; incluye `FINALIZADA`, `CANCELADA` y `PERDIDA`.
- **Labor:** agrega `ASIGNADA` y `CANCELADA` (RN-03 del Banco: planificada, asignada, en ejecución, completada o cancelada). `EN_CURSO` es "en ejecución" y `EJECUTADA` es "completada". Asignar un operario pasa `PLANIFICADA` a `ASIGNADA`; en otro estado no lo cambia. `iniciar` acepta `PLANIFICADA` y `ASIGNADA`.
- **Incidencia:** agrega `ANULADA`.
- `existeAbiertaEnParcela` considera abiertas solo `PLANIFICADA` y `EN_CURSO`.

### Campañas

| Acción | Desde | Resultado |
|---|---|---|
| `PUT /api/campanas/{id}` (`cultivoId`, `fechaInicio`) | `PLANIFICADA` | Corrige el plan |
| `POST /{id}/finalizar` (`fechaFin`) | `EN_CURSO` | `FINALIZADA` y labores pendientes canceladas |
| `POST /{id}/cancelar` (`motivo`) | `PLANIFICADA` | `CANCELADA` y labores pendientes canceladas |
| `POST /{id}/marcar-perdida` (`motivo`, `fechaFin`) | `EN_CURSO` | `PERDIDA` y labores pendientes canceladas |
| `POST /{id}/reabrir` (`motivo`) | `FINALIZADA`, `PERDIDA` | `EN_CURSO`; limpia fecha de fin y motivo, que quedan en la auditoría del cierre; rechaza si la parcela tiene otra campaña abierta |

- **Cambio de regla:** hoy `finalizar` acepta una campaña planificada; desde ahora se cancela.
- **Cambio de regla:** finalizar también cancela las labores pendientes. De otro modo quedarían abiertas en una campaña cerrada, sin ninguna acción posible.
- Las labores canceladas no vuelven al reabrir: se planifican de nuevo.

### Labores y cultivos

| Acción | Desde | Resultado |
|---|---|---|
| `PUT /api/labores/{id}` (`tipo`, `fechaPlan`) | `PLANIFICADA`, `ASIGNADA` | Corrige el plan |
| `POST /api/labores/{id}/cancelar` (`motivo`) | `PLANIFICADA`, `ASIGNADA`, `EN_CURSO` | `CANCELADA` |
| `POST /api/labores/{id}/reabrir` (`motivo`) | `EJECUTADA` | `EN_CURSO`; limpia la fecha de ejecución, que queda en la auditoría |
| `PUT /api/cultivos/{id}` (`nombre`, `cicloDias`) | | Nombre único |

- Todas exigen campaña abierta, salvo la edición de cultivos.
- `ejecutar`, `asignar` y `registrarConsumo` rechazan labores canceladas.

### Hechos

| Registro | Ruta | Efecto |
|---|---|---|
| Cosecha | `POST /api/cosechas/{id}/anular` | Sale de los totales |
| Consumo | `POST /api/labores/{laborId}/consumos/{id}/anular` | Devuelve el stock con una entrada compensatoria |
| Movimiento | `POST /api/insumos/{id}/movimientos/{movId}/anular` | Crea el movimiento inverso |
| Incidencia | `POST /api/incidencias/{id}/anular` | Pasa a `ANULADA`, desde `ABIERTA` o `EN_ATENCION` |
| Ajuste | `POST /api/insumos/{id}/ajustes` (`stockContado`, `motivo`) | Registra la diferencia |

- Toda anulación exige `motivo` (máximo 200 caracteres). Anular dos veces responde 409.
- Los anulados siguen en los listados y se muestran tachados.
- Anular no depende del estado de la campaña. Volver a cargar un consumo en una campaña cerrada exige reabrirla.
- `POST /api/cosechas` acepta `fecha` opcional: no futura ni anterior al inicio de la campaña. Sin ella, usa hoy.
- `POST /api/cosechas` solo acepta campañas `EN_CURSO` (RN-06: campaña activa/finalizable). Hoy acepta también `FINALIZADA`: una cosecha tardía exige reabrir la campaña. **Cambio de regla.**

### Movimientos de stock

- `origen` admite `MANUAL`, `CONSUMO`, `ANULACION` y `AJUSTE`.
- Solo `MANUAL` y `AJUSTE` se anulan directamente. Un movimiento `CONSUMO` se anula por su consumo. Una `ANULACION` no se anula.
- `registrarConsumo` guarda primero el consumo y luego el movimiento con `id_consumo`.
- Anular un consumo marca también su salida como anulada y crea la entrada inversa con `id_movimiento_anulado`.
- Si un consumo antiguo no tiene movimiento enlazado, anularlo responde 409.
- Si la reversión dejara stock negativo, responde 409 con el mensaje de stock insuficiente.
- `stockContado` admite 0 o más, con 2 decimales. Si es igual al stock actual, responde 409.
- Las salidas del período excluyen anulados y los orígenes `ANULACION` y `AJUSTE`.

**Regla comprobada:** `stock_actual` es igual a entradas menos salidas, contando todos los movimientos, también los anulados y sus inversos.

Hoy tres insumos de la demo no la cumplen (semilla 850, urea 60, glifosato 15,50) porque V2 cargó su stock sin movimientos. V9 inserta un movimiento `AJUSTE` llamado "Saldo inicial" por la diferencia de cada insumo descuadrado, con el primer administrador como usuario.

### Datos (V9)

- `campana`: `motivo_cierre varchar(200)`; `campana_estado_check` con los estados nuevos.
- `labor`: `motivo_cancelacion varchar(200)`; `labor_estado_check` con `ASIGNADA` y `CANCELADA`. Las labores `PLANIFICADA` con asignaciones pasan a `ASIGNADA`.
- `cosecha`, `consumo_labor`, `movimiento_insumo`: `anulado boolean NOT NULL DEFAULT false`, `motivo_anulacion varchar(200)`, `anulado_por` (FK a `usuario`), `anulado_en timestamp`, con CHECK de que un anulado tiene los tres datos.
- `movimiento_insumo`: `origen varchar(10) NOT NULL DEFAULT 'MANUAL'` con CHECK, `id_consumo` (FK) e `id_movimiento_anulado` (FK).
- `incidencia`: `motivo_anulacion`, `anulado_por`, `anulado_en`; `incidencia_estado_check` con `ANULADA`.
- **Datos existentes:**
  - Movimientos con motivo `Consumo en labor N (...)` pasan a `origen = 'CONSUMO'` y se enlazan con su consumo por labor, insumo y cantidad, en orden.
  - Labores pendientes de campañas finalizadas pasan a `CANCELADA` con motivo "Campaña finalizada".
  - Se inserta el "Saldo inicial".

### Permisos

| Acción | Roles |
|---|---|
| Labores, campañas y cultivos | Administrador, jefe de campo |
| Cosechas | Administrador, jefe de campo, almacenero |
| Consumos | Administrador, jefe de campo |
| Movimientos y ajustes | Administrador, almacenero |
| Incidencias | Administrador, jefe de campo, supervisor |

La mayoría ya queda cubierta por las reglas actuales de `SecurityConfig`. `POST /api/incidencias/*/anular` debe unirse a la regla de `atender` y `resolver`; si no, el operario podría anular. Todas las operaciones de escritura llevan `@Auditable`.

### Resúmenes y clientes

- `AvanceCampanaService`: excluye cosechas y consumos anulados, labores canceladas e incidencias anuladas, tanto de los totales como de los porcentajes.
- **Web:** nuevos ayudantes `campanaAbierta`, `laborPendiente` e `incidenciaAbierta` reemplazan las comparaciones sueltas en `DashboardPage`, `LaborForm`, `CampanaForm`, `CosechaForm`, `CampanaTable`, `LaborTable`, `LaboresPage` e `IncidenciasPage`.
- **Web:** `StatusBadge` agrega los estados nuevos. Un componente `MotivoDialog` pide el motivo. `permisos.ts` agrega las acciones nuevas. `CosechaForm` agrega la fecha.
- **Web:** se agregan acciones en `CampanaTable`, `LaborTable`, `CultivosPage`, `CosechasPage`, `ConsumosPanel`, `MovimientosPanel`, `InsumosPage` e `IncidenciasPage`.
- **Móvil:** tipos nuevos; un estado desconocido usa un ícono y texto de respaldo, sin cerrar la app. `detalleParcela` excluye cosechas anuladas, labores canceladas e incidencias anuladas. El historial muestra campañas finalizadas y perdidas.

## 5. Hito 3: datos veraces

### Unidades

- `UnidadCosecha` define `t` (1), `kg` (0,001) y `qq` (0,046). Un quintal son 46 kg.
- `POST /api/cosechas` responde 400 con otra unidad.
- `CosechaResponse` agrega `toneladas`, calculadas sin redondear. `AvanceCampana` agrega `cosechaToneladas`.
- El rendimiento, el inicio web, `CosechasPage` y el móvil usan esas toneladas.
- `cliente.ts` deja de convertir unidades.

### Hora

- La imagen final del `Dockerfile` usa `ENV TZ=America/La_Paz`.
- `hibernate.jdbc.time_zone=UTC` se mantiene: la base sigue guardando UTC.
- Los registros existentes se leerán 4 horas antes de lo que muestran hoy, que es su hora real en Bolivia.
- Una prueba con la JVM en `America/La_Paz` confirma que un `LocalDateTime` vuelve igual y que un `LocalDate` no cambia de día. Si un `LocalDate` se corre, se corrige antes de cerrar el hito.

### Estado de parcela

- `iniciar`: rechaza si la parcela está `EN_DESCANSO`; deja `EN_PRODUCCION`.
- `finalizar` y `marcar-perdida`: dejan `DISPONIBLE`.
- `reabrir`: rechaza si la parcela está `EN_DESCANSO`; deja `EN_PRODUCCION`.
- `cancelar` no toca la parcela: una campaña planificada no la ocupó.
- `ParcelaService.actualizar`:
  - Mandar el mismo estado es válido.
  - Pedir `EN_PRODUCCION` a mano responde 409.
  - Cualquier cambio con campaña `EN_CURSO` responde 409.
- `ParcelaForm` ofrece Disponible y En descanso. Si la parcela está en producción, lo muestra como dato fijo.
- **Móvil:** adopta `EN_PRODUCCION` con la etiqueta "Sembrada" en modelo, `ESTADO_VISUAL`, `SIN_SIEMBRA`, `ResumenCampo`, `PredioDetalle`, `App.tsx` y `demoData`.

### Datos (V10)

- `cosecha.unidad_medida`: minúsculas y sin espacios; `ton`, `tn`, `tonelada`, `toneladas` pasan a `t`; `kilo`, `kilos`, `kilogramo`, `kilogramos` a `kg`; `quintal`, `quintales` a `qq`.
- Agrega `cosecha_unidad_check`. Si queda otra unidad, la migración falla y se corrige a mano: no hay forma segura de convertirla. La base de demo solo usa `t`.
- Parcelas con campaña `EN_CURSO` pasan a `EN_PRODUCCION`.
- Parcelas `EN_PRODUCCION` sin campaña en curso pasan a `DISPONIBLE`.

### Inicio

- **Web:**
  - Las labores pendientes con plan anterior a hoy se marcan "Atrasada · N días".
  - El indicador nuevo "Siembras atrasadas" cuenta las campañas planificadas con inicio vencido, para administrador, jefe y supervisor.
  - "Insumos con menos stock" pasa a "Por reponer": `porAgotarse` o stock 0, ordenados por `stockActual / stockMinimo`. Sin mínimo, la proporción cuenta como 0.
  - Las comparaciones usan `hoyISO()`, que respeta la fecha local.
- **Móvil:**
  - `ParcelaDetalle` marca las labores atrasadas.
  - `CampanaProgreso` muestra "Siembra atrasada".
  - "Por reponer" no aplica: el móvil no carga insumos.

## 6. Forma de trabajo

1. Dos commits locales en `feat/movil-api`, sin push: los íconos del móvil y los documentos corregidos.
2. Worktree en `~/Proyectos/AgroControl-base`, rama `feat/base-confiable`.
3. En esa copia:
   - `compose.yaml` admite `AGROCONTROL_DB_PORT` y `AGROCONTROL_APP_PORT`, con 5433 y 8080 por defecto.
   - `.env` ignorado: proyecto `agrocontrol-base`, API 8090, base 5434.
   - Vite usa 5174 y Metro 8082.
4. Commit de esta especificación en `docs/superpowers/specs/2026-10-31-base-confiable-design.md`.
5. Un commit por paso, con la prueba antes del código en el backend.

La rama no se integra hasta después de la defensa.

## 7. Pruebas

**Backend, por hito:** dominio, servicios y `@WebMvcTest` con `SecurityConfig` real. Las pruebas `@WebMvcTest` simulan `AuthService` para el filtro. Una prueba nueva recorre la matriz de permisos.

**PostgreSQL real con Testcontainers:**
- **Producción vacía:** 5 roles, un administrador con cambio obligatorio, sin predios; bloqueado hasta cambiar la clave; sin variables falla al arrancar.
- **Demo intacta:** `flyway_schema_history` conserva estos checksums, y `agro123` entra.

| Versión | Checksum |
|---|---|
| 1 | -388528007 |
| 2 | 2077967464 |
| 3 | -782014172 |
| 4 | -864860771 |
| 5 | 511590160 |
| 6 | -485339245 |
| 7 | 1460094948 |

- **Actualización:** base en V7 con datos antiguos, migrada a la última versión. Comprueba enlace de consumos, saldo inicial, unidades, parcelas y labores huérfanas.
- **Stock:** secuencia de entrada, salida, consumo, ajuste y anulaciones; la regla se cumple en todos los insumos.
- **Hora:** la prueba de la sección 5.
- `PersistenciaPostgresTest` actualiza la versión esperada a 10.

**Web:** Vitest para los ayudantes de estado, atrasos, "Por reponer", permisos y `StatusBadge`. `npm run test:run`, `npm run lint` y `npm run build`. Recorrido con Playwright.

**Móvil:** `npx tsc --noEmit`, `npx expo lint` y emulador contra la API de la copia, incluidos `EN_PRODUCCION`, `CANCELADA` y `ANULADA`. La rama agrega eslint, que el móvil hoy no tiene, porque `AGENTS.md` pide lint.

**Recorrido final en producción limpia:** primer ingreso, cambio de clave, alta de un usuario, restablecer, predio, parcela, campaña, inicio, consumo, anulación, ajuste, cosecha en qq, pérdida y reapertura.

## 8. Documentación

- Actualizar README, `requests.http` y la colección de Postman.
- Registrar ADR en `docs/03-decisions/` (RNF-13 y Parte III del Banco piden al menos dos): instalación por perfiles, corregir anulando sin borrar, quintal de 46 kg, estados agregados a campaña e incidencia.
- Actualizar `docs/02-requirements/backlog-v0.1.md`, `model-relational-v0.1.md` y `docs/01-vision/glossary-v0.1.md`: la documentación debe coincidir con el sistema.
- Agregar al README la instalación en producción y sus variables.
- No tocar `docs/06-defensa` ni `docs/02-requirements/matriz-rf-rn-parcial1.md`.
