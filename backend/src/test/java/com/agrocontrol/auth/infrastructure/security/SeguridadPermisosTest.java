package com.agrocontrol.auth.infrastructure.security;

import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.EstadoCuenta;
import com.agrocontrol.campana.application.AvanceCampanaService;
import com.agrocontrol.campana.application.CampanaService;
import com.agrocontrol.campana.infrastructure.adapter.in.web.CampanaController;
import com.agrocontrol.cosecha.application.CosechaService;
import com.agrocontrol.cosecha.infrastructure.adapter.in.web.CosechaController;
import com.agrocontrol.incidencia.application.IncidenciaService;
import com.agrocontrol.incidencia.infrastructure.adapter.in.web.IncidenciaController;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.InsumoController;
import com.agrocontrol.labor.application.LaborService;
import com.agrocontrol.labor.infrastructure.adapter.in.web.LaborController;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.application.UsuarioService;
import com.agrocontrol.usuario.infrastructure.adapter.in.web.UsuarioController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// La matriz de SecurityConfig para las acciones de corregir y anular. Con cuerpo {}: si el rol
// pasa, la validación responde 400; si no pasa, seguridad responde 403 antes de llegar al controlador.
@WebMvcTest({IncidenciaController.class, CosechaController.class, LaborController.class, InsumoController.class,
        CampanaController.class, UsuarioController.class})
@Import(SecurityConfig.class)
class SeguridadPermisosTest {

    private static final List<String> ROLES =
            List.of("ADMINISTRADOR", "JEFE_DE_CAMPO", "OPERARIO", "ALMACENERO", "SUPERVISOR");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;
    @MockBean
    private RolRepository rolRepository;
    @MockBean
    private IncidenciaService incidenciaService;
    @MockBean
    private CosechaService cosechaService;
    @MockBean
    private LaborService laborService;
    @MockBean
    private InventarioService inventarioService;
    @MockBean
    private CampanaService campanaService;
    @MockBean
    private AvanceCampanaService avanceCampanaService;
    @MockBean
    private UsuarioService usuarioService;

    @BeforeEach
    void cuentaActiva() {
        when(authService.estadoCuenta(1L)).thenReturn(Optional.of(new EstadoCuenta(true, 0, false)));
    }

    private static Stream<Arguments> matriz() {
        List<Arguments> casos = new ArrayList<>();
        agregar(casos, "POST", "/api/incidencias/1/anular", "ADMINISTRADOR", "JEFE_DE_CAMPO", "SUPERVISOR");
        agregar(casos, "POST", "/api/cosechas/1/anular", "ADMINISTRADOR", "JEFE_DE_CAMPO", "ALMACENERO");
        agregar(casos, "POST", "/api/labores/1/consumos/2/anular", "ADMINISTRADOR", "JEFE_DE_CAMPO");
        agregar(casos, "POST", "/api/insumos/1/movimientos/2/anular", "ADMINISTRADOR", "ALMACENERO");
        agregar(casos, "POST", "/api/insumos/1/ajustes", "ADMINISTRADOR", "ALMACENERO");
        agregar(casos, "POST", "/api/labores/1/cancelar", "ADMINISTRADOR", "JEFE_DE_CAMPO");
        agregar(casos, "POST", "/api/labores/1/reabrir", "ADMINISTRADOR", "JEFE_DE_CAMPO");
        agregar(casos, "POST", "/api/campanas/1/cancelar", "ADMINISTRADOR", "JEFE_DE_CAMPO");
        agregar(casos, "POST", "/api/campanas/1/reabrir", "ADMINISTRADOR", "JEFE_DE_CAMPO");
        agregar(casos, "PUT", "/api/usuarios/1", "ADMINISTRADOR");
        return casos.stream();
    }

    private static void agregar(List<Arguments> casos, String metodo, String ruta, String... permitidos) {
        Set<String> conPermiso = Set.of(permitidos);
        ROLES.forEach(rol -> casos.add(Arguments.of(metodo, ruta, rol, conPermiso.contains(rol))));
    }

    @ParameterizedTest(name = "{0} {1} como {2}: permitido = {3}")
    @MethodSource("matriz")
    void respetaLaMatriz(String metodo, String ruta, String rol, boolean permitido) throws Exception {
        mockMvc.perform(request(HttpMethod.valueOf(metodo), ruta)
                        .with(jwt().jwt(j -> j.subject("1").claim("rol", rol))
                                .authorities(new SimpleGrantedAuthority("ROLE_" + rol)))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(permitido ? status().isBadRequest() : status().isForbidden());
    }
}
