package com.agrocontrol.usuario.infrastructure.config;

import com.agrocontrol.auth.domain.Roles;
import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

// Una base de producción nace sin usuarios: este administrador es la única forma de entrar la primera vez.
// Sin @Auditable: al arrancar no hay sesión de la que tomar el autor.
@Component
@Profile("produccion")
public class PrimerAdministrador implements ApplicationRunner {

    private static final int LARGO_MINIMO_CLAVE = 8;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CodificadorPassword codificadorPassword;
    private final String email;
    private final String password;

    public PrimerAdministrador(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                               CodificadorPassword codificadorPassword,
                               @Value("${AGROCONTROL_ADMIN_EMAIL:}") String email,
                               @Value("${AGROCONTROL_ADMIN_PASSWORD:}") String password) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.codificadorPassword = codificadorPassword;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!usuarioRepository.listarTodos().isEmpty()) {
            return;
        }
        if (email.isBlank() || password.length() < LARGO_MINIMO_CLAVE) {
            throw new IllegalStateException("Base sin usuarios: defina AGROCONTROL_ADMIN_EMAIL y "
                    + "AGROCONTROL_ADMIN_PASSWORD (mínimo " + LARGO_MINIMO_CLAVE + " caracteres)");
        }
        Long rolId = rolRepository.listarTodos().stream()
                .filter(rol -> Roles.ADMINISTRADOR.equals(rol.getNombre()))
                .map(Rol::getId).findFirst()
                .orElseThrow(() -> new IllegalStateException("Falta el rol " + Roles.ADMINISTRADOR));
        Usuario administrador = new Usuario(null, "Administrador", email, codificadorPassword.codificar(password), rolId);
        administrador.exigirCambioPassword();
        usuarioRepository.guardar(administrador);
    }
}
