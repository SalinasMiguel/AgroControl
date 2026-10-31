package com.agrocontrol.usuario.infrastructure.adapter.in.web;

import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.EstadoCuenta;
import com.agrocontrol.auth.infrastructure.security.SecurityConfig;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.application.ClaveTemporal;
import com.agrocontrol.usuario.application.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UsuarioController.class)
@Import(SecurityConfig.class)
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UsuarioService service;
    @MockBean
    private AuthService authService;
    // Lo pide el CommandLineRunner de AgroControlApplication, que también se carga en este slice.
    @MockBean
    private RolRepository rolRepository;

    @BeforeEach
    void cuentaActiva() {
        when(authService.estadoCuenta(1L)).thenReturn(Optional.of(new EstadoCuenta(true, 0, false)));
    }

    private static RequestPostProcessor como(String rol) {
        return jwt().jwt(j -> j.subject("1").claim("rol", rol)).authorities(new SimpleGrantedAuthority("ROLE_" + rol));
    }

    @Test
    void restablecerRespondeNoStore() throws Exception {
        when(service.restablecerPassword(5L)).thenReturn(new ClaveTemporal("Abcdefgh2345"));

        mockMvc.perform(post("/api/usuarios/5/restablecer-password").with(como("ADMINISTRADOR")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.passwordTemporal").value("Abcdefgh2345"));
    }

    @Test
    void soloElAdministradorRestablece() throws Exception {
        mockMvc.perform(post("/api/usuarios/5/restablecer-password").with(como("JEFE_DE_CAMPO")))
                .andExpect(status().isForbidden());
    }
}
