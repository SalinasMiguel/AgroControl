package com.agrocontrol.insumo.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.insumo.domain.EquivalenciaRepository;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// Repuestos o productos que se reemplazan entre sí: vale en los dos sentidos.
public class EquivalenciaService {

    private final EquivalenciaRepository equivalenciaRepository;
    private final InsumoRepository insumoRepository;

    public EquivalenciaService(EquivalenciaRepository equivalenciaRepository, InsumoRepository insumoRepository) {
        this.equivalenciaRepository = equivalenciaRepository;
        this.insumoRepository = insumoRepository;
    }

    @Transactional(readOnly = true)
    public List<Insumo> listar(Long insumoId) {
        verificar(insumoId);
        return equivalenciaRepository.listarEquivalentes(insumoId).stream()
                .map(insumoRepository::buscarPorId)
                .flatMap(Optional::stream)
                .toList();
    }

    @Auditable(entidad = "INSUMO", accion = "VINCULAR_EQUIVALENTE")
    @Transactional
    public void vincular(Long insumoId, Long equivalenteId) {
        if (insumoId.equals(equivalenteId)) {
            throw new IllegalArgumentException("Un insumo no puede ser equivalente de sí mismo");
        }
        verificar(insumoId);
        verificar(equivalenteId);
        equivalenciaRepository.vincular(Math.min(insumoId, equivalenteId), Math.max(insumoId, equivalenteId));
    }

    @Auditable(entidad = "INSUMO", accion = "DESVINCULAR_EQUIVALENTE")
    @Transactional
    public void desvincular(Long insumoId, Long equivalenteId) {
        equivalenciaRepository.desvincular(Math.min(insumoId, equivalenteId), Math.max(insumoId, equivalenteId));
    }

    private void verificar(Long id) {
        if (insumoRepository.buscarPorId(id).isEmpty()) {
            throw new RecursoNoEncontradoException("No existe el insumo con id: " + id);
        }
    }
}
