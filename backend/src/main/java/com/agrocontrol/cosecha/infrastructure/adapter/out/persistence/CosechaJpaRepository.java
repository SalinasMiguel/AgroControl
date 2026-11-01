package com.agrocontrol.cosecha.infrastructure.adapter.out.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CosechaJpaRepository extends JpaRepository<CosechaJpaEntity, Long> {
    List<CosechaJpaEntity> findByCampanaIdOrderByFechaDesc(Long campanaId);

    // SELECT ... FOR UPDATE: de dos correcciones simultáneas, la segunda espera y la lee anulada
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CosechaJpaEntity c where c.id = :id")
    Optional<CosechaJpaEntity> findByIdParaActualizar(Long id);
}
