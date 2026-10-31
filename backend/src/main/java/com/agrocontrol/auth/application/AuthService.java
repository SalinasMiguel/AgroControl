package com.agrocontrol.auth.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.auth.application.command.CambiarPasswordCommand;
import com.agrocontrol.auth.domain.GeneradorToken;
import com.agrocontrol.auth.domain.exception.CredencialesInvalidasException;
import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.UsuarioNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CodificadorPassword codificadorPassword;
    private final GeneradorToken generadorToken;

    public AuthService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                       CodificadorPassword codificadorPassword, GeneradorToken generadorToken) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.codificadorPassword = codificadorPassword;
        this.generadorToken = generadorToken;
    }

    @Transactional(readOnly = true)
    public Sesion iniciarSesion(String email, String password) {
        // Mismo mensaje para email inexistente y contraseña errónea: no se revela qué cuentas existen
        Usuario usuario = usuarioRepository.buscarPorEmail(email.trim())
                .filter(u -> codificadorPassword.coincide(password, u.getPasswordHash()))
                .orElseThrow(() -> new CredencialesInvalidasException("Email o contraseña incorrectos"));
        if (!usuario.isActivo()) {
            throw new CredencialesInvalidasException("El usuario está inactivo");
        }
        String rol = nombreRol(usuario);
        return new Sesion(generadorToken.generar(usuario, rol), usuario, rol);
    }

    @Transactional(readOnly = true)
    public Sesion sesionActual(Long usuarioId, String token) {
        Usuario usuario = usuarioRepository.buscarPorId(usuarioId)
                .orElseThrow(() -> new UsuarioNoEncontradoException(usuarioId));
        return new Sesion(token, usuario, nombreRol(usuario));
    }

    // La clave actual incorrecta es 400 y no 401: el cliente web cierra la sesión con cualquier 401.
    @Auditable(entidad = "USUARIO", accion = "CAMBIAR_PASSWORD")
    @Transactional
    public Sesion cambiarPassword(Long usuarioId, CambiarPasswordCommand command) {
        Usuario usuario = usuarioRepository.buscarPorId(usuarioId)
                .orElseThrow(() -> new UsuarioNoEncontradoException(usuarioId));
        if (!codificadorPassword.coincide(command.passwordActual(), usuario.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        if (command.passwordNueva().equals(command.passwordActual())) {
            throw new IllegalArgumentException("La contraseña nueva debe ser distinta de la actual");
        }
        usuario.cambiarPassword(codificadorPassword.codificar(command.passwordNueva()));
        Usuario guardado = usuarioRepository.guardar(usuario);
        String rol = nombreRol(guardado);
        return new Sesion(generadorToken.generar(guardado, rol), guardado, rol);
    }

    private String nombreRol(Usuario usuario) {
        return rolRepository.buscarPorId(usuario.getRolId()).map(Rol::getNombre)
                .orElseThrow(() -> new IllegalStateException("El usuario no tiene un rol válido"));
    }
}
