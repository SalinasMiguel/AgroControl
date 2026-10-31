package com.agrocontrol.auth.infrastructure.security;

import com.agrocontrol.auth.application.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static com.agrocontrol.auth.domain.Roles.ADMINISTRADOR;
import static com.agrocontrol.auth.domain.Roles.ALMACENERO;
import static com.agrocontrol.auth.domain.Roles.JEFE_DE_CAMPO;
import static com.agrocontrol.auth.domain.Roles.OPERARIO;
import static com.agrocontrol.auth.domain.Roles.SUPERVISOR;

@Configuration
public class SecurityConfig {

    private final SecretKey clave;
    private final ObjectMapper objectMapper;

    public SecurityConfig(@Value("${agrocontrol.jwt.secret}") String secreto, ObjectMapper objectMapper) {
        if (secreto.length() < 32) {
            throw new IllegalStateException("agrocontrol.jwt.secret debe tener al menos 32 caracteres");
        }
        this.clave = new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        this.objectMapper = objectMapper;
    }

    // Matriz de permisos por rol. Las lecturas de catálogos (predios, parcelas, cultivos, campañas,
    // insumos, usuarios, roles) quedan abiertas a cualquier usuario autenticado porque todas las
    // pantallas las necesitan para mostrar nombres; lo que cambia por rol es quién puede escribir.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthService authService) throws Exception {
        http
                .addFilterAfter(new EstadoCuentaFilter(authService, this::escribirProblema), BearerTokenAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/health/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                        // Administración: solo el administrador crea usuarios y gestiona roles
                        .requestMatchers(HttpMethod.GET, "/api/usuarios/**", "/api/roles/**").authenticated()
                        .requestMatchers("/api/usuarios/**", "/api/roles/**").hasRole(ADMINISTRADOR)

                        // Bitácora por parcela (RF-14): la consultan quienes supervisan el campo
                        .requestMatchers(HttpMethod.GET, "/api/parcelas/*/bitacora")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, SUPERVISOR)

                        // Predios y parcelas: los configura el administrador
                        .requestMatchers(HttpMethod.GET, "/api/predios/**", "/api/parcelas/**").authenticated()
                        .requestMatchers("/api/predios/**", "/api/parcelas/**").hasRole(ADMINISTRADOR)

                        // Cultivos y campañas: planificación del jefe de campo
                        .requestMatchers(HttpMethod.GET, "/api/cultivos/**", "/api/campanas/**").authenticated()
                        .requestMatchers("/api/cultivos/**", "/api/campanas/**").hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO)

                        // Labores: el jefe planifica y asigna; el operario ejecuta y registra consumos
                        // (solo de sus labores asignadas, RN-05, se valida en LaborController)
                        .requestMatchers(HttpMethod.POST, "/api/labores/*/iniciar", "/api/labores/*/ejecutar", "/api/labores/*/consumos")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, OPERARIO)
                        // Observaciones de campo (RF-09): también el supervisor; el operario solo en sus labores
                        .requestMatchers(HttpMethod.POST, "/api/labores/*/bitacora")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, OPERARIO, SUPERVISOR)
                        .requestMatchers(HttpMethod.GET, "/api/labores/**")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, OPERARIO, SUPERVISOR, ALMACENERO)
                        .requestMatchers("/api/labores/**").hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO)

                        // Inventario: el almacenero registra insumos y movimientos
                        .requestMatchers(HttpMethod.GET, "/api/insumos/*/movimientos")
                                .hasAnyRole(ADMINISTRADOR, ALMACENERO, JEFE_DE_CAMPO, SUPERVISOR)
                        .requestMatchers(HttpMethod.GET, "/api/insumos/**").authenticated()
                        .requestMatchers("/api/insumos/**").hasAnyRole(ADMINISTRADOR, ALMACENERO)

                        // Cosechas: las registran el jefe de campo y el almacenero; el supervisor las consulta
                        .requestMatchers(HttpMethod.GET, "/api/cosechas/**")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, ALMACENERO, SUPERVISOR)
                        .requestMatchers("/api/cosechas/**").hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, ALMACENERO)

                        // Incidencias (RF-12): las reportan quienes están o supervisan el campo;
                        // atenderlas y cerrarlas es tarea de quien gestiona (el operario no las cierra)
                        .requestMatchers(HttpMethod.POST, "/api/incidencias/*/atender", "/api/incidencias/*/resolver")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, SUPERVISOR)
                        .requestMatchers("/api/incidencias/**")
                                .hasAnyRole(ADMINISTRADOR, JEFE_DE_CAMPO, OPERARIO, SUPERVISOR)

                        // Auditoría de cambios críticos (RF-16): solo la consulta el administrador
                        .requestMatchers("/api/auditoria/**").hasRole(ADMINISTRADOR)

                        .requestMatchers("/api/**").authenticated()
                        // Fuera de /api: la web empaquetada en el jar (index.html, assets)
                        .anyRequest().permitAll())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(convertidorRoles()))
                        .authenticationEntryPoint((request, response, ex) ->
                                escribirProblema(response, HttpStatus.UNAUTHORIZED, "Debe iniciar sesión"))
                        .accessDeniedHandler((request, response, ex) ->
                                escribirProblema(response, HttpStatus.FORBIDDEN, "Su rol no tiene permiso para esta operación")))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, e) ->
                                escribirProblema(response, HttpStatus.UNAUTHORIZED, "Debe iniciar sesión"))
                        .accessDeniedHandler((request, response, e) ->
                                escribirProblema(response, HttpStatus.FORBIDDEN, "Su rol no tiene permiso para esta operación")));
        return http.build();
    }

    // El claim "rol" del token (p. ej. OPERARIO) se convierte en la autoridad ROLE_OPERARIO.
    private JwtAuthenticationConverter convertidorRoles() {
        JwtGrantedAuthoritiesConverter autoridades = new JwtGrantedAuthoritiesConverter();
        autoridades.setAuthoritiesClaimName("rol");
        autoridades.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(autoridades);
        return convertidor;
    }

    private void escribirProblema(HttpServletResponse response, HttpStatus estado, String detalle) throws IOException {
        response.setStatus(estado.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ProblemDetail.forStatusAndDetail(estado, detalle));
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(clave));
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(clave).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
