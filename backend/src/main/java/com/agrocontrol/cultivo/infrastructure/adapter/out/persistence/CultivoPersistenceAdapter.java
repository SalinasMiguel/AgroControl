package com.agrocontrol.cultivo.infrastructure.adapter.out.persistence;

import com.agrocontrol.cultivo.domain.Cultivo;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CultivoPersistenceAdapter implements CultivoRepository {

    private final CultivoJpaRepository jpaRepository;

    public CultivoPersistenceAdapter(CultivoJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Cultivo guardar(Cultivo cultivo) {
        return CultivoPersistenceMapper.toDomain(jpaRepository.save(CultivoPersistenceMapper.toEntity(cultivo)));
    }

    @Override
    public Optional<Cultivo> buscarPorId(Long id) {
        return jpaRepository.findById(id).map(CultivoPersistenceMapper::toDomain);
    }

    @Override
    public List<Cultivo> listarTodos() {
        return jpaRepository.findAll(Sort.by("nombre")).stream().map(CultivoPersistenceMapper::toDomain).toList();
    }

    @Override
    public boolean existePorId(Long id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public boolean existePorNombre(String nombre) {
        return jpaRepository.existsByNombreIgnoreCase(nombre);
    }

    @Override
    public boolean existePorNombreEnOtro(String nombre, Long idExcluido) {
        return jpaRepository.existsByNombreIgnoreCaseAndIdNot(nombre, idExcluido);
    }
}
