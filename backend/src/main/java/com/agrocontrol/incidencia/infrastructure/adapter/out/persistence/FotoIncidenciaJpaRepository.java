package com.agrocontrol.incidencia.infrastructure.adapter.out.persistence;

import com.agrocontrol.incidencia.domain.FotoIncidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FotoIncidenciaJpaRepository extends JpaRepository<FotoIncidenciaJpaEntity, Long> {

    // Sin la columna datos: un listado no debe traer las imágenes
    @Query("""
            select new com.agrocontrol.incidencia.domain.FotoIncidencia(
                f.id, f.incidenciaId, f.tipoContenido, f.tamano, f.usuarioId, f.fecha)
            from FotoIncidenciaJpaEntity f where f.incidenciaId = :incidenciaId order by f.fecha, f.id""")
    List<FotoIncidencia> listarSinDatos(Long incidenciaId);

    Optional<FotoIncidenciaJpaEntity> findByIdAndIncidenciaId(Long id, Long incidenciaId);

    long countByIncidenciaId(Long incidenciaId);
}
