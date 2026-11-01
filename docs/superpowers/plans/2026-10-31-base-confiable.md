# AgroControl: Parte 1, base confiable. Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar AgroControl instalable en vacío para una empresa, con cuentas administrables, errores corregibles sin perder historial y números correctos en web y móvil.

**Architecture:** Hexagonal por módulo, como el código actual: dominio con reglas, servicio con `@Auditable`, controlador con DTO, adaptador JPA. Tres hitos en orden, cada uno con su migración (V8, V9, V10) y su recorrido de punta a punta. Demo y producción comparten `db/migration` y difieren en `db/demo` y `db/produccion`.

**Tech Stack:** Java 21, Spring Boot 3.3.4, Spring Security, Flyway, PostgreSQL 17, Testcontainers 1.21.4, React + TypeScript + Vite, Vitest, Expo SDK 58.

**Spec:** `docs/superpowers/specs/2026-10-31-base-confiable-design.md` (copia de `~/Documentos/Chats-Cerebro/Borradores/2026-10-31-agrocontrol-base-confiable.md`, que la Tarea 0 agrega a la rama).

## Global Constraints

- Rama `feat/base-confiable` en `~/Proyectos/AgroControl-base`. Sin push. `feat/movil-api` no recibe este trabajo.
- No tocar `docs/06-defensa` ni `docs/02-requirements/matriz-rf-rn-parcial1.md`.
- Checksums que no pueden cambiar: V1 `-388528007`, V2 `2077967464`, V3 `-782014172`, V4 `-864860771`, V5 `511590160`, V6 `-485339245`, V7 `1460094948`.
- Contraseñas de 8 a 72 caracteres. Clave temporal de 12 caracteres con `SecureRandom`.
- Motivos obligatorios, máximo 200 caracteres. El motivo de un ajuste, máximo 150, por la columna `movimiento_insumo.motivo`.
- Un quintal son 46 kg: `qq` = 0,046 t.
- Imagen en `America/La_Paz`; `hibernate.jdbc.time_zone=UTC` se mantiene.
- Puertos: copia con API 8090, base 5434, Vite 5174 y Metro 8082; producción de prueba con API 8091 y base 5435.
- Errores: `ConflictoException` e `IllegalStateException` dan 409; `IllegalArgumentException` da 400; `RecursoNoEncontradoException` da 404.
- Toda escritura nueva lleva `@Auditable`. Un caso de uso con contraseñas recibe un objeto, nunca `String` sueltos.
- Nombres, mensajes y comentarios en español, con la densidad del código vecino.
- Móvil: dependencias con `npx expo install`; consultar `https://docs.expo.dev/versions/v58.0.0/`.
- Mensajes de commit `tipo(alcance): resumen`, terminados en:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Uim1jjxEngPbe3rVgLmUo8
  ```

**Comandos:**
- Backend, parcial: `cd backend && ./mvnw -B test -Dtest='Clase1,Clase2'`. Completo: `./mvnw -B test`.
- Web, parcial: `cd frontend && npm run test:run -- <archivo>`. Completo: `npm run lint && npm run test:run && npm run build`.
- Móvil: `cd agrocontrol-mobile && npx tsc --noEmit && npx expo lint`.

**Cada tarea de código sigue este ciclo:** escribir las pruebas, ver que fallan por la razón esperada, implementar, ver que pasan, commit. Los pasos solo indican lo propio de cada tarea.

## Review Focus

1. **Doble clic o reintento al anular:** dos anulaciones simultáneas del mismo consumo o movimiento devuelven el stock una sola vez.
2. **Editar un usuario sin cambiar su email, o cambiando solo mayúsculas:** guarda sin 409.
3. **Sesiones anteriores a la actualización:** un token sin `ver` y un `localStorage` sin `debeCambiarPassword` siguen entrando.
4. **Cancelar una labor o perder una campaña con consumos ya cargados:** consumos y stock no cambian, y el diálogo lo avisa.
5. **Dos consumos idénticos en la misma labor antes de V9:** cada salida queda enlazada a un consumo distinto, y anular uno devuelve solo su cantidad.

---

## Preparación

### Tarea 0: Copia de trabajo

**Files:**
- Create: `docs/superpowers/specs/2026-10-31-base-confiable-design.md`, `docs/superpowers/plans/2026-10-31-base-confiable.md`, `.env`
- Modify: `compose.yaml`

- [ ] **Paso 1: Crear el worktree** siguiendo `superpowers:using-git-worktrees`: `git worktree add ~/Proyectos/AgroControl-base -b feat/base-confiable feat/movil-api`. Esperado: HEAD `efc4b9d`.
- [ ] **Paso 2: Copiar** la especificación y este plan a sus rutas de `docs/superpowers/`.
- [ ] **Paso 3: Parametrizar `compose.yaml`:**
  ```yaml
  # db.ports
  - "${AGROCONTROL_DB_PORT:-5433}:5432"
  # app.ports
  - "${AGROCONTROL_APP_PORT:-8080}:8080"
  # app.environment
  SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-}
  AGROCONTROL_JWT_SECRET: ${AGROCONTROL_JWT_SECRET:-agrocontrol-docker-clave-de-desarrollo-cambiar}
  AGROCONTROL_ADMIN_EMAIL: ${AGROCONTROL_ADMIN_EMAIL:-}
  AGROCONTROL_ADMIN_PASSWORD: ${AGROCONTROL_ADMIN_PASSWORD:-}
  ```
- [ ] **Paso 4: Crear `.env`** (ignorado): `COMPOSE_PROJECT_NAME=agrocontrol-base`, `AGROCONTROL_DB_PORT=5434`, `AGROCONTROL_APP_PORT=8090`.
- [ ] **Paso 5: Medir la base:** `./mvnw -B test`; en web, `npm ci` y el comando completo; en móvil, `npm ci && npx tsc --noEmit`. Esperado: todo pasa. Anotar los conteos.
- [ ] **Paso 6: Commit** `docs(base-confiable): especificación, plan y puertos configurables`.

---

## Hito 1: cuentas e instalación limpia

### Tarea 1: Migraciones por perfil

**Files:**
- Move: `V2__seed_core.sql`, `V3__usuarios_login.sql`, `V7__combustibles_y_repuestos.sql` de `backend/src/main/resources/db/migration/` a `db/demo/` con `git mv`
- Create: `db/produccion/V2__roles.sql`, `db/produccion/V7__categorias_insumo.sql`, `application-produccion.properties`
- Modify: `application.properties`
- Test: `backend/src/test/java/com/agrocontrol/integracion/MigracionesTest.java`, `integracion/PersistenciaPostgresTest.java`

**Interfaces:**
- Produces: propiedad `agrocontrol.demo`; `MigracionesTest` con base propia por prueba (`CREATE DATABASE`) y Flyway sin Spring, que usan las Tareas 11 y 23.

- [ ] **Paso 1: Pruebas**
  ```java
  void demoConservaLosChecksumsDeV1aV7()
  // Flyway con db/migration y db/demo, target "7"; flyway_schema_history tiene los 7 checksums de Global Constraints.
  void produccionQuedaVacia()
  // Flyway con db/migration y db/produccion; rol = 5; usuario, predio, parcela, cultivo e insumo = 0;
  // insumo tiene las columnas categoria y stock_minimo.
  void elUsuarioDeDemoEntraConAgro123()
  // PersistenciaPostgresTest: authService.iniciarSesion("sergio@agrocontrol.com", "agro123").rol() = "ADMINISTRADOR".
  ```
- [ ] **Paso 2: Implementar.** `V2__roles.sql` lleva los 5 `INSERT` de roles de V2. `V7__categorias_insumo.sql` lleva solo los `ALTER TABLE` y los dos `CREATE INDEX` de V7.
- [ ] **Paso 3: Propiedades.** En `application.properties`: `spring.flyway.locations=classpath:db/migration,classpath:db/demo` y `agrocontrol.demo=true`. En `application-produccion.properties`:
  ```properties
  spring.flyway.locations=classpath:db/migration,classpath:db/produccion
  spring.jpa.show-sql=false
  agrocontrol.demo=false
  agrocontrol.jwt.secret=${AGROCONTROL_JWT_SECRET}
  ```
- [ ] **Paso 4: Verificar:** `MigracionesTest,PersistenciaPostgresTest` pasan y `git diff --stat -M` muestra los tres archivos como renombrados al 100 %.
- [ ] **Paso 5: Commit** `feat(instalacion): migraciones separadas para demo y producción`.

### Tarea 2: Usuario con versión de token y clave pendiente

**Files:**
- Create: `db/migration/V8__cuentas.sql`
- Modify: `Usuario.java`, `UsuarioJpaEntity.java`, `UsuarioPersistenceMapper.java`, `JwtGeneradorToken.java`, `UsuarioAutenticado.java`, `SesionResponse.java`, `UsuarioResponse.java`
- Test: `usuario/domain/UsuarioTest.java`, `integracion/PersistenciaPostgresTest.java`

**Interfaces:**
- Produces en `Usuario`:
  ```java
  Usuario(Long id, String nombreCompleto, String email, String passwordHash, Long rolId, boolean activo,
          LocalDateTime creadoEn, int tokenVersion, boolean debeCambiarPassword)
  void actualizarDatos(String nombreCompleto, String email, Long rolId) // sube la versión si cambia el rol
  void cambiarPassword(String nuevoHash)      // limpia la obligación y sube la versión
  void restablecerPassword(String hashTemporal) // activa la obligación y sube la versión
  void exigirCambioPassword()
  int getTokenVersion()
  boolean isDebeCambiarPassword()
  ```
- Produces: `UsuarioAutenticado.version(Jwt): int`, que devuelve 0 sin claim `ver`. Los constructores actuales se conservan, con versión 0 y sin obligación.

- [ ] **Paso 1: Pruebas**
  ```java
  void cambiarPasswordLimpiaLaObligacionYSubeLaVersion()
  // restablecerPassword("h1"): debe = true, versión 1; cambiarPassword("h2"): debe = false, versión 2, hash "h2".
  void actualizarDatosSubeLaVersionSoloSiCambiaElRol() // mismo rol: 0; otro rol: 1
  void actualizarDatosValidaComoElConstructor() // nombre vacío o email sin @: IllegalArgumentException
  void elUsuarioGuardaVersionYClavePendiente() // PersistenciaPostgresTest: ida y vuelta por la base
  ```
- [ ] **Paso 2: Implementar.** V8 agrega `token_version integer NOT NULL DEFAULT 0` y `debe_cambiar_password boolean NOT NULL DEFAULT false`. El JWT agrega `.claim("ver", usuario.getTokenVersion())`. `SesionResponse` y `UsuarioResponse` agregan `boolean debeCambiarPassword`. `PersistenciaPostgresTest` espera versión 8.
- [ ] **Paso 3: Commit** `feat(cuentas): versión de token y clave pendiente en el usuario`.

### Tarea 3: Cambiar contraseña

**Files:**
- Create: `auth/application/command/CambiarPasswordCommand.java`, `auth/infrastructure/adapter/in/web/dto/CambiarPasswordRequest.java`
- Modify: `AuthService.java`, `AuthController.java`
- Test: `auth/application/AuthServiceTest.java`, `integracion/PersistenciaPostgresTest.java`

**Interfaces:**
- Produces: `record CambiarPasswordCommand(String passwordActual, String passwordNueva)`.
- Produces: `@Auditable(entidad = "USUARIO", accion = "CAMBIAR_PASSWORD") Sesion AuthService.cambiarPassword(Long usuarioId, CambiarPasswordCommand command)`.
- Produces: `POST /api/auth/cambiar-password`, que devuelve `SesionResponse` con token nuevo.

- [ ] **Paso 1: Pruebas**
  ```java
  void cambiarPasswordExigeLaClaveActual()      // actual incorrecta: IllegalArgumentException, sin guardar
  void cambiarPasswordRechazaLaMismaClave()     // nueva igual a la actual: IllegalArgumentException
  void cambiarPasswordDevuelveSesionNueva()     // guarda el hash nuevo y genera token con el usuario actualizado
  void laClaveNoApareceEnLaAuditoria()          // PersistenciaPostgresTest: el detalle de CAMBIAR_PASSWORD
                                                // no contiene "ClaveActual1" ni "ClaveNueva2"
  ```
- [ ] **Paso 2: Implementar.** La clave actual incorrecta da 400, no 401: `apiClient` cierra la sesión con cualquier 401. El request usa `@NotBlank` y `@Size(min = 8, max = 72)` en `passwordNueva`.
- [ ] **Paso 3: Commit** `feat(cuentas): cambiar contraseña`.

### Tarea 4: Bloquear cuentas en cada petición

**Files:**
- Create: `auth/application/EstadoCuenta.java`, `auth/infrastructure/security/EstadoCuentaFilter.java`
- Modify: `AuthService.java`, `SecurityConfig.java`, `ParcelaControllerTest.java`
- Test: `auth/infrastructure/security/EstadoCuentaFilterTest.java`

**Interfaces:**
- Consumes: `UsuarioAutenticado.version(Jwt)` de la Tarea 2.
- Produces: `record EstadoCuenta(boolean activo, int tokenVersion, boolean debeCambiarPassword)` y `Optional<EstadoCuenta> AuthService.estadoCuenta(Long usuarioId)`, de solo lectura.
- Produces: `EstadoCuentaFilter(AuthService authService, EscritorProblema escritor)`, con `interface EscritorProblema { void escribir(HttpServletResponse respuesta, HttpStatus estado, String detalle) throws IOException; }`.

- [ ] **Paso 1: Pruebas** con `@WebMvcTest(AuthController.class)`, `@Import(SecurityConfig.class)`, `@MockBean AuthService` y `@MockBean RolRepository`:
  ```java
  void usuarioInexistenteDevuelve401()
  void usuarioInactivoDevuelve401()
  void tokenConVersionViejaDevuelve401()
  void tokenSinVerCuentaComoVersionCero()     // estadoCuenta con versión 0: pasa
  void clavePendienteBloqueaConMensaje403()   // GET /api/predios: detail "Debe cambiar su contraseña antes de continuar"
  void clavePendientePermiteMeYCambiar()      // GET /api/auth/me y POST /api/auth/cambiar-password no dan 403
  void sinTokenNoConsultaLaCuenta()           // verify(authService, never()).estadoCuenta(any())
  ```
- [ ] **Paso 2: Implementar.** `securityFilterChain(HttpSecurity http, AuthService authService)` hace `http.addFilterAfter(new EstadoCuentaFilter(authService, this::escribirProblema), BearerTokenAuthenticationFilter.class)`. El filtro se crea con `new`, no como bean: un bean `Filter` se registraría también fuera de la cadena, y `AuthService` en el constructor de `SecurityConfig` crearía un ciclo con `JwtEncoder`.
- [ ] **Paso 3: Ajustar `ParcelaControllerTest`:** `@MockBean AuthService`, `como()` agrega `.jwt(j -> j.subject("1"))` y un `@BeforeEach` devuelve `new EstadoCuenta(true, 0, false)`.
- [ ] **Paso 4: Commit** `feat(cuentas): revisar el estado de la cuenta en cada petición`.

### Tarea 5: Gestión de usuarios

**Files:**
- Create: `usuario/application/command/ActualizarUsuarioCommand.java`, `usuario/application/ClaveTemporal.java`, `usuario/infrastructure/adapter/in/web/dto/ActualizarUsuarioRequest.java`, `.../dto/ClaveTemporalResponse.java`
- Modify: `UsuarioService.java`, `UsuarioController.java`, `UsuarioRepository.java`, `UsuarioPersistenceAdapter.java`, `UsuarioJpaRepository.java`
- Test: `usuario/application/UsuarioServiceTest.java`, `usuario/infrastructure/adapter/in/web/UsuarioControllerTest.java`

**Interfaces:**
- Produces en `UsuarioRepository`: `boolean existeEmailEnOtroUsuario(String email, Long idExcluido)`, `long contarAdministradoresActivos()`.
- Produces en `UsuarioService`:
  ```java
  @Auditable(entidad = "USUARIO", accion = "ACTUALIZAR")           Usuario actualizar(Long id, ActualizarUsuarioCommand command)
  @Auditable(entidad = "USUARIO", accion = "DESACTIVAR")           Usuario desactivar(Long id, Long actorId)
  @Auditable(entidad = "USUARIO", accion = "ACTIVAR")              Usuario activar(Long id)
  @Auditable(entidad = "USUARIO", accion = "RESTABLECER_PASSWORD") ClaveTemporal restablecerPassword(Long id)
  ```
- Produces: `record ActualizarUsuarioCommand(Long rolId, String nombreCompleto, String email)`, `record ClaveTemporal(String password)`, JSON `{ "passwordTemporal": "..." }`.

- [ ] **Paso 1: Pruebas**
  ```java
  void actualizarConSuMismoEmailNoEsDuplicado()   // mismo email y solo cambio de mayúsculas: guarda
  void actualizarConEmailDeOtroEsDuplicado()      // EmailUsuarioDuplicadoException
  void actualizarConRolInexistenteDa404()         // RolNoEncontradoException
  void noPuedeDesactivarseASiMismo()              // id = actorId: ConflictoException
  void noSeDesactivaAlUltimoAdministrador()       // contarAdministradoresActivos = 1: ConflictoException
  void noSeLeQuitaElRolAlUltimoAdministrador()    // actualizar a otro rol con 1 activo: ConflictoException
  void restablecerGeneraDoceCaracteresYObligaACambiar()
  // password.length() == 12; se guarda codificada; debeCambiarPassword = true; versión + 1.
  void restablecerRespondeNoStore()               // UsuarioControllerTest: Cache-Control contiene no-store
  ```
- [ ] **Paso 2: Implementar.** `contarAdministradoresActivos` usa `countByActivoTrueAndRol_Nombre(Roles.ADMINISTRADOR)`. La temporal usa `SecureRandom` con `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789`. `desactivar` toma `actorId` de `UsuarioAutenticado.id(jwt)`.
- [ ] **Paso 3: Commit** `feat(cuentas): editar, desactivar y restablecer usuarios`.

### Tarea 6: Primer administrador e indicador de demo

**Files:**
- Create: `usuario/infrastructure/config/PrimerAdministrador.java`
- Modify: `shared/web/HealthController.java`
- Test: `usuario/infrastructure/config/PrimerAdministradorTest.java`, `integracion/InstalacionProduccionTest.java`

**Interfaces:**
- Produces: `@Component @Profile("produccion") PrimerAdministrador implements ApplicationRunner`, con `@Value("${AGROCONTROL_ADMIN_EMAIL:}")` y `@Value("${AGROCONTROL_ADMIN_PASSWORD:}")`.
- Produces: `GET /api/health` agrega `demo`, leído de `agrocontrol.demo`.

- [ ] **Paso 1: Pruebas**
  ```java
  void sinVariablesFallaElArranque()       // PrimerAdministradorTest: IllegalStateException
  void claveCortaFallaElArranque()         // 7 caracteres: IllegalStateException
  void conUsuariosNoHaceNada()             // sin variables tampoco falla
  void creaAlAdministradorConCambioObligatorio()
  // InstalacionProduccionTest: RANDOM_PORT, perfil produccion, Testcontainers, secreto y admin por properties.
  void arrancaVaciaConUnAdministrador()    // 5 roles, 1 usuario, 0 predios; health.demo = false
  void elAdministradorQuedaBloqueadoHastaCambiarLaClave()
  // login: debeCambiarPassword true; GET /api/predios 403; cambiar-password 200; con el token nuevo, 200 y [].
  void sinSecretoNoArranca()
  // SpringApplicationBuilder con perfil produccion y base del contenedor, sin AGROCONTROL_JWT_SECRET:
  // la excepción contiene "AGROCONTROL_JWT_SECRET" en su traza.
  ```
- [ ] **Paso 2: Implementar.** Busca el rol con `rolRepository.listarTodos()` por `Roles.ADMINISTRADOR` y crea al usuario llamado "Administrador". No usa `@Auditable`: no hay sesión.
- [ ] **Paso 3: Commit** `feat(instalacion): primer administrador e indicador de demo`.

### Tarea 7: Web, cuenta propia

**Files:**
- Create: `features/auth/components/CambiarPasswordForm.tsx`, `features/auth/pages/CambiarPasswordPage.tsx`
- Modify: `features/auth/models/Sesion.ts`, `services/authService.ts`, `context/AuthContext.tsx`, `context/useAuth.ts`, `components/RequireAuth.tsx`, `pages/LoginPage.tsx`, `routes/AppRouter.tsx`, `components/common/Header.tsx`
- Test: `features/auth/__tests__/RequireAuth.test.tsx`, `features/auth/__tests__/LoginPage.test.tsx`

**Interfaces:**
- Produces: `Sesion.debeCambiarPassword?: boolean`. Es opcional porque `localStorage` puede guardar sesiones anteriores.
- Produces: `authService.cambiarPassword(passwordActual: string, passwordNueva: string): Promise<Sesion>` y `authService.demo(signal?: AbortSignal): Promise<boolean>`.
- Produces: `actualizarSesion(sesion: Sesion): void` en `AuthContextValue`.
- Produces: `<CambiarPasswordForm onListo={() => void} onCancelar?={() => void} />`.

- [ ] **Paso 1: Pruebas**
  ```ts
  it('lleva a /cambiar-password si la clave está pendiente')
  it('una sesión antigua sin el campo entra normal')
  it('no redirige en bucle dentro de /cambiar-password')
  it('muestra los usuarios de prueba solo si health.demo es true')
  it('oculta los usuarios de prueba si health falla')
  ```
- [ ] **Paso 2: Implementar.** La ruta `cambiar-password` va dentro de `RequireAuth` y fuera de `MainLayout`. El encabezado abre el formulario en un `Modal`. `LoginPage` usa `useCarga` con valor inicial `false`.
- [ ] **Paso 3: Commit** `feat(web): cambio de contraseña y usuarios de prueba solo en demo`.

### Tarea 8: Web, administración de usuarios

**Files:**
- Create: `features/usuarios/components/ClaveTemporalDialog.tsx`
- Modify: `features/usuarios/pages/UsuariosPage.tsx`, `components/UsuarioForm.tsx`, `services/usuarioService.ts`, `models/Usuario.ts`, `components/ui/ConfirmDialog.tsx`
- Test: `features/usuarios/__tests__/ClaveTemporalDialog.test.tsx`

**Interfaces:**
- Produces en `usuarioService`: `actualizar(id, { rolId, nombreCompleto, email })`, `desactivar(id)`, `activar(id)`, `restablecer(id): Promise<{ passwordTemporal: string }>`.
- Produces: `UsuarioForm` con `usuario?: Usuario`, `onGuardado`, `onCerrar?`, como `InsumoForm`. `ConfirmDialog` con `loadingLabel` opcional.

- [ ] **Paso 1: Prueba** `it('muestra la clave una sola vez y avisa que no se volverá a ver')`.
- [ ] **Paso 2: Implementar.** Los botones de la tabla son Editar, Desactivar o Activar, y Restablecer clave. La fila de la cuenta propia no ofrece Desactivar. El formulario oculta el campo de contraseña al editar.
- [ ] **Paso 3: Commit** `feat(web): administrar usuarios`.

### Tarea 9: Móvil, aviso de clave y lint

**Files:**
- Create: `agrocontrol-mobile/eslint.config.js`, generado
- Modify: `agrocontrol-mobile/package.json`, `package-lock.json`, `src/api/cliente.ts`, `App.tsx`, `.github/workflows/ci.yml`

- [ ] **Paso 1: Agregar lint** con `npx expo lint`; si la primera corrida solo instala, repetirla. Agregar `- run: npx expo lint` al trabajo `movil` de CI.
- [ ] **Paso 2: Implementar.** `Sesion` agrega `debeCambiarPassword: boolean`. En `entrar`, tras `iniciarSesion`, si es verdadero muestra "Cambie su contraseña en la web antes de usar la app" y no llama a `cargarDatos`.
- [ ] **Paso 3: Verificar** con el comando de móvil. Esperado: 0 errores.
- [ ] **Paso 4: Commit** `feat(movil): avisar el cambio de clave y agregar lint`.

### Tarea 10: Cierre del hito 1

**Files:**
- Modify: `README.md`, `requests.http`
- Create: `.env.produccion.local` (ignorado), requests en `docs/postman/AgroControl API/Cuentas/`

- [ ] **Paso 1: Documentar** la tabla de API, la instalación en producción, sus variables y que requiere base vacía.
- [ ] **Paso 2: Verificar todo:** backend, web y móvil completos pasan.
- [ ] **Paso 3: Demo:** `docker compose up -d --build`; en `http://localhost:8090`, el login muestra usuarios de prueba y `sergio@agrocontrol.com` con `agro123` entra.
- [ ] **Paso 4: Producción de prueba.** `.env.produccion.local` define `COMPOSE_PROJECT_NAME=agrocontrol-prod`, `AGROCONTROL_DB_PORT=5435`, `AGROCONTROL_APP_PORT=8091`, `SPRING_PROFILES_ACTIVE=produccion`, un secreto de 32 caracteres o más, `AGROCONTROL_ADMIN_EMAIL=admin@empresa.test` y `AGROCONTROL_ADMIN_PASSWORD=ClaveInicial1`. Levantar con `docker compose --env-file .env.produccion.local up -d --build`.
- [ ] **Paso 5: Recorrido con Playwright en `http://localhost:8091`:**
  - El login no muestra usuarios de prueba.
  - El primer ingreso obliga a cambiar la clave.
  - Crear un operario, restablecer su clave y entrar con la temporal, que también obliga a cambiarla.
  - Desactivarlo: su sesión abierta vuelve al login.
  - Intentar desactivar al último administrador muestra el rechazo.
