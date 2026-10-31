package com.agrocontrol.bitacora.application;

import com.agrocontrol.bitacora.domain.BitacoraCampo;
import com.agrocontrol.bitacora.domain.BitacoraRepository;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public class BitacoraService {

    private final BitacoraRepository bitacoraRepository;
    private final LaborRepository laborRepository;
    private final CampanaRepository campanaRepository;
    private final ParcelaRepository parcelaRepository;

    public BitacoraService(BitacoraRepository bitacoraRepository, LaborRepository laborRepository,
                           CampanaRepository campanaRepository, ParcelaRepository parcelaRepository) {
        this.bitacoraRepository = bitacoraRepository;
        this.laborRepository = laborRepository;
        this.campanaRepository = campanaRepository;
        this.parcelaRepository = parcelaRepository;
    }

    @Transactional
    public BitacoraCampo registrar(Long laborId, Long usuarioId, String observacion) {
        Labor labor = obtenerLabor(laborId);
        boolean campanaCerrada = campanaRepository.buscarPorId(labor.getCampanaId())
                .map(campana -> campana.estaCerrada()).orElse(false);
        if (campanaCerrada) {
            throw new ConflictoException("La campaña de esta labor ya está cerrada: su bitácora quedó cerrada");
        }
        return bitacoraRepository.guardar(new BitacoraCampo(null, laborId, usuarioId, observacion.trim()));
    }

    @Transactional(readOnly = true)
    public List<BitacoraCampo> listarPorLabor(Long laborId) {
        obtenerLabor(laborId);
        return bitacoraRepository.listarPorLabor(laborId);
    }

    @Transactional(readOnly = true)
    public List<BitacoraCampo> listarPorParcela(Long parcelaId) {
        if (parcelaRepository.buscarPorId(parcelaId).isEmpty()) {
            throw new RecursoNoEncontradoException("No existe la parcela con id: " + parcelaId);
        }
        return bitacoraRepository.listarPorParcela(parcelaId);
    }

    private Labor obtenerLabor(Long laborId) {
        return laborRepository.buscarPorId(laborId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la labor con id: " + laborId));
    }
}
