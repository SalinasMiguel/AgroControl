package com.agrocontrol.campana.infrastructure.adapter.out.persistence;

import com.agrocontrol.campana.domain.EstadoCampana;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CampanaJpaRepository extends JpaRepository<CampanaJpaEntity, Long> {
    List<CampanaJpaEntity> findByParcelaIdOrderByFechaInicioDesc(Long parcelaId);
    boolean existsByParcelaId(Long parcelaId);
    boolean existsByParcelaIdAndEstadoIn(Long parcelaId, Collection<EstadoCampana> estados);
}