- [ ] **Paso 6: Commit** `docs(cuentas): instalación en producción y ejemplos de API`.

---

## Hito 2: corregir y anular

### Tarea 11: Migración V9

**Files:**
- Create: `db/migration/V9__corregir_y_anular.sql`
- Test: `integracion/MigracionesTest.java`, `integracion/PersistenciaPostgresTest.java`

- [ ] **Paso 1: Prueba** `actualizaDesdeV7ConDatosAntiguos()`. Migra demo hasta V7 e inserta dos consumos iguales en una labor con sus dos salidas, y una labor `PLANIFICADA` en una campaña `FINALIZADA`. Luego migra hasta el final y comprueba:
  ```java
  // las dos salidas tienen origen CONSUMO e id_consumo distintos
  // la labor huérfana quedó CANCELADA con motivo "Campaña finalizada"
  // una labor PLANIFICADA con asignación en campaña abierta quedó ASIGNADA
  // "Semilla de soya certificada" tiene un AJUSTE "Saldo inicial" igual a su stock_actual
  // ningún insumo descuadra: stock_actual = entradas - salidas
  ```
- [ ] **Paso 2: Escribir V9** con las columnas y CHECK de la sección "Datos (V9)" de la especificación. Enlaza consumos así:
  ```sql
  WITH m AS (
    SELECT id_movimiento, id_insumo, cantidad, motivo,
           row_number() OVER (PARTITION BY id_insumo, cantidad, motivo ORDER BY id_movimiento) AS n
    FROM agrocontrol.movimiento_insumo WHERE motivo LIKE 'Consumo en labor %'
  ), c AS (
    SELECT c.id_consumo, c.id_insumo, c.cantidad,
           'Consumo en labor ' || l.id_labor || ' (' || l.tipo || ')' AS motivo,
           row_number() OVER (PARTITION BY c.id_labor, c.id_insumo, c.cantidad ORDER BY c.id_consumo) AS n
    FROM agrocontrol.consumo_labor c JOIN agrocontrol.labor l USING (id_labor)
  )
  UPDATE agrocontrol.movimiento_insumo mi SET id_consumo = c.id_consumo
  FROM m JOIN c USING (id_insumo, cantidad, motivo, n)
  WHERE mi.id_movimiento = m.id_movimiento;
  ```
  El "Saldo inicial" usa el `min(id_usuario)` con rol `ADMINISTRADOR` y el tipo según el signo de la diferencia. `PersistenciaPostgresTest` espera versión 9.
