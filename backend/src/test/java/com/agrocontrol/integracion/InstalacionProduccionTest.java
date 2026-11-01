package com.agrocontrol.integracion;

import com.agrocontrol.AgroControlApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

// Una instalación real de punta a punta: perfil produccion sobre una base vacía.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "AGROCONTROL_JWT_SECRET=clave-de-prueba-de-instalacion-de-32-caracteres",
        "AGROCONTROL_ADMIN_EMAIL=admin@empresa.test",
        "AGROCONTROL_ADMIN_PASSWORD=ClaveInicial1"
})
@ActiveProfiles("produccion")
@Testcontainers(disabledWithoutDocker = true)
class InstalacionProduccionTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    private TestRestTemplate http;
    @Autowired
    private JdbcTemplate jdbc;

    private int contar(String tabla) {
        return jdbc.queryForObject("SELECT count(*) FROM agrocontrol." + tabla, Integer.class);
    }

    @Test
    void arrancaVaciaConUnAdministrador() {
        assertThat(contar("rol")).isEqualTo(5);
        assertThat(contar("usuario")).isEqualTo(1);
        assertThat(contar("predio")).isZero();
        assertThat(http.getForObject("/api/health", Map.class).get("demo")).isEqualTo(false);
    }

    @Test
    void elAdministradorQuedaBloqueadoHastaCambiarLaClave() {
        @SuppressWarnings("unchecked")
        Map<String, Object> sesion = http.postForObject("/api/auth/login",
                Map.of("email", "admin@empresa.test", "password", "ClaveInicial1"), Map.class);
        assertThat(sesion.get("debeCambiarPassword")).isEqualTo(true);
        String token = (String) sesion.get("token");

        assertThat(conToken("/api/predios", HttpMethod.GET, token, null).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> cambio = conToken("/api/auth/cambiar-password", HttpMethod.POST, token,
                Map.of("passwordActual", "ClaveInicial1", "passwordNueva", "ClaveNueva22"));
        assertThat(cambio.getStatusCode()).isEqualTo(HttpStatus.OK);

        String tokenNuevo = (String) cambio.getBody().get("token");
        ResponseEntity<String> predios = http.exchange("/api/predios", HttpMethod.GET,
                new HttpEntity<>(bearer(tokenNuevo)), String.class);
        assertThat(predios.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(predios.getBody()).isEqualTo("[]");
        // el token anterior ya no sirve
        assertThat(http.exchange("/api/predios", HttpMethod.GET, new HttpEntity<>(bearer(token)), String.class)
                .getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void sinSecretoNoArranca() {
        Throwable fallo = catchThrowable(() -> new SpringApplicationBuilder(AgroControlApplication.class)
                .profiles("produccion")
                // Como argumentos: properties() tiene menos prioridad que application.properties,
                // y esta prueba jamás debe conectarse a la base local.
                .run("--server.port=0",
                        "--spring.datasource.url=" + postgres.getJdbcUrl(),
                        "--spring.datasource.username=" + postgres.getUsername(),
                        "--spring.datasource.password=" + postgres.getPassword()));

        assertThat(fallo).isNotNull();
        StringWriter traza = new StringWriter();
        fallo.printStackTrace(new PrintWriter(traza));
        assertThat(traza.toString()).contains("AGROCONTROL_JWT_SECRET");
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private ResponseEntity<Map> conToken(String ruta, HttpMethod metodo, String token, Object cuerpo) {
        return http.exchange(ruta, metodo, new HttpEntity<>(cuerpo, bearer(token)), Map.class);
    }
}
