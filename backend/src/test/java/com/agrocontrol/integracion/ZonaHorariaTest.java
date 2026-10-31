package com.agrocontrol.integracion;

import com.agrocontrol.campana.application.CampanaService;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.domain.CategoriaInsumo;
import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.insumo.domain.MovimientoInsumoRepository;
import com.agrocontrol.insumo.domain.OrigenMovimiento;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.TimeZone;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// La imagen corre con TZ=America/La_Paz y la base guarda UTC: una fecha no debe correrse de día.
@SpringBootTest(properties = "agrocontrol.prueba.zona=la-paz")
@DirtiesContext
@Testcontainers(disabledWithoutDocker = true)
class ZonaHorariaTest {

    private static final TimeZone ZONA_ANTERIOR = TimeZone.getDefault();

    static {
        TimeZone.setDefault(TimeZone.getTimeZone("America/La_Paz"));
    }

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    private CampanaService campanaService;
    @Autowired
    private InventarioService inventario;
    @Autowired
    private MovimientoInsumoRepository movimientos;
    @Autowired
    private JdbcTemplate jdbc;

    @AfterAll
    static void restaurar() {
        TimeZone.setDefault(ZONA_ANTERIOR);
    }

    private Long usuario() {
        return jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);
    }

    private Long insumo() {
        return inventario.crearInsumo("Zona " + UUID.randomUUID(), "kg", CategoriaInsumo.OTRO, BigDecimal.ZERO).getId();
    }

    private MovimientoInsumo leer(Long insumoId) {
        return movimientos.listarPorInsumo(insumoId).get(0);
    }

    @Test
    void unLocalDateNoCambiaDeDia() {
        Long parcela = jdbc.queryForObject("""
                SELECT min(id_parcela) FROM agrocontrol.parcela p WHERE NOT EXISTS
                (SELECT 1 FROM agrocontrol.campana c WHERE c.id_parcela = p.id_parcela AND c.estado IN ('PLANIFICADA', 'EN_CURSO'))""", Long.class);
        Long cultivo = jdbc.queryForObject("SELECT min(id_cultivo) FROM agrocontrol.cultivo", Long.class);

        Campana campana = campanaService.crear(parcela, cultivo, LocalDate.of(2026, 11, 2));

        assertThat(campanaService.obtener(campana.getId()).getFechaInicio()).isEqualTo(LocalDate.of(2026, 11, 2));
        assertThat(jdbc.queryForObject("SELECT fecha_inicio::text FROM agrocontrol.campana WHERE id_campana = ?",
                String.class, campana.getId())).isEqualTo("2026-11-02");
    }

    @Test
    void unLocalDateTimeVuelveIgualYSeGuardaEnUtc() {
        Long insumo = insumo();
        LocalDateTime nocheEnBolivia = LocalDateTime.of(2026, 10, 31, 22, 30);

        MovimientoInsumo guardado = movimientos.guardar(MovimientoInsumo.reconstruir(null, insumo, TipoMovimiento.ENTRADA,
                BigDecimal.ONE, "prueba", usuario(), nocheEnBolivia, null, OrigenMovimiento.MANUAL, null, null));

        assertThat(leer(insumo).getFecha()).isEqualTo(nocheEnBolivia);
        assertThat(jdbc.queryForObject("SELECT fecha::text FROM agrocontrol.movimiento_insumo WHERE id_movimiento = ?",
                String.class, guardado.getId())).isEqualTo("2026-11-01 02:30:00");
    }

    @Test
    void unRegistroAntiguoEnUtcSeLeeEnHoraDeBolivia() {
        Long insumo = insumo();
        jdbc.update("""
                INSERT INTO agrocontrol.movimiento_insumo (id_insumo, tipo, cantidad, id_usuario, fecha)
                VALUES (?, 'ENTRADA', 1, ?, TIMESTAMP '2026-10-20 03:28:00')""", insumo, usuario());

        assertThat(leer(insumo).getFecha()).isEqualTo(LocalDateTime.of(2026, 10, 19, 23, 28));
    }
}
