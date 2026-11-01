package com.agrocontrol.cultivo.domain;

import java.util.List;
import java.util.Optional;

public interface CultivoRepository {
    Cultivo guardar(Cultivo cultivo);
    Optional<Cultivo> buscarPorId(Long id);
    List<Cultivo> listarTodos();
    boolean existePorId(Long id);
    boolean existePorNombre(String nombre);
    boolean existePorNombreEnOtro(String nombre, Long idExcluido);
}
