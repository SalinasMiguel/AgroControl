package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.insumo.domain.OrigenMovimiento;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MovimientoInsumoJpaRepository extends JpaRepository<MovimientoInsumoJpaEntity, Long> {
    List<MovimientoInsumoJpaEntity> findByInsumoIdOrderByFechaDesc(Long insumoId);

    // SELECT ... FOR UPDATE: de dos anulaciones simultáneas, la segunda espera y ve la primera
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from MovimientoInsumoJpaEntity m where m.id = :id")
    Optional<MovimientoInsumoJpaEntity> findByIdParaActualizar(Long id);

    Optional<MovimientoInsumoJpaEntity> findByConsumoIdAndOrigen(Long consumoId, OrigenMovimiento origen);

    @Query("""
            select m from MovimientoInsumoJpaEntity m
            where m.tipo = :tipo and m.fecha >= :desde and m.fecha < :hasta
              and m.anulacion.anulado = false and m.origen in :origenes""")
    List<MovimientoInsumoJpaEntity> buscarSalidasReales(TipoMovimiento tipo, LocalDateTime desde, LocalDateTime hasta,
                                                        Collection<OrigenMovimiento> origenes);
}