- [ ] **Paso 3: Commit** `feat(base): migración para corregir y anular`.

### Tarea 12: Labores

**Files:**
- Create: `shared/web/MotivoRequest.java`, `labor/infrastructure/adapter/in/web/dto/EditarLaborRequest.java`
- Modify: `EstadoLabor.java`, `Labor.java`, `LaborService.java`, `LaborController.java`, `LaborJpaEntity.java`, `LaborPersistenceMapper.java`, `LaborResponse.java`, `EstadoCampana.java`, `Campana.java`, `InventarioService.java`, `BitacoraService.java`
- Test: `labor/domain/LaborTest.java`, `labor/application/LaborServiceTest.java`, `insumo/application/InventarioServiceTest.java`, `bitacora/application/BitacoraServiceTest.java`, `campana/domain/CampanaTest.java`

**Interfaces:**
- Produces: `record MotivoRequest(@NotBlank @Size(max = 200) String motivo)`.
- Produces: `EstadoLabor` agrega `ASIGNADA` y `CANCELADA`.
- Produces en `Labor`: `void reprogramar(String tipo, LocalDate fechaPlan)`, `void marcarAsignada()`, `void cancelar(String motivo)`, `void reabrir()`, `boolean estaPendiente()` (`PLANIFICADA`, `ASIGNADA`, `EN_CURSO`), `String getMotivoCancelacion()`. `iniciar` acepta `PLANIFICADA` y `ASIGNADA`.
- `LaborService.asignar` llama a `marcarAsignada()` y guarda la labor.
- Produces en `Campana`: `boolean estaCerrada()`, que reemplaza a `estaFinalizada()`. `EstadoCampana` agrega `CANCELADA` y `PERDIDA`.
- Produces en `LaborService`:
  ```java
  @Auditable(entidad = "LABOR", accion = "EDITAR")   Labor editar(Long id, String tipo, LocalDate fechaPlan)
  @Auditable(entidad = "LABOR", accion = "CANCELAR") Labor cancelar(Long id, String motivo)
  @Auditable(entidad = "LABOR", accion = "REABRIR")  Labor reabrir(Long id, String motivo)
  ```

