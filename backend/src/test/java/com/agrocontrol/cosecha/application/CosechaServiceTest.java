package com.agrocontrol.cosecha.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.cosecha.domain.CalidadCosecha;
import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CosechaServiceTest {

    @Mock
    private CosechaRepository cosechaRepository;
    @Mock
    private CampanaRepository campanaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private CosechaService service;

    @Test
    void laCalidadSeValidaYSeGuarda() {
        assertThatThrownBy(() -> new CalidadCosecha(new BigDecimal("100.01"), null, null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("humedad");
        assertThatThrownBy(() -> new CalidadCosecha(null, new BigDecimal("-1"), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("impurezas");
        assertThat(new CalidadCosecha(null, null, "  ").numeroBoleta()).isNull();
        assertThat(new CalidadCosecha(null, null, " B-120 ").numeroBoleta()).isEqualTo("B-120");
    }

    @Test
    void noSeCosechaUnaCampanaSinIniciar() {
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));

        assertThatThrownBy(() -> service.registrar(5L, BigDecimal.TEN, "t", null, CalidadCosecha.VACIA, 7L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void registraEnCampanaEnCurso() {
        Campana campana = new Campana(5L, 3L, 1L, LocalDate.now());
        campana.iniciar();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
        when(usuarioRepository.buscarPorId(7L)).thenReturn(Optional.of(mock(Usuario.class)));
        when(cosechaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Cosecha cosecha = service.registrar(5L, new BigDecimal("2.5"), " t ", null, CalidadCosecha.VACIA, 7L);

        assertThat(cosecha.getUnidadMedida()).isEqualTo("t");
        assertThat(cosecha.getUsuarioId()).isEqualTo(7L);
    }

    private static final LocalDate INICIO = LocalDate.of(2026, 1, 1);

    private void campanaEn(EstadoCampana estado) {
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(
                Campana.reconstruir(5L, 3L, 1L, INICIO, null, estado, null)));
    }

    private void listoParaGuardar() {
        when(usuarioRepository.buscarPorId(7L)).thenReturn(Optional.of(mock(Usuario.class)));
        when(cosechaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void sinFechaUsaHoy() {
        campanaEn(EstadoCampana.EN_CURSO);
        listoParaGuardar();

        assertThat(service.registrar(5L, BigDecimal.TEN, "t", null, CalidadCosecha.VACIA, 7L).getFecha()).isEqualTo(LocalDate.now());
    }

    @Test
    void fechaFuturaDa400() {
        campanaEn(EstadoCampana.EN_CURSO);

        assertThatThrownBy(() -> service.registrar(5L, BigDecimal.TEN, "t", LocalDate.now().plusDays(1), CalidadCosecha.VACIA, 7L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void fechaAnteriorAlInicioDa400() {
        campanaEn(EstadoCampana.EN_CURSO);
        listoParaGuardar();

        assertThatThrownBy(() -> service.registrar(5L, BigDecimal.TEN, "t", INICIO.minusDays(1), CalidadCosecha.VACIA, 7L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(service.registrar(5L, BigDecimal.TEN, "t", INICIO, CalidadCosecha.VACIA, 7L).getFecha()).isEqualTo(INICIO);
    }

    @ParameterizedTest
    @EnumSource(value = EstadoCampana.class, names = "EN_CURSO", mode = EnumSource.Mode.EXCLUDE)
    void soloSeCosechaUnaCampanaEnCurso(EstadoCampana estado) {
        campanaEn(estado);

        assertThatThrownBy(() -> service.registrar(5L, BigDecimal.TEN, "t", null, CalidadCosecha.VACIA, 7L))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void anularUnaCosechaInexistenteDa404() {
        when(cosechaRepository.buscarPorId(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.anular(9L, "Error", 7L)).isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void anularFuncionaConCampanaCerrada() {
        when(cosechaRepository.buscarPorId(9L)).thenReturn(Optional.of(new Cosecha(9L, 5L, BigDecimal.TEN, "t", 7L)));
        when(cosechaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.anular(9L, "Error", 7L).isAnulado()).isTrue();
    }
}
