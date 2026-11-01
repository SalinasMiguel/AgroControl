package com.agrocontrol.cultivo.application;

import com.agrocontrol.cultivo.domain.Cultivo;
import com.agrocontrol.cultivo.domain.CultivoRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CultivoServiceTest {

    @Mock
    private CultivoRepository cultivoRepository;

    @InjectMocks
    private CultivoService service;

    @Test
    void actualizarCultivoConNombreDeOtroEsConflicto() {
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.of(new Cultivo(1L, "Soya", 120)));
        when(cultivoRepository.existePorNombreEnOtro("Maíz", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizar(1L, " Maíz ", 100)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void actualizarCultivoConSuMismoNombreGuarda() {
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.of(new Cultivo(1L, "Soya", 120)));
        when(cultivoRepository.existePorNombreEnOtro("Soya", 1L)).thenReturn(false);
        when(cultivoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Cultivo cultivo = service.actualizar(1L, "Soya", 110);

        assertThat(cultivo.getCicloDias()).isEqualTo(110);
    }

    @Test
    void actualizarCultivoInexistenteDa404() {
        when(cultivoRepository.buscarPorId(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizar(9L, "Soya", 110)).isInstanceOf(RecursoNoEncontradoException.class);
    }
}