- [ ] **Paso 1: Pruebas**
  ```java
  void reprogramarSoloSiEstaPlanificadaOAsignada() // EN_CURSO: IllegalStateException
  void asignarPasaDePlanificadaAAsignada()    // reasignar en ASIGNADA o EN_CURSO no cambia el estado
  void iniciarDesdeAsignada()                 // queda EN_CURSO
  void cancelarDesdePlanificadaAsignadaOEnCurso() // queda CANCELADA con el motivo
  void noSeCancelaUnaLaborEjecutada()         // IllegalStateException
  void cancelarExigeMotivo()                  // vacío: IllegalArgumentException
  void reabrirVuelveAEnCursoYLimpiaLaFecha()  // EJECUTADA: EN_CURSO, fechaEjecucion null
  void noSeEjecutaUnaLaborCancelada()         // IllegalStateException
  void editarCancelarYReabrirExigenCampanaAbierta() // LaborServiceTest: cerrada, ConflictoException
  void noSeAsignaUnaLaborCancelada()          // ConflictoException
  void noSeRegistraConsumoEnLaborCancelada()  // ConflictoException, sin tocar stock
  void laCampanaPerdidaCierraLaBitacora()     // BitacoraServiceTest: ConflictoException
  ```
- [ ] **Paso 2: Implementar.** `reconstruir` agrega `motivoCancelacion` al final y `LaborResponse` lo expone. `editar` normaliza con `tipo.trim().toUpperCase()`. `EditarLaborRequest` copia las validaciones de `tipo` y `fechaPlan` de `PlanificarLaborRequest`. Las rutas son `PUT /{id}`, `POST /{id}/cancelar` y `POST /{id}/reabrir`; estas dos con `MotivoRequest`.
- [ ] **Paso 3: Commit** `feat(labores): editar, cancelar y reabrir`.

### Tarea 13: Campañas y cultivos

**Files:**
- Create: `campana/infrastructure/adapter/in/web/dto/EditarCampanaRequest.java`, `.../dto/MarcarPerdidaRequest.java`
- Modify: `Campana.java`, `CampanaRepository.java`, `CampanaPersistenceAdapter.java`, `CampanaJpaRepository.java`, `CampanaJpaEntity.java`, `CampanaPersistenceMapper.java`, `CampanaResponse.java`, `CampanaService.java`, `CampanaConfig.java`, `CampanaController.java`, `Cultivo.java`, `CultivoRepository.java`, adaptador y JPA de cultivo, `CultivoService.java`, `CultivoController.java`, `LaborServiceTest.java`, `InventarioServiceTest.java`, `BitacoraServiceTest.java`
- Test: `campana/domain/CampanaTest.java`, `campana/application/CampanaServiceTest.java`, `cultivo/application/CultivoServiceTest.java`, `integracion/PersistenciaPostgresTest.java`

**Interfaces:**
- Consumes: `Labor.cancelar`, `Labor.estaPendiente` de la Tarea 12.
- Produces en `Campana`: `void editarPlan(Long cultivoId, LocalDate fechaInicio)`, `void cancelar(String motivo)`, `void marcarPerdida(String motivo, LocalDate fechaFin)`, `void reabrir()`, `String getMotivoCierre()`.
- Produces en `CampanaService`, con `LaborRepository` como cuarto argumento del constructor:
  ```java
  @Auditable(entidad = "CAMPANA", accion = "EDITAR")         Campana editar(Long id, Long cultivoId, LocalDate fechaInicio)
  @Auditable(entidad = "CAMPANA", accion = "CANCELAR")       Campana cancelar(Long id, String motivo)
  @Auditable(entidad = "CAMPANA", accion = "MARCAR_PERDIDA") Campana marcarPerdida(Long id, String motivo, LocalDate fechaFin)
  @Auditable(entidad = "CAMPANA", accion = "REABRIR")        Campana reabrir(Long id, String motivo)
  ```
