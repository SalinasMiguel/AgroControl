package com.agrocontrol.usuario.infrastructure.adapter.out.persistence;

import com.agrocontrol.rol.infrastructure.adapter.out.persistence.RolJpaEntity;
import com.agrocontrol.usuario.domain.Usuario;

public final class UsuarioPersistenceMapper {

    private UsuarioPersistenceMapper() {
    }

    public static Usuario toDomain(UsuarioJpaEntity entity) {
        return new Usuario(
                entity.getId(),
                entity.getNombreCompleto(),
                entity.getEmail(),
                entity.getPasswordHash(),
                entity.getRol().getId(),
                entity.isActivo(),
                entity.getCreadoEn(),
                entity.getTokenVersion(),
                entity.isDebeCambiarPassword()
        );
    }

    public static UsuarioJpaEntity toEntity(Usuario usuario, RolJpaEntity rol) {
        return new UsuarioJpaEntity(
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                usuario.getPasswordHash(),
                rol,
                usuario.isActivo(),
                usuario.getCreadoEn(),
                usuario.getTokenVersion(),
                usuario.isDebeCambiarPassword()
        );
    }
}
