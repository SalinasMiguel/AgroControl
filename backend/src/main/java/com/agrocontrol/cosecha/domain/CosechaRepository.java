package com.agrocontrol.cosecha.domain;

import java.util.List;
import java.util.Optional;

public interface CosechaRepository {
    Cosecha guardar(Cosecha cosecha);
    Optional<Cosecha> buscarPorId(Long id);
    Optional<Cosecha> buscarParaActualizar(Long id);
    List<Cosecha> listarTodas();
    List<Cosecha> listarPorCampana(Long campanaId);
}