- Produces: `CultivoRepository.existePorNombreEnOtro(String nombre, Long idExcluido)` y `@Auditable(entidad = "CULTIVO", accion = "ACTUALIZAR") Cultivo CultivoService.actualizar(Long id, String nombre, Integer cicloDias)`.

- [ ] **Paso 1: Pruebas**
  ```java
  void finalizarSoloDesdeEnCurso()            // PLANIFICADA: IllegalStateException
  void editarPlanSoloSiEstaPlanificada()      // EN_CURSO: IllegalStateException
  void cancelarSoloSiEstaPlanificada()        // EN_CURSO: IllegalStateException
  void marcarPerdidaSoloDesdeEnCurso()        // y fechaFin no anterior al inicio
  void reabrirDesdeFinalizadaOPerdida()       // EN_CURSO, fechaFin y motivoCierre null
  void noSeReabreUnaCancelada()               // IllegalStateException
  void finalizarCancelarYPerderCancelanLaboresPendientes()
  // CampanaServiceTest: labores PLANIFICADA y EN_CURSO quedan CANCELADA con
  // "Campaña finalizada", "Campaña cancelada: <motivo>" y "Campaña perdida: <motivo>"; EJECUTADA no cambia.
  void elMotivoHeredadoNoPasaDe200Caracteres() // motivo de 200: motivoCancelacion.length() == 200
  void reabrirRechazaSiHayOtraCampanaAbierta() // ConflictoException
  void laCanceladaLiberaLaParcela()           // PersistenciaPostgresTest: cancelar y crear otra en la misma parcela
  void actualizarCultivoConNombreDeOtroEsConflicto()
  void actualizarCultivoConSuMismoNombreGuarda()
  ```
- [ ] **Paso 2: Implementar.** `Campana.reconstruir` agrega `motivoCierre` al final y `CampanaResponse` lo expone. `existeAbiertaEnParcela` usa `existsByParcelaIdAndEstadoIn` con `PLANIFICADA` y `EN_CURSO`. Un método privado `cancelarLaboresPendientes(Long campanaId, String motivo)` recorta a 200 caracteres. Las pruebas que hacen `new Campana(...).finalizar(...)` llaman antes a `iniciar()`. Las rutas son `PUT /{id}`, `POST /{id}/cancelar`, `POST /{id}/marcar-perdida`, `POST /{id}/reabrir` con `MotivoRequest` y `PUT /api/cultivos/{id}`, esta última con `CrearCultivoRequest`.
- [ ] **Paso 3: Commit** `feat(campanas): editar, cancelar, marcar perdida y reabrir`.

### Tarea 14: Cosechas

**Files:**
- Create: `shared/domain/Anulacion.java`, `shared/persistence/AnulacionEmbeddable.java`
- Modify: `Cosecha.java`, `CosechaRepository.java`, `CosechaPersistenceAdapter.java`, `CosechaJpaEntity.java`, `CosechaPersistenceMapper.java`, `CosechaService.java`, `CosechaController.java`, `CosechaResponse.java`, `RegistrarCosechaRequest.java`
- Test: `cosecha/application/CosechaServiceTest.java`, `cosecha/domain/CosechaTest.java`

**Interfaces:**
- Produces: `record Anulacion(String motivo, Long usuarioId, LocalDateTime fecha)` con `static Anulacion registrar(String motivo, Long usuarioId)`.
- Produces: `@Embeddable AnulacionEmbeddable` con columnas `anulado`, `motivo_anulacion`, `anulado_por`, `anulado_en`; `static desde(Anulacion)` y `Anulacion aDominio()`.
- Produces en `Cosecha`: `void anular(String motivo, Long usuarioId)`, `boolean isAnulado()`, `Anulacion getAnulacion()`.
- Produces: `Cosecha CosechaService.registrar(Long campanaId, BigDecimal cantidad, String unidadMedida, LocalDate fecha, Long usuarioId)` y `@Auditable(entidad = "COSECHA", accion = "ANULAR") Cosecha CosechaService.anular(Long id, String motivo, Long usuarioId)`.
- Produces JSON: `anulado`, `motivoAnulacion`, `anuladoPor`, `anuladoEn`. Los mismos nombres usan consumos y movimientos.

- [ ] **Paso 1: Pruebas**
  ```java
  void anularDosVecesEsConflicto()            // IllegalStateException
  void anularExigeMotivo()                    // vacío: IllegalArgumentException
  void sinFechaUsaHoy()
  void fechaFuturaDa400()                     // IllegalArgumentException
  void fechaAnteriorAlInicioDa400()           // inicio - 1 día: IllegalArgumentException; inicio exacto: guarda
  void soloSeCosechaUnaCampanaEnCurso()       // PLANIFICADA, FINALIZADA, CANCELADA y PERDIDA: ConflictoException
  ```
- [ ] **Paso 2: Implementar.** Ajusta las llamadas existentes a `registrar`, incluidas las pruebas que cosechan en campañas finalizadas. La ruta es `POST /api/cosechas/{id}/anular` con `MotivoRequest`.
- [ ] **Paso 3: Commit** `feat(cosechas): anular y registrar con fecha real`.

### Tarea 15: Inventario

**Files:**
- Create: `insumo/domain/OrigenMovimiento.java`, `insumo/infrastructure/adapter/in/web/dto/AjusteStockRequest.java`
- Modify: `MovimientoInsumo.java`, `ConsumoLabor.java`, `MovimientoInsumoRepository.java`, `ConsumoLaborRepository.java`, sus adaptadores, entidades, mappers y repositorios JPA, `InventarioService.java`, `InsumoController.java`, `LaborController.java`, `MovimientoResponse.java`, `ConsumoResponse.java`
- Test: `insumo/application/InventarioServiceTest.java`, `integracion/InventarioPostgresTest.java`

**Interfaces:**
- Consumes: `Anulacion` y `AnulacionEmbeddable` de la Tarea 14.
- Produces: `enum OrigenMovimiento { MANUAL, CONSUMO, ANULACION, AJUSTE }`.
- Produces en `MovimientoInsumo`:
  ```java
  static MovimientoInsumo deConsumo(Long insumoId, BigDecimal cantidad, String motivo, Long usuarioId, Long consumoId)
  static MovimientoInsumo deAjuste(Long insumoId, TipoMovimiento tipo, BigDecimal cantidad, String motivo, Long usuarioId)
  static MovimientoInsumo inversoDe(MovimientoInsumo original, String motivo, Long usuarioId) // recorta motivo a 150
  void anular(String motivo, Long usuarioId)
  boolean esAnulableDirecto() // MANUAL o AJUSTE
  ```
- Produces en repositorios: `MovimientoInsumoRepository.buscarPorIdParaActualizar(Long)`, `MovimientoInsumoRepository.buscarPorConsumo(Long)` y `ConsumoLaborRepository.buscarPorIdParaActualizar(Long)`. Los dos `buscarPorIdParaActualizar` usan `@Lock(PESSIMISTIC_WRITE)`.
- Produces en `InventarioService`:
  ```java
  @Auditable(entidad = "MOVIMIENTO_INSUMO", accion = "ANULAR") MovimientoInsumo anularMovimiento(Long insumoId, Long movimientoId, String motivo, Long usuarioId)
  @Auditable(entidad = "CONSUMO_LABOR", accion = "ANULAR")     ConsumoLabor anularConsumo(Long laborId, Long consumoId, String motivo, Long usuarioId)
  @Auditable(entidad = "INSUMO", accion = "AJUSTAR")           MovimientoInsumo ajustarStock(Long insumoId, BigDecimal stockContado, String motivo, Long usuarioId)
  ```

- [ ] **Paso 1: Pruebas de servicio**
  ```java
  void soloManualYAjusteSeAnulanDirecto()     // CONSUMO y ANULACION: ConflictoException
  void anularUnaEntradaSinStockDa409()        // stock insuficiente: IllegalStateException, sin guardar
  void movimientoDeOtroInsumoDa404()
  void consumoDeOtraLaborDa404()
  void consumoSinMovimientoEnlazadoDa409()    // ConflictoException
  void ajusteIgualAlStockDa409()              // ConflictoException
  void ajustePorDebajoCreaSalidaYPorEncimaEntrada() // 85 a 80: SALIDA 5; 80 a 85: ENTRADA 5
  void anularConsumoFuncionaConCampanaCerrada()
  ```
