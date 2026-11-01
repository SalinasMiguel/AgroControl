package com.agrocontrol.incidencia.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.incidencia.domain.FotoIncidencia;
import com.agrocontrol.incidencia.domain.FotoIncidenciaRepository;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public class FotoIncidenciaService {

    static final int MAX_FOTOS = 5;
    static final int MAX_BYTES = 5 * 1024 * 1024;

    private final FotoIncidenciaRepository fotoRepository;
    private final IncidenciaRepository incidenciaRepository;

    public FotoIncidenciaService(FotoIncidenciaRepository fotoRepository, IncidenciaRepository incidenciaRepository) {
        this.fotoRepository = fotoRepository;
        this.incidenciaRepository = incidenciaRepository;
    }

    @Transactional(readOnly = true)
    public List<FotoIncidencia> listar(Long incidenciaId) {
        incidencia(incidenciaId);
        return fotoRepository.listarPorIncidencia(incidenciaId);
    }

    @Transactional(readOnly = true)
    public FotoIncidencia obtener(Long incidenciaId, Long fotoId) {
        return fotoRepository.buscar(incidenciaId, fotoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la foto con id: " + fotoId));
    }

    @Auditable(entidad = "INCIDENCIA", accion = "AGREGAR_FOTO")
    @Transactional
    public FotoIncidencia agregar(Long incidenciaId, byte[] datos, Long usuarioId) {
        if (!incidencia(incidenciaId).estaAbierta()) {
            throw new ConflictoException("Solo se agregan fotos a una incidencia abierta");
        }
        if (datos == null || datos.length == 0) {
            throw new IllegalArgumentException("La foto está vacía");
        }
        if (datos.length > MAX_BYTES) {
            throw new IllegalArgumentException("La foto no puede pesar más de 5 MB");
        }
        if (fotoRepository.contarPorIncidencia(incidenciaId) >= MAX_FOTOS) {
            throw new ConflictoException("Una incidencia admite como máximo " + MAX_FOTOS + " fotos");
        }
        return fotoRepository.guardar(new FotoIncidencia(null, incidenciaId, tipoDeImagen(datos), datos.length, datos,
                usuarioId, LocalDateTime.now()));
    }

    // Se decide por los primeros bytes del archivo, no por lo que declara el navegador.
    static String tipoDeImagen(byte[] d) {
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') {
            return "image/png";
        }
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        throw new IllegalArgumentException("La foto debe ser JPG, PNG o WebP");
    }

    private Incidencia incidencia(Long id) {
        return incidenciaRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la incidencia con id: " + id));
    }
}
