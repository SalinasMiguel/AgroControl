package com.agrocontrol.insumo.application;

import com.agrocontrol.insumo.domain.EquivalenciaRepository;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.InsumoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquivalenciaServiceTest {

    @Mock private EquivalenciaRepository equivalencias;
    @Mock private InsumoRepository insumos;
    @InjectMocks private EquivalenciaService service;

    @Test
    void guardaElParEnOrdenParaQueValgaEnLosDosSentidos() {
        when(insumos.buscarPorId(3L)).thenReturn(Optional.of(mock(Insumo.class)));
        when(insumos.buscarPorId(8L)).thenReturn(Optional.of(mock(Insumo.class)));

        service.vincular(8L, 3L);

        verify(equivalencias).vincular(3L, 8L);
    }

    @Test
    void noEsEquivalenteDeSiMismo() {
        assertThatThrownBy(() -> service.vincular(3L, 3L)).isInstanceOf(IllegalArgumentException.class);
    }
}
