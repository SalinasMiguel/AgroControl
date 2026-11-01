package com.agrocontrol.cultivo.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.cultivo.domain.Cultivo;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

public class CultivoService {

    private final CultivoRepository cultivoRepository;

    public CultivoService(CultivoRepository cultivoRepository) {
        this.cultivoRepository = cultivoRepository;
    }

    @Transactional(readOnly = true)
    public List<Cultivo> listar() {
        return cultivoRepository.listarTodos();
    }

    @Auditable(entidad = "CULTIVO", accion = "CREAR")
    @Transactional
    public Cultivo crear(String nombre, Integer cicloDias, BigDecimal humedadEstandarPct) {
        String nombreLimpio = nombre.trim();
        if (cultivoRepository.existePorNombre(nombreLimpio)) {
            throw new ConflictoException("Ya existe un cultivo llamado " + nombreLimpio);
        }
        Cultivo cultivo = new Cultivo(null, nombreLimpio, cicloDias);
        cultivo.definirHumedadEstandar(humedadEstandarPct);
        return cultivoRepository.guardar(cultivo);
    }

    @Auditable(entidad = "CULTIVO", accion = "ACTUALIZAR")
    @Transactional
    public Cultivo actualizar(Long id, String nombre, Integer cicloDias, BigDecimal humedadEstandarPct) {
        Cultivo cultivo = cultivoRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el cultivo con id: " + id));
        String nombreLimpio = nombre.trim();
        if (cultivoRepository.existePorNombreEnOtro(nombreLimpio, id)) {
            throw new ConflictoException("Ya existe un cultivo llamado " + nombreLimpio);
        }
        cultivo.actualizar(nombreLimpio, cicloDias);
        cultivo.definirHumedadEstandar(humedadEstandarPct);
        return cultivoRepository.guardar(cultivo);
    }
}
