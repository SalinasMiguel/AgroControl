package com.agrocontrol.insumo.domain;

import java.util.List;
import java.util.Optional;

public interface ConsumoLaborRepository {
    ConsumoLabor guardar(ConsumoLabor consumo);
    Optional<ConsumoLabor> buscarConsumoParaActualizar(Long id);
    List<ConsumoLabor> listarPorLabor(Long laborId);
}
