package com.agrocontrol.bitacora.application;

import com.agrocontrol.bitacora.domain.BitacoraCampo;
import com.agrocontrol.bitacora.domain.BitacoraRepository;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BitacoraServiceTest {

    @Mock
    private BitacoraRepository bitacoraRepository;
    @Mock
    private LaborRepository laborRepository;
    @Mock
    private CampanaRepository campanaRepository;
    @Mock
    private ParcelaRepository parcelaRepository;

    @InjectMocks
    private BitacoraService service;

    private void laborDeCampana(Campana campana) {
        when(laborRepository.buscarPorId(9L)).thenReturn(Optional.of(new Labor(9L, 5L, 3L, "RIEGO", LocalDate.now())));
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
    }

    @Test
    void registraLaObservacionDeQuienLaEscribe() {
        laborDeCampana(new Campana(5L, 3L, 1L, LocalDate.now()));
        when(bitacoraRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        BitacoraCampo entrada = service.registrar(9L, 7L, "  Se regaron 2 ha con 40 m3  ");

        assertThat(entrada.getObservacion()).isEqualTo("Se regaron 2 ha con 40 m3");
        assertThat(entrada.getUsuarioId()).isEqualTo(7L);
    }

    @Test
    void laBitacoraDeUnaCampanaFinalizadaQuedaCerrada() {
        Campana finalizada = new Campana(5L, 3L, 1L, LocalDate.of(2026, 1, 1));
        finalizada.finalizar(LocalDate.of(2026, 5, 1));
        laborDeCampana(finalizada);

        assertThatThrownBy(() -> service.registrar(9L, 7L, "tarde")).isInstanceOf(ConflictoException.class);
        verify(bitacoraRepository, never()).guardar(any());
    }

    @Test
    void parcelaInexistenteLanza404() {
        when(parcelaRepository.buscarPorId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listarPorParcela(99L)).isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void laCampanaPerdidaCierraLaBitacora() {
        Campana perdida = Campana.reconstruir(5L, 3L, 1L, LocalDate.now(), LocalDate.now(), EstadoCampana.PERDIDA);
        laborDeCampana(perdida);

        assertThatThrownBy(() -> service.registrar(9L, 1L, "Sin agua")).isInstanceOf(ConflictoException.class);
    }
}
