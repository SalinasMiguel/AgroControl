package com.agrocontrol.insumo.domain;

import java.util.List;

public interface EquivalenciaRepository {
    List<Long> listarEquivalentes(Long insumoId);
    void vincular(Long menorId, Long mayorId);
    void desvincular(Long menorId, Long mayorId);
}
