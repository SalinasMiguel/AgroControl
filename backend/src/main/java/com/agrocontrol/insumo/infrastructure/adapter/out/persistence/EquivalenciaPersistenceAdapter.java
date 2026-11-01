package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.insumo.domain.EquivalenciaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;

// Tabla de dos columnas sin más datos: SQL directo, sin entidad JPA.
@Repository
public class EquivalenciaPersistenceAdapter implements EquivalenciaRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Long> listarEquivalentes(Long insumoId) {
        List<?> ids = entityManager.createNativeQuery("""
                        select id_equivalente from agrocontrol.insumo_equivalencia where id_insumo = :id
                        union
                        select id_insumo from agrocontrol.insumo_equivalencia where id_equivalente = :id""")
                .setParameter("id", insumoId).getResultList();
        return ids.stream().map(id -> ((Number) id).longValue()).sorted().toList();
    }

    @Override
    public void vincular(Long menorId, Long mayorId) {
        entityManager.createNativeQuery("""
                        insert into agrocontrol.insumo_equivalencia (id_insumo, id_equivalente)
                        values (:menor, :mayor) on conflict do nothing""")
                .setParameter("menor", menorId).setParameter("mayor", mayorId).executeUpdate();
    }

    @Override
    public void desvincular(Long menorId, Long mayorId) {
        entityManager.createNativeQuery(
                        "delete from agrocontrol.insumo_equivalencia where id_insumo = :menor and id_equivalente = :mayor")
                .setParameter("menor", menorId).setParameter("mayor", mayorId).executeUpdate();
    }
}
