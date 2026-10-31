package com.agrocontrol.integracion;

import com.agrocontrol.auditoria.application.AuditoriaService;
import com.agrocontrol.auditoria.domain.Auditoria;
import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.command.CambiarPasswordCommand;
import com.agrocontrol.bitacora.application.BitacoraService;
import com.agrocontrol.campana.application.AvanceCampanaService;
import com.agrocontrol.campana.application.CampanaService;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.incidencia.application.IncidenciaService;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Levanta la aplicación completa contra un PostgreSQL 17 real: Flyway aplica V1–V4 y se prueban
// los mapeos JPA, los CHECK de la base y el bloqueo de stock. Sin Docker, se salta.
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class PersistenciaPostgresTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    private ParcelaRepository parcelaRepository;
    @Autowired
    private CampanaService campanaService;
    @Autowired
    private InventarioService inventarioService;
    @Autowired
    private BitacoraService bitacoraService;
    @Autowired
    private AuditoriaService auditoriaService;
    @Autowired
    private IncidenciaService incidenciaService;
    @Autowired
    private AvanceCampanaService avanceCampanaService;
    @Autowired
    private AuthService authService;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private CodificadorPassword codificadorPassword;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void lasMigracionesCreanElEsquemaYCarganLaSemilla() {
        assertThat(parcelaRepository.listarTodas()).isNotEmpty();
        Integer version = jdbc.queryForObject(
                "SELECT max(version::int) FROM flyway_schema_history WHERE success", Integer.class);
        assertThat(version).isEqualTo(10);
    }

    @Test
    void elUsuarioGuardaVersionYClavePendiente() {
        Usuario usuario = usuarioRepository.buscarPorEmail("supervisor@agrocontrol.com").orElseThrow();
        int version = usuario.getTokenVersion();

        usuario.restablecerPassword(usuario.getPasswordHash());
        usuarioRepository.guardar(usuario);

        Usuario leido = usuarioRepository.buscarPorId(usuario.getId()).orElseThrow();
        assertThat(leido.getTokenVersion()).isEqualTo(version + 1);
        assertThat(leido.isDebeCambiarPassword()).isTrue();

        // deshacer para no bloquear a otras pruebas de esta misma base
        leido.cambiarPassword(leido.getPasswordHash());
        usuarioRepository.guardar(leido);
    }

    @Test
    void laClaveNoApareceEnLaAuditoria() {
        Usuario usuario = usuarioRepository.guardar(new Usuario(null, "Temporal", "temporal@agrocontrol.com",
                codificadorPassword.codificar("ClaveActual1"), usuarioRepository.buscarPorEmail("supervisor@agrocontrol.com")
                .orElseThrow().getRolId()));

        authService.cambiarPassword(usuario.getId(), new CambiarPasswordCommand("ClaveActual1", "ClaveNueva2"));

        assertThat(jdbc.queryForList("SELECT coalesce(detalle, '') FROM agrocontrol.auditoria WHERE accion = 'CAMBIAR_PASSWORD'", String.class))
                .isNotEmpty().allSatisfy(detalle -> assertThat(detalle).doesNotContain("ClaveActual1", "ClaveNueva2"));
    }

    @Test
    void laCanceladaLiberaLaParcela() {
        Long parcelaId = jdbc.queryForObject(
                "SELECT min(id_parcela) FROM agrocontrol.parcela p WHERE NOT EXISTS "
                        + "(SELECT 1 FROM agrocontrol.campana c WHERE c.id_parcela = p.id_parcela AND c.estado IN ('PLANIFICADA', 'EN_CURSO'))",
                Long.class);
        Long cultivoId = jdbc.queryForObject("SELECT min(id_cultivo) FROM agrocontrol.cultivo", Long.class);
        Campana primera = campanaService.crear(parcelaId, cultivoId, LocalDate.now());

        campanaService.cancelar(primera.getId(), "Sin semilla");

        Campana segunda = campanaService.crear(parcelaId, cultivoId, LocalDate.now());
        assertThat(segunda.getEstado()).isEqualTo(EstadoCampana.PLANIFICADA);
        campanaService.cancelar(segunda.getId(), "Fin de la prueba");
        assertThat(campanaService.obtener(primera.getId()).getMotivoCierre()).isEqualTo("Sin semilla");
    }

    @Test
    void elUsuarioDeDemoEntraConAgro123() {
        assertThat(authService.iniciarSesion("sergio@agrocontrol.com", "agro123").rol()).isEqualTo("ADMINISTRADOR");
    }

    @Test
    void elCombustibleYLosRepuestosDeLaCargaInicialCuadranConSusMovimientos() {
        Integer descuadrados = jdbc.queryForObject("""
                SELECT count(*) FROM agrocontrol.insumo i
                WHERE i.categoria IN ('COMBUSTIBLE', 'LUBRICANTE', 'REPUESTO')
                  AND i.stock_actual <> (SELECT coalesce(sum(CASE m.tipo WHEN 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END), 0)
                                         FROM agrocontrol.movimiento_insumo m WHERE m.id_insumo = i.id_insumo)""",
                Integer.class);
        assertThat(descuadrados).isZero();
        assertThat(inventarioService.salidasEntre(LocalDate.now().minusDays(7), LocalDate.now()))
                .extracting(salida -> salida.nombre()).contains("Diésel", "Filtro de combustible");
    }

    @Test
    void laBaseRechazaUnEstadoQueNoExiste() {
        assertThatThrownBy(() -> jdbc.update("UPDATE agrocontrol.labor SET estado = 'CUALQUIERA'"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void elCambioDeEstadoSeGuardaEnLaBase() {
        Long parcelaId = jdbc.queryForObject(
                "SELECT min(id_parcela) FROM agrocontrol.parcela p WHERE NOT EXISTS "
                        + "(SELECT 1 FROM agrocontrol.campana c WHERE c.id_parcela = p.id_parcela AND c.estado IN ('PLANIFICADA', 'EN_CURSO'))",
                Long.class);
        Long cultivoId = jdbc.queryForObject("SELECT min(id_cultivo) FROM agrocontrol.cultivo", Long.class);
        Campana creada = campanaService.crear(parcelaId, cultivoId, LocalDate.now());

        campanaService.iniciar(creada.getId());

        assertThat(campanaService.obtener(creada.getId()).getEstado()).isEqualTo(EstadoCampana.EN_CURSO);
        // @Auditable deja el rastro de ambos cambios (sin sesión, el usuario queda vacío)
        List<Auditoria> rastro = auditoriaService.listar("campana", creada.getId());
        assertThat(rastro).extracting(Auditoria::getAccion).containsExactly("INICIAR", "CREAR");
        assertThat(auditoriaService.listar(null, null)).isNotEmpty();
    }

    @Test
    void laIncidenciaResueltaGuardaComoYCuando() {
        Long usuarioId = jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);
        Long parcelaId = jdbc.queryForObject("SELECT min(id_parcela) FROM agrocontrol.parcela", Long.class);
        Long id = incidenciaService.registrar(parcelaId, null, null, "Granizo en el lote norte", usuarioId).getId();

        incidenciaService.resolver(id, "Se resembró 1 ha");

        assertThat(jdbc.queryForObject(
                "SELECT estado || '|' || resolucion FROM agrocontrol.incidencia WHERE id_incidencia = ?", String.class, id))
                .isEqualTo("RESUELTA|Se resembró 1 ha");
        assertThatThrownBy(() -> jdbc.update(
                "UPDATE agrocontrol.incidencia SET resolucion = NULL WHERE id_incidencia = ?", id))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void elAvanceDeLaCampanaSaleDeLosDatosReales() {
        Long campanaId = jdbc.queryForObject("SELECT min(id_campana) FROM agrocontrol.labor", Long.class);
        int labores = jdbc.queryForObject("SELECT count(*) FROM agrocontrol.labor WHERE id_campana = ?", Integer.class, campanaId);

        assertThat(avanceCampanaService.calcular(campanaId, LocalDate.now()).laboresTotal()).isEqualTo(labores);
    }

    @Test
    void laBitacoraDeUnaParcelaReuneLasObservacionesDeSusLabores() {
        Long laborId = jdbc.queryForObject(
                "SELECT min(l.id_labor) FROM agrocontrol.labor l JOIN agrocontrol.campana c ON c.id_campana = l.id_campana "
                        + "WHERE c.estado IN ('PLANIFICADA', 'EN_CURSO')", Long.class);
        Long parcelaId = jdbc.queryForObject(
                "SELECT id_parcela FROM agrocontrol.labor WHERE id_labor = ?", Long.class, laborId);
        Long usuarioId = jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);

        bitacoraService.registrar(laborId, usuarioId, "Plántulas con buen vigor");

        assertThat(bitacoraService.listarPorParcela(parcelaId))
                .extracting(entrada -> entrada.getObservacion()).contains("Plántulas con buen vigor");
    }

    @Test
    void salidasSimultaneasNoPierdenStock() throws Exception {
        Long usuarioId = jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);
        Insumo insumo = inventarioService.crearInsumo("Prueba de concurrencia", "kg", null, null);
        inventarioService.registrarMovimiento(insumo.getId(), TipoMovimiento.ENTRADA, new BigDecimal("100"), null, usuarioId);

        ExecutorService hilos = Executors.newFixedThreadPool(10);
        List<Future<?>> salidas = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            salidas.add(hilos.submit(() -> inventarioService.registrarMovimiento(
                    insumo.getId(), TipoMovimiento.SALIDA, new BigDecimal("5"), null, usuarioId)));
        }
        for (Future<?> salida : salidas) {
            salida.get();
        }
        hilos.shutdown();

        assertThat(inventarioService.obtenerInsumo(insumo.getId()).getStockActual()).isEqualByComparingTo("0");
        assertThat(inventarioService.listarMovimientos(insumo.getId())).hasSize(21);
    }
}
