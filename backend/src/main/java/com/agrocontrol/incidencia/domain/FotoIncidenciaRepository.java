package com.agrocontrol.incidencia.domain;

import java.util.List;
import java.util.Optional;

public interface FotoIncidenciaRepository {
    FotoIncidencia guardar(FotoIncidencia foto);
    List<FotoIncidencia> listarPorIncidencia(Long incidenciaId);
    Optional<FotoIncidencia> buscar(Long incidenciaId, Long fotoId);
    long contarPorIncidencia(Long incidenciaId);
}
