package com.agrocontrol.cosecha.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.cosecha.domain.CalidadCosecha;
import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CorregirCosechaTest {

    @Mock private CosechaRepository cosechas;
    @Mock private CampanaRepository campanas;
    @Mock private UsuarioRepository usuarios;
    private CosechaService service;
    private final LocalDate ayer = LocalDate.now().minusDays(1);

    @BeforeEach
    void preparar() {
        service = new CosechaService(cosechas, campanas, usuarios);
        lenient().when(cosechas.guardar(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(usuarios.buscarPorId(5L)).thenReturn(Optional.of(mock(Usuario.class)));
    }

    private void campanaEn(EstadoCampana estado) {
        Campana campana = mock(Campana.class);
        when(campana.getEstado()).thenReturn(estado);
        lenient().when(campana.getFechaInicio()).thenReturn(ayer.minusDays(30));
        when(campanas.buscarPorId(2L)).thenReturn(Optional.of(campana));
    }

    private Cosecha original() {
        return Cosecha.reconstruir(9L, 2L, new BigDecimal("10"), "t", ayer, 5L, null);
    }

    @Test
    void anulaLaCargaYRegistraLaBuena() {
        campanaEn(EstadoCampana.EN_CURSO);
        Cosecha vieja = original();
        when(cosechas.buscarParaActualizar(9L)).thenReturn(Optional.of(vieja));

        Cosecha nueva = service.corregir(9L, "Se tipeó mal", new BigDecimal("12"), "t", ayer, CalidadCosecha.VACIA, 5L);

        assertThat(vieja.isAnulado()).isTrue();
        assertThat(vieja.getAnulacion().motivo()).isEqualTo("Se tipeó mal");
        assertThat(nueva.getCantidad()).isEqualByComparingTo("12");
        assertThat(nueva.getCampanaId()).isEqualTo(2L);
        ArgumentCaptor<Cosecha> guardadas = ArgumentCaptor.forClass(Cosecha.class);
        verify(cosechas, times(2)).guardar(guardadas.capture());
        assertThat(guardadas.getAllValues()).containsExactly(vieja, nueva);
    }

    @Test
    void noCorrigeDosVeces() {
        Cosecha vieja = original();
        vieja.anular("antes", 5L);
        when(cosechas.buscarParaActualizar(9L)).thenReturn(Optional.of(vieja));

        assertThatThrownBy(() -> service.corregir(9L, "otra", BigDecimal.ONE, "t", ayer, CalidadCosecha.VACIA, 5L))
                .isInstanceOf(IllegalStateException.class);
        verify(cosechas, never()).guardar(any());
    }

    @Test
    void campanaCerradaExigeReabrirla() {
        campanaEn(EstadoCampana.FINALIZADA);
        when(cosechas.buscarParaActualizar(9L)).thenReturn(Optional.of(original()));

        assertThatThrownBy(() -> service.corregir(9L, "m", BigDecimal.ONE, "t", ayer, CalidadCosecha.VACIA, 5L))
                .isInstanceOf(ConflictoException.class);
    }
}