- [ ] **Paso 2: Pruebas con PostgreSQL** en `InventarioPostgresTest`:
  ```java
  void elStockCuadraTrasTodaLaSecuencia()
  // Insumo nuevo: entrada 100, salida 10, consumo 5, ajuste a 80, anular ajuste (85), anular consumo (90),
  // anular la entrada da 409 y deja 90, anular la salida (100), anular la entrada (0).
  // Consulta final: ningún insumo con stock_actual distinto de entradas menos salidas.
  void lasSalidasExcluyenAnuladosYAjustes()   // tras la secuencia, salidasEntre(hoy, hoy) no trae ese insumo
  void dosAnulacionesSimultaneasDevuelvenElStockUnaVez()
  // Dos hilos anulan el mismo consumo: uno pasa, otro da IllegalStateException; el stock sube una vez.
  void cancelarLaborConConsumosNoTocaElStock() // consumo y stock iguales tras cancelar la labor
  void anularUnoDeDosConsumosIgualesDevuelveSoloSuCantidad() // dos consumos de 3: stock + 3; la otra salida sigue viva
  ```
- [ ] **Paso 3: Implementar.** Orden de bloqueo: primero el registro que se anula, después el insumo. Así el segundo hilo lee `anulado = true`; una lectura sin bloqueo quedaría en la caché de Hibernate. `registrarConsumo` guarda el consumo y luego `deConsumo`. `listarSalidasEntre` filtra con `@Query`: no anulados y `origen` en `MANUAL` o `CONSUMO`. `anularConsumo` marca la salida como anulada y crea el inverso. Las rutas son `POST /api/insumos/{id}/movimientos/{movId}/anular`, `POST /api/insumos/{id}/ajustes` (201) y `POST /api/labores/{laborId}/consumos/{id}/anular`. `AjusteStockRequest` usa `@DecimalMin("0")`, `@Digits(integer = 10, fraction = 2)` y `motivo` con `@NotBlank @Size(max = 150)`.
- [ ] **Paso 4: Commit** `feat(inventario): anular movimientos y consumos, y ajustar por conteo`.

### Tarea 16: Incidencias y matriz de permisos

**Files:**
- Modify: `EstadoIncidencia.java`, `Incidencia.java`, `IncidenciaJpaEntity.java`, `IncidenciaPersistenceMapper.java`, `IncidenciaService.java`, `IncidenciaController.java`, `IncidenciaResponse.java`, `SecurityConfig.java`
- Test: `incidencia/application/IncidenciaServiceTest.java`, `auth/infrastructure/security/SeguridadPermisosTest.java`

**Interfaces:**
- Produces: `boolean Incidencia.estaAbierta()`, verdadero en `ABIERTA` y `EN_ATENCION`; `void anular(String motivo, Long usuarioId)`.
- Produces: `@Auditable(entidad = "INCIDENCIA", accion = "ANULAR") Incidencia IncidenciaService.anular(Long id, String motivo, Long usuarioId)`.

- [ ] **Paso 1: Pruebas**
  ```java
  void anularDesdeAbiertaOEnAtencion()        // ANULADA con motivo, usuario y fecha
  void noSeAnulaUnaResuelta()                 // IllegalStateException
  void noSeResuelveUnaAnulada()               // IllegalStateException
  // SeguridadPermisosTest, @WebMvcTest de todos esos controladores con servicios simulados y @ParameterizedTest
  // con cuerpo {}: permitido = 400; denegado = 403.
  // POST /api/incidencias/1/anular          permiten ADMINISTRADOR, JEFE_DE_CAMPO, SUPERVISOR
  // POST /api/cosechas/1/anular             permiten ADMINISTRADOR, JEFE_DE_CAMPO, ALMACENERO
  // POST /api/labores/1/consumos/2/anular   permiten ADMINISTRADOR, JEFE_DE_CAMPO
  // POST /api/insumos/1/movimientos/2/anular y POST /api/insumos/1/ajustes  permiten ADMINISTRADOR, ALMACENERO
  // POST /api/labores/1/cancelar y POST /api/campanas/1/cancelar  permiten ADMINISTRADOR, JEFE_DE_CAMPO
  // PUT /api/usuarios/1                     permite ADMINISTRADOR
  ```
- [ ] **Paso 2: Implementar.** Agrega `"/api/incidencias/*/anular"` a la regla de `atender` y `resolver`.
- [ ] **Paso 3: Commit** `feat(incidencias): anular y probar la matriz de permisos`.

### Tarea 17: Resúmenes sin anulados

**Files:**
- Modify: `AvanceCampanaService.java`
- Test: `campana/application/AvanceCampanaServiceTest.java`

- [ ] **Paso 1: Prueba** `elAvanceIgnoraLoAnuladoYLoCancelado()`. Con 3 labores (1 ejecutada, 1 planificada, 1 cancelada), una cosecha anulada, un consumo anulado y una incidencia anulada: `laboresTotal` = 2, `porcentajeLabores` = 50, `cosecha` vacía, `insumos` vacía, `incidenciasTotal` = 0 e `incidenciasAbiertas` = 0.
- [ ] **Paso 2: Implementar** usando `isAnulado()`, `estaAbierta()` y `EstadoLabor.CANCELADA`.
- [ ] **Paso 3: Commit** `fix(avance): excluir anulados y cancelados`.

### Tarea 18: Web, base común

**Files:**
- Create: `shared/utils/estados.ts`, `components/ui/MotivoDialog.tsx`
- La web muestra `ASIGNADA` como "Asignada", `CosechaForm` ofrece solo campañas `EN_CURSO`, y reabrir labor o campaña pide motivo.
- Modify: modelos `Campana.ts`, `Labor.ts`, `Incidencia.ts`, `Cosecha.ts`, `Insumo.ts`; `StatusBadge.tsx`, `features/auth/permisos.ts`, `styles/global.css`, `DashboardPage.tsx`, `LaborForm.tsx`, `CampanaForm.tsx`, `CosechaForm.tsx`, `CampanaTable.tsx`, `LaborTable.tsx`, `LaboresPage.tsx`, `IncidenciasPage.tsx`
- Test: `shared/utils/__tests__/estados.test.ts`, `components/ui/__tests__/MotivoDialog.test.tsx`, `StatusBadge.test.tsx`, `permisos.test.ts`

**Interfaces:**
- Produces: `campanaAbierta(c)`, `laborPendiente(l)`, `incidenciaAbierta(i)`, cada una con `{ estado }`, y `sinAnulados<T extends { anulado: boolean }>(lista: T[]): T[]`.
- Produces: `<MotivoDialog open title confirmLabel aviso? conFecha? onConfirm={(motivo: string, fecha: string) => Promise<void>} onCancel />`. `conFecha` es la etiqueta del campo de fecha.
- Produces: acción `consumos.anular` para `ADMINISTRADOR` y `JEFE_DE_CAMPO`; clase CSS `fila-anulada`.

- [ ] **Paso 1: Pruebas**
  ```ts
  it('campanaAbierta solo en PLANIFICADA y EN_CURSO')
  it('laborPendiente solo en PLANIFICADA y EN_CURSO')
  it('incidenciaAbierta solo en ABIERTA y EN_ATENCION')
  it('MotivoDialog exige motivo y limita a 200 caracteres')
  it('MotivoDialog muestra el error de la API y no se cierra')
  it('MotivoDialog con conFecha envía motivo y fecha')
  it('MotivoDialog muestra el aviso')
  it('StatusBadge colorea CANCELADA, PERDIDA y ANULADA')
  ```
- [ ] **Paso 2: Implementar.** `CANCELADA` y `PERDIDA` usan `status-inactive`; `ANULADA`, `status-neutral`. Los ayudantes reemplazan las comparaciones sueltas. `CosechaForm` excluye `PLANIFICADA` y `CANCELADA`.
- [ ] **Paso 3: Commit** `feat(web): estados nuevos y diálogo de motivo`.

### Tarea 19: Web, corregir planes

**Files:**
- Modify: `campanaService.ts`, `CampanaForm.tsx`, `CampanaTable.tsx`, `CampanasPage.tsx`, `laborService.ts`, `LaborForm.tsx`, `LaborTable.tsx`, `LaboresPage.tsx`, `cultivoService.ts`, `CultivoForm.tsx`, `CultivosPage.tsx`
- Test: `features/campanas/__tests__/CampanaTable.test.tsx`, `features/labores/__tests__/LaborTable.test.tsx`

**Interfaces:**
- Consumes: `MotivoDialog`, `laborPendiente`, de la Tarea 18.
- Produces en `campanaService`: `editar(id, { cultivoId, fechaInicio })`, `cancelar(id, motivo)`, `marcarPerdida(id, motivo, fechaFin)`, `reabrir(id)`.
- Produces en `laborService`: `editar(id, { tipo, fechaPlan })`, `cancelar(id, motivo)`, `reabrir(id)`, `anularConsumo(laborId, consumoId, motivo)`.
- Produces: `cultivoService.actualizar(id, data)`. `CampanaForm`, `LaborForm` y `CultivoForm` reciben el registro opcional y `onGuardado`, como `InsumoForm`.

