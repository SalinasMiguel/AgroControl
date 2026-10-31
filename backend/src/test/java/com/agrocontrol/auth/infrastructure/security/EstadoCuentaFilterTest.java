package com.agrocontrol.auth.infrastructure.security;

import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.EstadoCuenta;
import com.agrocontrol.auth.application.Sesion;
import com.agrocontrol.auth.infrastructure.adapter.in.web.AuthController;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.domain.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class EstadoCuentaFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    // Lo pide el CommandLineRunner de AgroControlApplication, que también se carga en este slice.
    @MockBean
    private RolRepository rolRepository;

    private static RequestPostProcessor token(Object version) {
        return jwt().jwt(j -> {
            j.subject("1");
            if (version != null) {
                j.claim("ver", version);
            }
        });
    }

    private void cuenta(boolean activo, int version, boolean pendiente) {
        when(authService.estadoCuenta(1L)).thenReturn(Optional.of(new EstadoCuenta(activo, version, pendiente)));
        when(authService.sesionActual(eq(1L), anyString())).thenReturn(new Sesion("t",
                new Usuario(1L, "Ana", "ana@agrocontrol.com", "h", 2L), "OPERARIO"));
    }

    @Test
    void usuarioInexistenteDevuelve401() throws Exception {
        when(authService.estadoCuenta(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me").with(token(0))).andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioInactivoDevuelve401() throws Exception {
        cuenta(false, 0, false);

        mockMvc.perform(get("/api/auth/me").with(token(0))).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenConVersionViejaDevuelve401() throws Exception {
        cuenta(true, 2, false);

        mockMvc.perform(get("/api/auth/me").with(token(1))).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSinVerCuentaComoVersionCero() throws Exception {
        cuenta(true, 0, false);

        mockMvc.perform(get("/api/auth/me").with(token(null))).andExpect(status().isOk());
    }

    @Test
    void clavePendienteBloqueaConMensaje403() throws Exception {
        cuenta(true, 0, true);

        mockMvc.perform(get("/api/predios").with(token(0)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Debe cambiar su contraseña antes de continuar"));
    }

    @Test
    void clavePendientePermiteMeYCambiar() throws Exception {
        cuenta(true, 0, true);
        when(authService.cambiarPassword(eq(1L), any())).thenReturn(new Sesion("t",
                new Usuario(1L, "Ana", "ana@agrocontrol.com", "h", 2L), "OPERARIO"));

        mockMvc.perform(get("/api/auth/me").with(token(0))).andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/cambiar-password").with(token(0))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"ClaveActual1\",\"passwordNueva\":\"ClaveNueva2\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void sinTokenNoConsultaLaCuenta() throws Exception {
        mockMvc.perform(get("/api/predios")).andExpect(status().isUnauthorized());

        verify(authService, never()).estadoCuenta(any());
    }
}
