package com.agrocontrol.parcela.application;

import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.parcela.domain.EstadoParcela;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.predio.domain.Predio;
import com.agrocontrol.predio.domain.PredioRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParcelaServiceTest {

    @Mock
    private ParcelaRepository parcelaRepository;

    @Mock
    private PredioRepository predioRepository;

    @Mock
    private CampanaRepository campanaRepository;

    @InjectMocks
    private ParcelaService service;

    private Parcela parcelaDelPredio1() {
        return new Parcela(10L, 1L, "P-01", null);
    }

    private Predio predio(Long id, boolean activo) {
        Predio predio = new Predio(id, "Predio " + id, null, null);
        if (!activo) {
            predio.desactivar();
        }
        return predio;
    }

    @Test
    void crearNormalizaElCodigo() {
        when(predioRepository.existePorId(1L)).thenReturn(true);
        when(parcelaRepository.existeCodigoEnPredio(1L, "P-01")).thenReturn(false);
        when(parcelaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Parcela creada = service.crear(1L, "  p-01 ", null);

        assertThat(creada.getCodigo()).isEqualTo("P-01");
    }

    @Test
    void crearEnPredioInexistenteLanza404() {
        when(predioRepository.existePorId(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.crear(99L, "P-01", null)).isInstanceOf(RecursoNoEncontradoException.class);
        verify(parcelaRepository, never()).guardar(any());
    }

    @Test
    void crearConCodigoRepetidoLanza409() {
        when(predioRepository.existePorId(1L)).thenReturn(true);
        when(parcelaRepository.existeCodigoEnPredio(1L, "P-01")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(1L, "p-01", null)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void moverAPredioActivo() {
        Parcela parcela = parcelaDelPredio1();
        when(parcelaRepository.buscarPorId(10L)).thenReturn(Optional.of(parcela));
        when(predioRepository.buscarPorId(2L)).thenReturn(Optional.of(predio(2L, true)));
        when(parcelaRepository.existeCodigoEnPredioEnOtraParcela(2L, "P-01", 10L)).thenReturn(false);
        when(parcelaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Parcela actualizada = service.actualizar(10L, 2L, "P-01", null, EstadoParcela.EN_DESCANSO);

        assertThat(actualizada.getPredioId()).isEqualTo(2L);
        assertThat(actualizada.getEstado()).isEqualTo(EstadoParcela.EN_DESCANSO);
    }

    @Test
    void moverAPredioInexistenteLanza404() {
        when(parcelaRepository.buscarPorId(10L)).thenReturn(Optional.of(parcelaDelPredio1()));
        when(predioRepository.buscarPorId(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizar(10L, 2L, "P-01", null, null))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void moverAPredioInactivoLanza409() {
        Parcela parcela = parcelaDelPredio1();
        when(parcelaRepository.buscarPorId(10L)).thenReturn(Optional.of(parcela));
        when(predioRepository.buscarPorId(2L)).thenReturn(Optional.of(predio(2L, false)));

        assertThatThrownBy(() -> service.actualizar(10L, 2L, "P-01", null, null))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("inactivo");
        assertThat(parcela.getPredioId()).isEqualTo(1L);
    }

    @Test
    void moverConCodigoRepetidoEnDestinoLanza409() {
        when(parcelaRepository.buscarPorId(10L)).thenReturn(Optional.of(parcelaDelPredio1()));
        when(predioRepository.buscarPorId(2L)).thenReturn(Optional.of(predio(2L, true)));
        when(parcelaRepository.existeCodigoEnPredioEnOtraParcela(2L, "P-01", 10L)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizar(10L, 2L, "P-01", null, null))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("predio destino");
    }

    @Test
    void noEliminaParcelaConCampanas() {
        when(parcelaRepository.buscarPorId(10L)).thenReturn(Optional.of(parcelaDelPredio1()));
        when(campanaRepository.existePorParcela(10L)).thenReturn(true);

        assertThatThrownBy(() -> service.eliminar(10L)).isInstanceOf(ConflictoException.class);
        verify(parcelaRepository, never()).eliminar(any());
    }

    private Parcela existenteEn(EstadoParcela estado) {
        Parcela parcela = Parcela.reconstruir(10L, 1L, "P-01", null, estado);
        when(parcelaRepository.buscarPorId(10L)).thenReturn(Optional.of(parcela));
        return parcela;
    }

    @Test
    void mandarElMismoEstadoEsValido() {
        existenteEn(EstadoParcela.EN_PRODUCCION);
        when(parcelaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Parcela parcela = service.actualizar(10L, 1L, "P-02", null, EstadoParcela.EN_PRODUCCION);

        assertThat(parcela.getCodigo()).isEqualTo("P-02");
        verify(campanaRepository, never()).existeEnCursoEnParcela(any());
    }

    @Test
    void pedirEnProduccionAManoDa409() {
        existenteEn(EstadoParcela.DISPONIBLE);

        assertThatThrownBy(() -> service.actualizar(10L, 1L, "P-01", null, EstadoParcela.EN_PRODUCCION))
                .isInstanceOf(ConflictoException.class);
        verify(parcelaRepository, never()).guardar(any());
    }

    @Test
    void cambiarEstadoConCampanaEnCursoDa409() {
        existenteEn(EstadoParcela.EN_PRODUCCION);
        when(campanaRepository.existeEnCursoEnParcela(10L)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizar(10L, 1L, "P-01", null, EstadoParcela.EN_DESCANSO))
                .isInstanceOf(ConflictoException.class);
        verify(parcelaRepository, never()).guardar(any());
    }

    @Test
    void pasarADescansoSinCampanaEnCursoGuarda() {
        existenteEn(EstadoParcela.DISPONIBLE);
        when(campanaRepository.existeEnCursoEnParcela(10L)).thenReturn(false);
        when(parcelaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.actualizar(10L, 1L, "P-01", null, EstadoParcela.EN_DESCANSO).getEstado())
                .isEqualTo(EstadoParcela.EN_DESCANSO);
    }
}