- [ ] **Paso 1: Pruebas**
  ```ts
  it('CampanaTable: planificada ofrece Editar, Iniciar y Cancelar')
  it('CampanaTable: en curso ofrece Finalizar y Marcar perdida')
  it('CampanaTable: finalizada y perdida ofrecen Reabrir; cancelada, ninguna')
  it('LaborTable: cancelada no ofrece Ejecutar ni Asignar')
  it('LaborTable: ejecutada ofrece Reabrir al jefe y no al operario')
  ```
- [ ] **Paso 2: Implementar.** Cancelar una labor y perder una campaña pasan el `aviso` "Los insumos ya registrados no vuelven al almacén; anúlelos por separado". "Marcar perdida" usa `conFecha="Fecha de fin"`. `CampanasPage` recarga tras cancelar o perder, porque cambian las labores.
- [ ] **Paso 3: Commit** `feat(web): corregir campañas, labores y cultivos`.

### Tarea 20: Web, anular hechos

**Files:**
- Create: `features/insumos/components/AjustePanel.tsx`
- Modify: `cosechaService.ts`, `CosechaForm.tsx`, `CosechasPage.tsx`, `ConsumosPanel.tsx`, `LaboresPage.tsx`, `insumoService.ts`, `MovimientosPanel.tsx`, `InsumosPage.tsx`, `incidenciaService.ts`, `IncidenciasPage.tsx`, `DashboardPage.tsx`
- Test: `features/insumos/__tests__/movimientos.test.ts`, `features/cosechas/__tests__/CosechaForm.test.tsx`

**Interfaces:**
- Produces: `cosechaService.anular(id, motivo)`, `insumoService.anularMovimiento(insumoId, movimientoId, motivo)`, `insumoService.ajustar(insumoId, stockContado, motivo)`, `incidenciaService.anular(id, motivo)`.
- Produces: `esAnulable(m: MovimientoInsumo): boolean`, en `features/insumos/models/Insumo.ts`.

- [ ] **Paso 1: Pruebas**
  ```ts
  it('esAnulable: MANUAL y AJUSTE sin anular; nunca CONSUMO ni ANULACION')
  it('CosechaForm envía la fecha elegida y no acepta fecha futura')
  ```
- [ ] **Paso 2: Implementar.** Los anulados se muestran con `fila-anulada` y su motivo en `title`. `CosechaForm` agrega fecha con `hoyISO()` y `max`. `ConsumosPanel` recibe `puedeAnular`. Tras anular o ajustar, `InsumosPage` llama a `recargar()` y sube `versionSalidas`. Los totales de `CosechasPage` y `DashboardPage` usan `sinAnulados(cosechas)`.
- [ ] **Paso 3: Commit** `feat(web): anular hechos y ajustar stock`.

### Tarea 21: Móvil, estados nuevos

**Files:**
- Modify: `src/models/agro.ts`, `src/theme/estados.ts`, `src/api/cliente.ts`, `src/logic/detalleParcela.ts`, `src/components/ParcelaDetalle.tsx`, `ParcelaCard.tsx`, `EstadoChip.tsx`, `App.tsx`

**Interfaces:**
- Produces: `visualParcela(estado: string)` en `theme/estados.ts`, con respaldo `VISUAL_DESCONOCIDO`; `campanaAbierta(c: Campana): boolean` en `logic/detalleParcela.ts`.

- [ ] **Paso 1: Implementar.**
  - Tipos con `ASIGNADA`, `CANCELADA`, `PERDIDA` y `ANULADA`. `ASIGNADA` cuenta como labor pendiente, igual que `PLANIFICADA`.
  - `cliente.ts` descarta cosechas con `anulado`.
  - `armarDetalle` excluye labores canceladas e incidencias anuladas, y el historial incluye `FINALIZADA` y `PERDIDA`.
  - `ParcelaDetalle` usa `?? VISUAL_DESCONOCIDO` y escribe "Perdida" en el historial.
- [ ] **Paso 2: Verificar** con el comando de móvil. Esperado: 0 errores.
- [ ] **Paso 3: Commit** `feat(movil): tolerar estados nuevos y anulados`.

### Tarea 22: Cierre del hito 2

**Files:**
- Modify: `README.md`, `requests.http`
- Create: requests en `docs/postman/AgroControl API/Corregir y anular/`

- [ ] **Paso 1: Documentar** las rutas y reglas nuevas.
- [ ] **Paso 2: Verificar todo:** backend, web y móvil completos pasan.
- [ ] **Paso 3: Recorrido con Playwright en `http://localhost:8090`,** como jefe y almacenero:
  - Editar una campaña planificada y una labor.
  - Cancelar una labor con consumo: aparece el aviso y el stock no cambia.
  - Anular ese consumo: fila tachada y stock devuelto.
  - Anular una cosecha: tachada y fuera de los totales.
  - Ajustar stock por conteo.
  - Marcar perdida una campaña y reabrirla.
  - En Auditoría, cada acción aparece con su motivo.
- [ ] **Paso 4: Emulador:** Metro en 8082 con `EXPO_PUBLIC_API_URL=http://10.0.2.2:8090`. La parcela muestra labores y campañas sin cerrarse, sin los registros anulados.
- [ ] **Paso 5: Commit** `docs(api): corregir y anular`.

---

## Hito 3: datos veraces

### Tarea 23: Unidades de cosecha y V10

**Files:**
- Create: `cosecha/domain/UnidadCosecha.java`, `db/migration/V10__datos_veraces.sql`
- Modify: `Cosecha.java`, `CosechaResponse.java`, `AvanceCampana.java`, `AvanceCampanaService.java`, `PersistenciaPostgresTest.java`
- Test: `cosecha/domain/UnidadCosechaTest.java`, `campana/application/AvanceCampanaServiceTest.java`, `integracion/MigracionesTest.java`

**Interfaces:**
- Produces:
  ```java
  enum UnidadCosecha { T("t", "1"), KG("kg", "0.001"), QQ("qq", "0.046");
      static UnidadCosecha desde(String codigo); // otra: IllegalArgumentException
      BigDecimal aToneladas(BigDecimal cantidad); // multiplicación exacta, sin redondear
  }
  ```
- Produces: `BigDecimal Cosecha.getToneladas()`, `CosechaResponse.toneladas`, `AvanceCampana.cosechaToneladas`.

- [ ] **Paso 1: Pruebas**
  ```java
  void convierteCadaUnidad()      // 2 t = 2; 1500 kg = 1.5; 100 qq = 4.6
  void rechazaOtraUnidad()        // "arroba": IllegalArgumentException
  void elRendimientoCuentaQuintales() // parcela de 2 ha con 100 qq y 400 kg: cosechaToneladas 5.0, rendimiento 2.50
  void v10NormalizaUnidadesYAlineaParcelas()
  // MigracionesTest, desde V9: " T " y "tn" = t; "Kilos" = kg; "Quintales" = qq;
  // parcela con campaña EN_CURSO = EN_PRODUCCION; EN_PRODUCCION sin campaña en curso = DISPONIBLE.
  void v10FallaConUnaUnidadDesconocida()  // "arroba": FlywayException
  ```
- [ ] **Paso 2: Implementar.** La lista de equivalencias de V10 está en la sección "Datos (V10)" de la especificación. `Cosecha(...)` valida con `UnidadCosecha.desde`. `rendimiento` suma `getToneladas()` de las no anuladas. `PersistenciaPostgresTest` espera versión 10.
- [ ] **Paso 3: Commit** `feat(cosechas): unidades convertidas a toneladas`.

### Tarea 24: Hora de Bolivia

**Files:**
- Modify: `Dockerfile`
- Test: `integracion/ZonaHorariaTest.java`

- [ ] **Paso 1: Prueba.** `@SpringBootTest(properties = "agrocontrol.prueba.zona=la-paz")`, `@DirtiesContext`. Un bloque `static` fija `TimeZone.setDefault(TimeZone.getTimeZone("America/La_Paz"))` y `@AfterAll` restaura la zona anterior.
  ```java
  void unLocalDateNoCambiaDeDia()
  // Campaña con fechaInicio 2026-11-02: se lee igual, y en SQL fecha_inicio::text = "2026-11-02".
  void unLocalDateTimeVuelveIgualYSeGuardaEnUtc()
  // Un MovimientoInsumo reconstruido con 2026-10-31 22:30 se lee igual, y en SQL queda "2026-11-01 02:30:00".
  void unRegistroAntiguoEnUtcSeLeeEnHoraDeBolivia() // 2026-10-20 03:28 en SQL se lee 2026-10-19 23:28
  ```
