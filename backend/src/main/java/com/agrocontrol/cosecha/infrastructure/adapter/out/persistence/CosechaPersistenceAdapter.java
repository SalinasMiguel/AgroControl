package com.agrocontrol.cosecha.infrastructure.adapter.out.persistence;

import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CosechaPersistenceAdapter implements CosechaRepository {

    private final CosechaJpaRepository jpaRepository;

    public CosechaPersistenceAdapter(CosechaJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Cosecha guardar(Cosecha cosecha) {
        return CosechaPersistenceMapper.toDomain(jpaRepository.save(CosechaPersistenceMapper.toEntity(cosecha)));
    }

    @Override
    public Optional<Cosecha> buscarPorId(Long id) {
        return jpaRepository.findById(id).map(CosechaPersistenceMapper::toDomain);
    }

    @Override
    public List<Cosecha> listarTodas() {
        return jpaRepository.findAll(Sort.by(Sort.Direction.DESC, "fecha"))
                .stream().map(CosechaPersistenceMapper::toDomain).toList();
    }

    @Override
    public List<Cosecha> listarPorCampana(Long campanaId) {
        return jpaRepository.findByCampanaIdOrderByFechaDesc(campanaId)
                .stream().map(CosechaPersistenceMapper::toDomain).toList();
    }
}
