package com.agrocontrol.parcela.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.parcela.domain.EstadoParcela;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.predio.domain.Predio;
import com.agrocontrol.predio.domain.PredioRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

public class ParcelaService {

    private final ParcelaRepository parcelaRepository;
    private final PredioRepository predioRepository;
    private final CampanaRepository campanaRepository;

    public ParcelaService(ParcelaRepository parcelaRepository, PredioRepository predioRepository,
                          CampanaRepository campanaRepository) {
        this.parcelaRepository = parcelaRepository;
        this.predioRepository = predioRepository;
        this.campanaRepository = campanaRepository;
    }

    @Transactional(readOnly = true)
    public List<Parcela> listar(Long predioId) {
        if (predioId == null) {
            return parcelaRepository.listarTodas();
        }
        return parcelaRepository.listarPorPredio(predioId);
    }

    @Transactional(readOnly = true)
    public Parcela obtener(Long id) {
        return parcelaRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la parcela con id: " + id));
    }

    @Auditable(entidad = "PARCELA", accion = "CREAR")
    @Transactional
    public Parcela crear(Long predioId, String codigo, BigDecimal areaHa) {
        // El padre debe existir antes de crear el hijo: 404 aquí, no un error de FK
        if (!predioRepository.existePorId(predioId)) {
            throw new RecursoNoEncontradoException("No existe el predio con id: " + predioId);
        }
        String codigoNormalizado = normalizar(codigo);
        if (parcelaRepository.existeCodigoEnPredio(predioId, codigoNormalizado)) {
            throw codigoDuplicado(codigoNormalizado);
        }
        return parcelaRepository.guardar(new Parcela(null, predioId, codigoNormalizado, areaHa));
    }

    @Auditable(entidad = "PARCELA", accion = "ACTUALIZAR")
    @Transactional
    public Parcela actualizar(Long id, Long predioId, String codigo, BigDecimal areaHa, EstadoParcela estado) {
        Parcela parcela = obtener(id);
        boolean cambiaDePredio = !parcela.getPredioId().equals(predioId);
        if (cambiaDePredio) {
            Predio destino = predioRepository.buscarPorId(predioId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("No existe el predio con id: " + predioId));
            if (!destino.isActivo()) {
                throw new ConflictoException("No se puede mover la parcela al predio " + predioId + " porque está inactivo");
            }
        }
        String codigoNormalizado = normalizar(codigo);
        // UNIQUE (id_predio, codigo): se valida contra el predio destino, que puede ser el mismo
        if (parcelaRepository.existeCodigoEnPredioEnOtraParcela(predioId, codigoNormalizado, id)) {
            throw cambiaDePredio
                    ? new ConflictoException("No se puede mover la parcela: ya existe una parcela con el código "
                            + codigoNormalizado + " en el predio destino " + predioId)
                    : codigoDuplicado(codigoNormalizado);
        }
        if (cambiaDePredio) {
            parcela.moverAPredio(predioId);
        }
        parcela.cambiarCodigo(codigoNormalizado);
        parcela.actualizarArea(areaHa);
        if (estado != null && estado != parcela.getEstado()) {
            exigirCambioManualPermitido(id, estado);
            parcela.cambiarEstado(estado);
        }
        return parcelaRepository.guardar(parcela);
    }

    // EN_PRODUCCION lo pone la campaña al iniciar, nunca una edición.
    private void exigirCambioManualPermitido(Long id, EstadoParcela estado) {
        if (estado == EstadoParcela.EN_PRODUCCION) {
            throw new ConflictoException("Una parcela pasa a producción al iniciar una campaña");
        }
        if (campanaRepository.existeEnCursoEnParcela(id)) {
            throw new ConflictoException("La parcela " + id + " tiene una campaña en curso");
        }
    }

    @Auditable(entidad = "PARCELA", accion = "ELIMINAR")
    @Transactional
    public void eliminar(Long id) {
        obtener(id);
        if (campanaRepository.existePorParcela(id)) {
            throw new ConflictoException("No se puede eliminar la parcela " + id + " porque tiene campañas registradas");
        }
        parcelaRepository.eliminar(id);
    }

    private static String normalizar(String codigo) {
        return codigo.trim().toUpperCase();
    }

    private static ConflictoException codigoDuplicado(String codigo) {
        return new ConflictoException("Ya existe una parcela con el código " + codigo + " en este predio");
    }
}
