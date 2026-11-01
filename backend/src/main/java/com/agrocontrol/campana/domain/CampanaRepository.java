package com.agrocontrol.campana.domain;

import java.util.List;
import java.util.Optional;

public interface CampanaRepository {
    Campana guardar(Campana campana);
    Optional<Campana> buscarPorId(Long id);
    List<Campana> listarTodas();
    List<Campana> listarPorParcela(Long parcelaId);
    boolean existePorParcela(Long parcelaId);
    boolean existeAbiertaEnParcela(Long parcelaId);
    boolean existeEnCursoEnParcela(Long parcelaId);
}
