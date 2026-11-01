package com.agrocontrol.incidencia.infrastructure.adapter.out.persistence;

import com.agrocontrol.incidencia.domain.FotoIncidencia;
import com.agrocontrol.incidencia.domain.FotoIncidenciaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class FotoIncidenciaPersistenceAdapter implements FotoIncidenciaRepository {

    private final FotoIncidenciaJpaRepository jpaRepository;

    public FotoIncidenciaPersistenceAdapter(FotoIncidenciaJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public FotoIncidencia guardar(FotoIncidencia f) {
        return aDominio(jpaRepository.save(new FotoIncidenciaJpaEntity(f.id(), f.incidenciaId(), f.tipoContenido(),
                f.tamano(), f.datos(), f.usuarioId(), f.fecha())));
    }

    @Override
    public List<FotoIncidencia> listarPorIncidencia(Long incidenciaId) {
        return jpaRepository.listarSinDatos(incidenciaId);
    }

    @Override
    public Optional<FotoIncidencia> buscar(Long incidenciaId, Long fotoId) {
        return jpaRepository.findByIdAndIncidenciaId(fotoId, incidenciaId).map(FotoIncidenciaPersistenceAdapter::aDominio);
    }

    @Override
    public long contarPorIncidencia(Long incidenciaId) {
        return jpaRepository.countByIncidenciaId(incidenciaId);
    }

    private static FotoIncidencia aDominio(FotoIncidenciaJpaEntity e) {
        return new FotoIncidencia(e.getId(), e.getIncidenciaId(), e.getTipoContenido(), e.getTamano(), e.getDatos(),
                e.getUsuarioId(), e.getFecha());
    }
}
