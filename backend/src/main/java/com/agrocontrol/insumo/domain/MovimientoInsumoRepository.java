package com.agrocontrol.insumo.domain;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MovimientoInsumoRepository {
    MovimientoInsumo guardar(MovimientoInsumo movimiento);
    Optional<MovimientoInsumo> buscarMovimientoParaActualizar(Long id);
    Optional<MovimientoInsumo> buscarPorConsumo(Long consumoId);
    List<MovimientoInsumo> listarPorInsumo(Long insumoId);
    // Lo que de verdad salió del almacén en [desde, hasta): sin anulados, ajustes ni reversiones
    List<MovimientoInsumo> listarSalidasEntre(LocalDateTime desde, LocalDateTime hasta);
}
