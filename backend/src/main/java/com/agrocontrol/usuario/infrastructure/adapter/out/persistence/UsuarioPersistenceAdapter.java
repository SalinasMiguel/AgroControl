package com.agrocontrol.usuario.infrastructure.adapter.out.persistence;

import com.agrocontrol.auth.domain.Roles;
import com.agrocontrol.rol.infrastructure.adapter.out.persistence.RolJpaEntity;
import com.agrocontrol.rol.infrastructure.adapter.out.persistence.RolJpaRepository;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UsuarioPersistenceAdapter implements UsuarioRepository {

    private final UsuarioJpaRepository jpaRepository;
    private final RolJpaRepository rolJpaRepository;

    public UsuarioPersistenceAdapter(UsuarioJpaRepository jpaRepository, RolJpaRepository rolJpaRepository) {
        this.jpaRepository = jpaRepository;
        this.rolJpaRepository = rolJpaRepository;
    }

    @Override
    public Usuario guardar(Usuario usuario) {
        // Referencia perezosa: solo necesitamos el id_rol para la FK, no cargar el rol completo
        RolJpaEntity rol = rolJpaRepository.getReferenceById(usuario.getRolId());
        UsuarioJpaEntity guardado = jpaRepository.save(UsuarioPersistenceMapper.toEntity(usuario, rol));
        return UsuarioPersistenceMapper.toDomain(guardado);
    }

    @Override
    public Optional<Usuario> buscarPorId(Long id) {
        return jpaRepository.findById(id).map(UsuarioPersistenceMapper::toDomain);
    }

    @Override
    public Optional<Usuario> buscarPorEmail(String email) {
        return jpaRepository.findByEmailIgnoreCase(email).map(UsuarioPersistenceMapper::toDomain);
    }

    @Override
    public List<Usuario> listarTodos() {
        return jpaRepository.findAll().stream()
                .map(UsuarioPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public boolean existePorEmail(String email) {
        return jpaRepository.existsByEmailIgnoreCase(email);
    }

    @Override
    public boolean existeEmailEnOtroUsuario(String email, Long idExcluido) {
        return jpaRepository.existsByEmailIgnoreCaseAndIdNot(email, idExcluido);
    }

    @Override
    public long contarAdministradoresActivos() {
        return jpaRepository.countByActivoTrueAndRol_Nombre(Roles.ADMINISTRADOR);
    }
}
