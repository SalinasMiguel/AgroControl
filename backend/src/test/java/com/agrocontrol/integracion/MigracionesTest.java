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
}
