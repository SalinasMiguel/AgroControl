package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConsumoLaborJpaRepository extends JpaRepository<ConsumoLaborJpaEntity, Long> {
    List<ConsumoLaborJpaEntity> findByLaborIdOrderByFechaAsc(Long laborId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ConsumoLaborJpaEntity c where c.id = :id")
    Optional<ConsumoLaborJpaEntity> findByIdParaActualizar(Long id);
}
