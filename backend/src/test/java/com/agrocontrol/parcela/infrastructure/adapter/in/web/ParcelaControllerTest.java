package com.agrocontrol.parcela.infrastructure.adapter.in.web;

import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.EstadoCuenta;
import com.agrocontrol.auth.infrastructure.security.SecurityConfig;
import com.agrocontrol.parcela.application.ParcelaService;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Comprueba el contrato HTTP: códigos de estado, formato ProblemDetail del GlobalExceptionHandler
// y la matriz de permisos de SecurityConfig.
@WebMvcTest(ParcelaController.class)
@Import(SecurityConfig.class)
class ParcelaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ParcelaService service;

    // Lo pide el CommandLineRunner de AgroControlApplication, que también se carga en este slice.
    @MockBean
    private RolRepository rolRepository;

    @MockBean
    private AuthService authService;

    @BeforeEach
    void cuentaActiva() {
        when(authService.estadoCuenta(1L)).thenReturn(Optional.of(new EstadoCuenta(true, 0, false)));
    }

    @Test
    void crearDevuelve201() throws Exception {
        when(service.crear(eq(1L), eq("P-01"), any()))
                .thenReturn(new Parcela(10L, 1L, "P-01", new BigDecimal("2.50")));

        mockMvc.perform(post("/api/parcelas").with(como("ADMINISTRADOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predioId\":1,\"codigo\":\"P-01\",\"areaHa\":2.5}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.estado").value("DISPONIBLE"));
    }

    @Test
    void crearSinCodigoDevuelve400ConErroresPorCampo() throws Exception {
        mockMvc.perform(post("/api/parcelas").with(como("ADMINISTRADOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predioId\":1,\"codigo\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.codigo").exists());
    }

    @Test
    void estadoInvalidoDevuelve400() throws Exception {
        mockMvc.perform(put("/api/parcelas/10").with(como("ADMINISTRADOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predioId\":1,\"codigo\":\"P-01\",\"estado\":\"QUEMADA\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.estado").exists());
    }

    @Test
    void parcelaInexistenteDevuelve404() throws Exception {
        when(service.obtener(99L)).thenThrow(new RecursoNoEncontradoException("No existe la parcela con id: 99"));

        mockMvc.perform(get("/api/parcelas/99").with(como("OPERARIO")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No existe la parcela con id: 99"));
    }

    @Test
    void moverAPredioInactivoDevuelve409() throws Exception {
        when(service.actualizar(eq(10L), eq(2L), eq("P-01"), any(), any()))
                .thenThrow(new ConflictoException("predio inactivo"));

        mockMvc.perform(put("/api/parcelas/10").with(como("ADMINISTRADOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predioId\":2,\"codigo\":\"P-01\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/parcelas/99"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Debe iniciar sesión"));
    }

    @Test
    void rolSinPermisoNoPuedeCrearDevuelve403() throws Exception {
        mockMvc.perform(post("/api/parcelas").with(como("OPERARIO")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"predioId\":1,\"codigo\":\"P-01\",\"areaHa\":2.5}"))
                .andExpect(status().isForbidden());
    }

    // JWT simulado con el rol dado, igual al que arma SecurityConfig a partir del claim "rol"
    private static RequestPostProcessor como(String rol) {
        return jwt().jwt(j -> j.subject("1").claim("rol", rol))
                .authorities(new SimpleGrantedAuthority("ROLE_" + rol));
    }
}
