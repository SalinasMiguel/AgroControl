package com.agrocontrol.usuario.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.auth.domain.Roles;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.rol.domain.exception.RolNoEncontradoException;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.usuario.application.command.ActualizarUsuarioCommand;
import com.agrocontrol.usuario.application.command.RegistrarUsuarioCommand;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.EmailUsuarioDuplicadoException;
import com.agrocontrol.usuario.domain.exception.UsuarioNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

public class UsuarioService {

    private static final int LARGO_CLAVE_TEMPORAL = 12;
    // Sin caracteres que se confunden al dictarlos (I, l, O, 0, 1).
    private static final String ALFABETO_CLAVE = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CodificadorPassword codificadorPassword;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                          CodificadorPassword codificadorPassword) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.codificadorPassword = codificadorPassword;
    }

    @Auditable(entidad = "USUARIO", accion = "CREAR")
    @Transactional
    public Usuario registrar(RegistrarUsuarioCommand command) {
        // El padre debe existir antes de crear el hijo: se detecta aquí (404), no como error de FK (500)
        if (rolRepository.buscarPorId(command.rolId()).isEmpty()) {
            throw new RolNoEncontradoException(command.rolId());
        }
        if (usuarioRepository.existePorEmail(command.email())) {
            throw new EmailUsuarioDuplicadoException(command.email());
        }
        Usuario nuevo = new Usuario(
                null,
                command.nombreCompleto(),
                command.email(),
                codificadorPassword.codificar(command.password()),
                command.rolId()
        );
        return usuarioRepository.guardar(nuevo);
    }

    @Auditable(entidad = "USUARIO", accion = "ACTUALIZAR")
    @Transactional
    public Usuario actualizar(Long id, ActualizarUsuarioCommand command) {
        Usuario usuario = obtener(id);
        if (rolRepository.buscarPorId(command.rolId()).isEmpty()) {
            throw new RolNoEncontradoException(command.rolId());
        }
        if (usuarioRepository.existeEmailEnOtroUsuario(command.email(), id)) {
            throw new EmailUsuarioDuplicadoException(command.email());
        }
        if (!command.rolId().equals(usuario.getRolId())) {
            exigirOtroAdministrador(usuario);
        }
        usuario.actualizarDatos(command.nombreCompleto(), command.email(), command.rolId());
        return usuarioRepository.guardar(usuario);
    }

    @Auditable(entidad = "USUARIO", accion = "DESACTIVAR")
    @Transactional
    public Usuario desactivar(Long id, Long actorId) {
        if (id.equals(actorId)) {
            throw new ConflictoException("No puede desactivar su propia cuenta");
        }
        Usuario usuario = obtener(id);
        exigirOtroAdministrador(usuario);
        usuario.desactivar();
        return usuarioRepository.guardar(usuario);
    }

    @Auditable(entidad = "USUARIO", accion = "ACTIVAR")
    @Transactional
    public Usuario activar(Long id) {
        Usuario usuario = obtener(id);
        usuario.activar();
        return usuarioRepository.guardar(usuario);
    }

    // La temporal se devuelve una sola vez y solo se guarda su hash.
    @Auditable(entidad = "USUARIO", accion = "RESTABLECER_PASSWORD")
    @Transactional
    public ClaveTemporal restablecerPassword(Long id) {
        Usuario usuario = obtener(id);
        String temporal = generarClaveTemporal();
        usuario.restablecerPassword(codificadorPassword.codificar(temporal));
        usuarioRepository.guardar(usuario);
        return new ClaveTemporal(temporal);
    }

    private static String generarClaveTemporal() {
        StringBuilder clave = new StringBuilder(LARGO_CLAVE_TEMPORAL);
        for (int i = 0; i < LARGO_CLAVE_TEMPORAL; i++) {
            clave.append(ALFABETO_CLAVE.charAt(ALEATORIO.nextInt(ALFABETO_CLAVE.length())));
        }
        return clave.toString();
    }

    private void exigirOtroAdministrador(Usuario usuario) {
        if (usuario.isActivo() && esAdministrador(usuario) && usuarioRepository.contarAdministradoresActivos() <= 1) {
            throw new ConflictoException("Debe quedar al menos un administrador activo");
        }
    }

    private boolean esAdministrador(Usuario usuario) {
        return rolRepository.buscarPorId(usuario.getRolId())
                .map(rol -> Roles.ADMINISTRADOR.equals(rol.getNombre())).orElse(false);
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return usuarioRepository.listarTodos();
    }

    @Transactional(readOnly = true)
    public Usuario obtener(Long id) {
        return usuarioRepository.buscarPorId(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException(id));
    }
}
