package com.agrocontrol.integracion;

import com.agrocontrol.auditoria.application.AuditoriaService;
import com.agrocontrol.auditoria.domain.Auditoria;
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
    private JdbcTemplate jdbc;

    @Test
    void lasMigracionesCreanElEsquemaYCarganLaSemilla() {
        assertThat(parcelaRepository.listarTodas()).isNotEmpty();
        BigDecimal version = jdbc.queryForObject(
                "SELECT max(version::numeric) FROM flyway_schema_history WHERE success", BigDecimal.class);
        assertThat(version).isEqualByComparingTo("7.1");
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
                        + "(SELECT 1 FROM agrocontrol.campana c WHERE c.id_parcela = p.id_parcela AND c.estado <> 'FINALIZADA')",
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
                        + "WHERE c.estado <> 'FINALIZADA'", Long.class);
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
        Insumo insumo = inventarioService.crearInsumo("Prueba de concurrencia", "kg", null, null, null, null);
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

    @Test
    void elMismoCodigoDeLaMismaMarcaNoSeRegistraDosVeces() {
        Insumo rodamiento = inventarioService.crearInsumo(
                "Rodamiento de prueba", "unidad", null, null, " 6205-2rs1 ", "SKF");
        assertThat(rodamiento.getCodigo()).isEqualTo("6205-2RS1");

        assertThatThrownBy(() -> inventarioService.crearInsumo(
                "Otro nombre", "unidad", null, null, "6205-2RS1", "skf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Rodamiento de prueba");

        // Otra marca con el mismo código es otra pieza
        assertThat(inventarioService.crearInsumo("Rodamiento FAG", "unidad", null, null, "6205-2RS1", "FAG").getId())
                .isNotNull();
        // Y editar el propio insumo sin cambiar el código no choca consigo mismo
        assertThat(inventarioService.actualizarInsumo(
                rodamiento.getId(), "Rodamiento renombrado", "unidad", null, null, "6205-2RS1", "SKF").getNombre())
                .isEqualTo("Rodamiento renombrado");
    }
}