- [ ] **Paso 2: Agregar** `ENV TZ=America/La_Paz` a la imagen final del `Dockerfile`. Si `unLocalDateNoCambiaDeDia` falla, corregir antes de seguir: es el riesgo que este hito debe cerrar.
- [ ] **Paso 3: Comprobar en el contenedor:** tras `docker compose up -d --build`, registrar una incidencia. Esperado: `fecha` igual a la hora de `date` en Bolivia.
- [ ] **Paso 4: Commit** `feat(servidor): usar la hora de Bolivia`.

### Tarea 25: Parcela movida por la campaña

**Files:**
- Modify: `CampanaService.java`, `CampanaRepository.java`, `CampanaPersistenceAdapter.java`, `CampanaJpaRepository.java`, `ParcelaService.java`
- Test: `campana/application/CampanaServiceTest.java`, `parcela/application/ParcelaServiceTest.java`, `integracion/PersistenciaPostgresTest.java`

**Interfaces:**
- Produces: `boolean CampanaRepository.existeEnCursoEnParcela(Long parcelaId)`.

- [ ] **Paso 1: Pruebas**
  ```java
  void iniciarPasaLaParcelaAEnProduccion()
  void noSeIniciaEnUnaParcelaEnDescanso()     // ConflictoException; campaña sigue PLANIFICADA
  void finalizarYPerderDejanLaParcelaDisponible()
  void reabrirVuelveAEnProduccion()
  void noSeReabreEnUnaParcelaEnDescanso()     // ConflictoException
  void cancelarNoTocaLaParcela()              // verify(parcelaRepository, never()).guardar(any())
  void mandarElMismoEstadoEsValido()          // EN_PRODUCCION a EN_PRODUCCION, con otro código: guarda
  void pedirEnProduccionAManoDa409()          // ConflictoException
  void cambiarEstadoConCampanaEnCursoDa409()  // ConflictoException
  void pasarADescansoSinCampanaEnCursoGuarda()
  void iniciarCambiaLaParcelaEnLaBase()       // PersistenciaPostgresTest: tras iniciar, parcela.estado = EN_PRODUCCION
  ```
- [ ] **Paso 2: Implementar** en `CampanaService` con `parcelaRepository.guardar`. En `ParcelaService.actualizar`, las reglas aplican solo si `estado != null` y es distinto del actual.
- [ ] **Paso 3: Commit** `feat(parcelas): el estado sigue a la campaña`.

### Tarea 26: Web, datos veraces

**Files:**
- Create: `shared/utils/resumenInicio.ts`
- Modify: `DashboardPage.tsx`, `CosechasPage.tsx`, `features/cosechas/models/Cosecha.ts`, `AvancePanel.tsx`, `AvanceCampana.ts`, `features/parcelas/models/Parcela.ts`, `ParcelaForm.tsx`
- Test: `shared/utils/__tests__/resumenInicio.test.ts`, `features/parcelas/__tests__/ParcelaForm.test.tsx`

**Interfaces:**
- Produces: `diasAtraso(fechaIso: string, hoy: string): number`, `insumosPorReponer(insumos: Insumo[]): Insumo[]`, `siembrasAtrasadas(campanas: Campana[], hoy: string): number`.
- Produces: `ESTADOS_MANUALES: EstadoParcela[] = ['DISPONIBLE', 'EN_DESCANSO']`, que reemplaza a `ESTADOS_PARCELA`.

- [ ] **Paso 1: Pruebas**
  ```ts
  it('diasAtraso: ayer 1, hoy 0, mañana 0')
  it('insumosPorReponer incluye porAgotarse y stock 0, sin los demás')
  it('insumosPorReponer ordena por stockActual / stockMinimo; sin mínimo cuenta 0')
  it('siembrasAtrasadas cuenta solo planificadas con inicio anterior a hoy')
  it('ParcelaForm: en producción se muestra fijo y envía el mismo estado')
  it('ParcelaForm: disponible ofrece solo Disponible y En descanso')
  ```
- [ ] **Paso 2: Implementar.**
  - Las comparaciones usan `hoyISO()`.
  - `tarjetaLabores` agrega "Atrasada · N días" a las pendientes vencidas.
  - `tarjetaStock` pasa a "Por reponer".
  - Los totales usan `toneladas`.
  - "Siembras atrasadas" se agrega a administrador, jefe y supervisor.
  - `AvancePanel` muestra `cosechaToneladas`.
- [ ] **Paso 3: Commit** `feat(web): toneladas reales, atrasos y por reponer`.

### Tarea 27: Móvil, datos veraces

**Files:**
- Modify: `src/models/agro.ts`, `src/theme/estados.ts`, `src/api/cliente.ts`, `src/logic/detalleParcela.ts`, `src/logic/siembra.ts`, `src/data/demoData.ts`, `src/components/ParcelaDetalle.tsx`, `PredioDetalle.tsx`, `ResumenCampo.tsx`, `CampanaProgreso.tsx`, `App.tsx`

**Interfaces:**
- Produces: `esAtrasada(fechaIso: string, hoy: Date = new Date()): boolean` en `logic/siembra.ts`, con la fecha local.

- [ ] **Paso 1: Implementar.**
  - `SEMBRADA` pasa a `EN_PRODUCCION`, con la etiqueta "Sembrada", en modelo, `ESTADO_VISUAL`, `SIN_SIEMBRA`, `ORDEN`, `PredioDetalle`, `App.tsx` y `demoData`.
  - `Cosecha` agrega `toneladas`; `demoData` usa 315, 72 y 87; `cliente.ts` deja de convertir.
  - `armarDetalle` suma `toneladas`.
  - `ParcelaDetalle` marca "Atrasada" en pendientes vencidas.
  - `CampanaProgreso` muestra "Siembra atrasada" en planificadas vencidas.
- [ ] **Paso 2: Verificar** con el comando de móvil. Esperado: 0 errores.
- [ ] **Paso 3: Commit** `feat(movil): estado real de parcela, toneladas y atrasos`.

### Tarea 28: Cierre del hito 3 y recorrido final

**Files:**
- Modify: `README.md`, `requests.http`, `database/esquema_actual.sql`
- Modify: `docs/02-requirements/backlog-v0.1.md`, `docs/02-requirements/model-relational-v0.1.md`, `docs/01-vision/glossary-v0.1.md`
- Create: requests en `docs/postman/AgroControl API/Datos veraces/`; `docs/03-decisions/ADR-001-instalacion-por-perfiles.md`, `ADR-002-corregir-anulando.md`, `ADR-003-quintal-46-kg.md`, `ADR-004-estados-adicionales.md`, con el formato de `docs/03-decisions/README.md`

- [ ] **Paso 1: Documentar** los ADR, el backlog, el modelo relacional, el glosario, unidades, hora y reglas de parcela. Citar RN-03, RN-06 y RN-09 del Banco donde correspondan. Regenerar `esquema_actual.sql` con el comando de `database/README.md` y actualizar su cabecera a V1 a V10.
- [ ] **Paso 2: Verificar todo:** backend, web y móvil completos pasan.
- [ ] **Paso 3: Producción limpia.** `docker compose --env-file .env.produccion.local down -v`, luego `up -d --build`.
- [ ] **Paso 4: Recorrido con Playwright en `http://localhost:8091`:** primer ingreso, cambio de clave, alta de un usuario, restablecer, predio, parcela, cultivo, insumo con entrada, campaña, inicio, labor, consumo, anulación, ajuste, cosecha en qq, pérdida y reapertura. Asignar un operario deja la labor en Asignada. Esperado: 100 qq suman 4,6 t; la parcela pasa a En producción al iniciar, a Disponible al perder y a En producción al reabrir.
- [ ] **Paso 5: Demo.** En `http://localhost:8090`, entrar con `agro123`, y comprobar labores atrasadas y "Por reponer".
- [ ] **Paso 6: Emulador contra 8090:** `EN_PRODUCCION` se ve como "Sembrada", y una cosecha en qq muestra toneladas correctas.
- [ ] **Paso 7: Confirmar** que `git diff feat/movil-api --stat -- docs/06-defensa docs/02-requirements/matriz-rf-rn-parcial1.md` no muestra cambios.
- [ ] **Paso 8: Commit** `docs(base-confiable): cierre de la parte 1`.
- [ ] **Paso 9: Terminar** con `superpowers:finishing-a-development-branch`, sin integrar antes de la defensa.
