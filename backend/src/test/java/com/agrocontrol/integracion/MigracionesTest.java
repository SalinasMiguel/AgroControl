package com.agrocontrol.integracion;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// Cada prueba crea su propia base y corre Flyway sin Spring: así se comparan demo y producción
// y se migra desde una versión intermedia con datos antiguos.
@Testcontainers(disabledWithoutDocker = true)
class MigracionesTest {

    private static final String[] DEMO = {"classpath:db/migration", "classpath:db/demo"};
    private static final String[] PRODUCCION = {"classpath:db/migration", "classpath:db/produccion"};

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    private static String baseNueva() {
        String nombre = "b" + UUID.randomUUID().toString().replace("-", "");
        try (SingleConnectionDataSource admin = new SingleConnectionDataSource(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword(), true)) {
            new JdbcTemplate(admin).execute("CREATE DATABASE " + nombre);
        }
        return postgres.getJdbcUrl().replace("/" + postgres.getDatabaseName(), "/" + nombre);
    }

    private static Flyway flyway(String url, String[] ubicaciones, String target) {
        var config = Flyway.configure()
                .dataSource(url, postgres.getUsername(), postgres.getPassword())
                .locations(ubicaciones)
                .cleanDisabled(true);
        if (target != null) {
            config.target(target);
        }
        return config.load();
    }

    private static JdbcTemplate jdbc(String url) {
        return new JdbcTemplate(new SingleConnectionDataSource(
                url, postgres.getUsername(), postgres.getPassword(), true));
    }

    @Test
    void demoConservaLosChecksumsDeV1aV7() {
        String url = baseNueva();
        flyway(url, DEMO, "7").migrate();

        List<Map<String, Object>> filas = jdbc(url).queryForList(
                "SELECT version, checksum FROM flyway_schema_history WHERE success ORDER BY installed_rank");

        assertThat(filas).extracting(f -> f.get("version") + "=" + f.get("checksum")).containsExactly(
                "1=-388528007", "2=2077967464", "3=-782014172", "4=-864860771",
                "5=511590160", "6=-485339245", "7=1460094948");
    }

    @Test
    void produccionQuedaVacia() {
        String url = baseNueva();
        flyway(url, PRODUCCION, null).migrate();
        JdbcTemplate jdbc = jdbc(url);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM agrocontrol.rol", Integer.class)).isEqualTo(5);
        for (String tabla : List.of("usuario", "predio", "parcela", "cultivo", "insumo")) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM agrocontrol." + tabla, Integer.class))
                    .as(tabla).isZero();
        }
        assertThat(jdbc.queryForList("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'agrocontrol' AND table_name = 'insumo'""", String.class))
                .contains("categoria", "stock_minimo");
    }

    @Test
    void actualizaDesdeV7ConDatosAntiguos() {
        String url = baseNueva();
        flyway(url, DEMO, "7").migrate();
        JdbcTemplate jdbc = jdbc(url);

        Long usuario = jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);
        Long insumo = jdbc.queryForObject(
                "SELECT id_insumo FROM agrocontrol.insumo WHERE nombre = 'Urea 46%'", Long.class);
        Long abierta = jdbc.queryForObject(
                "SELECT min(id_campana) FROM agrocontrol.campana WHERE estado <> 'FINALIZADA'", Long.class);
        Long cerrada = jdbc.queryForObject(
                "SELECT min(id_campana) FROM agrocontrol.campana WHERE estado = 'FINALIZADA'", Long.class);
        Long parcelaAbierta = jdbc.queryForObject(
                "SELECT id_parcela FROM agrocontrol.campana WHERE id_campana = ?", Long.class, abierta);
        Long parcelaCerrada = jdbc.queryForObject(
                "SELECT id_parcela FROM agrocontrol.campana WHERE id_campana = ?", Long.class, cerrada);

        String planificar = """
                INSERT INTO agrocontrol.labor (id_campana, id_parcela, tipo, fecha_plan, estado)
                VALUES (?, ?, 'PRUEBA', current_date, ?) RETURNING id_labor""";
        Long conConsumos = jdbc.queryForObject(planificar, Long.class, abierta, parcelaAbierta, "EN_CURSO");
        Long asignada = jdbc.queryForObject(planificar, Long.class, abierta, parcelaAbierta, "PLANIFICADA");
        Long huerfana = jdbc.queryForObject(planificar, Long.class, cerrada, parcelaCerrada, "PLANIFICADA");
        jdbc.update("INSERT INTO agrocontrol.asignacion_labor (id_labor, id_usuario) VALUES (?, ?)", asignada, usuario);
        String motivo = "Consumo en labor " + conConsumos + " (PRUEBA)";
        for (int i = 0; i < 2; i++) {
            jdbc.update("INSERT INTO agrocontrol.consumo_labor (id_labor, id_insumo, cantidad) VALUES (?, ?, 5)",
                    conConsumos, insumo);
            jdbc.update("""
                    INSERT INTO agrocontrol.movimiento_insumo (id_insumo, tipo, cantidad, motivo, id_usuario)
                    VALUES (?, 'SALIDA', 5, ?, ?)""", insumo, motivo, usuario);
            jdbc.update("UPDATE agrocontrol.insumo SET stock_actual = stock_actual - 5 WHERE id_insumo = ?", insumo);
        }

        flyway(url, DEMO, null).migrate();

        assertThat(jdbc.queryForList("""
                SELECT id_consumo FROM agrocontrol.movimiento_insumo WHERE motivo = ? AND origen = 'CONSUMO'""",
                Long.class, motivo)).hasSize(2).doesNotContainNull().doesNotHaveDuplicates();
        assertThat(jdbc.queryForMap("SELECT estado, motivo_cancelacion FROM agrocontrol.labor WHERE id_labor = ?", huerfana))
                .containsEntry("estado", "CANCELADA").containsEntry("motivo_cancelacion", "Campaña finalizada");
        assertThat(jdbc.queryForObject("SELECT estado FROM agrocontrol.labor WHERE id_labor = ?", String.class, asignada))
                .isEqualTo("ASIGNADA");
        assertThat(jdbc.queryForObject("""
                SELECT m.cantidad = i.stock_actual
                FROM agrocontrol.movimiento_insumo m JOIN agrocontrol.insumo i USING (id_insumo)
                WHERE i.nombre = 'Semilla de soya certificada' AND m.motivo = 'Saldo inicial' AND m.origen = 'AJUSTE'""",
                Boolean.class)).isTrue();
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM agrocontrol.insumo i
                WHERE i.stock_actual <> (SELECT coalesce(sum(CASE m.tipo WHEN 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END), 0)
                                         FROM agrocontrol.movimiento_insumo m WHERE m.id_insumo = i.id_insumo)""",
                Integer.class)).isZero();
    }
}
