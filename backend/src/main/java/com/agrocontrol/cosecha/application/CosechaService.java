package com.agrocontrol.cosecha.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.UsuarioNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CosechaService {

    private final CosechaRepository cosechaRepository;
    private final CampanaRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;

    public CosechaService(CosechaRepository cosechaRepository, CampanaRepository campanaRepository,
                          UsuarioRepository usuarioRepository) {
        this.cosechaRepository = cosechaRepository;
        this.campanaRepository = campanaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Cosecha> listar(Long campanaId) {
        if (campanaId == null) {
            return cosechaRepository.listarTodas();
        }
        return cosechaRepository.listarPorCampana(campanaId);
    }

    @Auditable(entidad = "COSECHA", accion = "REGISTRAR")
    @Transactional
    public Cosecha registrar(Long campanaId, BigDecimal cantidad, String unidadMedida, LocalDate fecha, Long usuarioId) {
        Campana campana = campanaRepository.buscarPorId(campanaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la campaña con id: " + campanaId));
        // RN-06: una cosecha tardía exige reabrir la campaña
        if (campana.getEstado() != EstadoCampana.EN_CURSO) {
            throw new ConflictoException("Solo se cosecha una campaña en curso (estado actual: " + campana.getEstado() + ")");
        }
        LocalDate fechaCosecha = fecha != null ? fecha : LocalDate.now();
        if (fechaCosecha.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de cosecha no puede ser futura");
        }
        if (fechaCosecha.isBefore(campana.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de cosecha no puede ser anterior al inicio de la campaña");
        }
        if (usuarioRepository.buscarPorId(usuarioId).isEmpty()) {
            throw new UsuarioNoEncontradoException(usuarioId);
        }
        return cosechaRepository.guardar(new Cosecha(null, campanaId, cantidad, unidadMedida.trim(), fechaCosecha, usuarioId));
    }

    @Auditable(entidad = "COSECHA", accion = "ANULAR")
    @Transactional
    public Cosecha anular(Long id, String motivo, Long usuarioId) {
        Cosecha cosecha = cosechaRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la cosecha con id: " + id));
        cosecha.anular(motivo, usuarioId);
        return cosechaRepository.guardar(cosecha);
    }
}
