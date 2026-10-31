package com.agrocontrol.campana.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.labor.domain.EstadoLabor;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CampanaServiceTest {

    private static final LocalDate INICIO = LocalDate.of(2026, 1, 1);

    @Mock
    private CampanaRepository campanaRepository;
    @Mock
    private ParcelaRepository parcelaRepository;
    @Mock
    private CultivoRepository cultivoRepository;
    @Mock
    private LaborRepository laborRepository;

    private CampanaService service;

    @BeforeEach
    void crear() {
        service = new CampanaService(campanaRepository, parcelaRepository, cultivoRepository, laborRepository);
        when(campanaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private Campana existente(EstadoCampana estado) {
        Campana campana = Campana.reconstruir(5L, 3L, 1L, INICIO, null, estado, null);
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
        return campana;
    }

    private Labor labor(Long id) {
        return new Labor(id, 5L, 3L, "RIEGO", INICIO);
    }

    @Test
    void finalizarCancelarYPerderCancelanLaboresPendientes() {
        Labor planificada = labor(1L);
        Labor enCurso = labor(2L);
        enCurso.iniciar();
        Labor ejecutada = labor(3L);
        ejecutada.ejecutar(INICIO);
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of(planificada, enCurso, ejecutada));

        existente(EstadoCampana.EN_CURSO);
        service.finalizar(5L, INICIO.plusDays(90));

        assertThat(planificada.getEstado()).isEqualTo(EstadoLabor.CANCELADA);
        assertThat(planificada.getMotivoCancelacion()).isEqualTo("Campaña finalizada");
        assertThat(enCurso.getEstado()).isEqualTo(EstadoLabor.CANCELADA);
        assertThat(ejecutada.getEstado()).isEqualTo(EstadoLabor.EJECUTADA);
        verify(laborRepository, never()).guardar(ejecutada);
    }

    @Test
    void cancelarLaCampanaHeredaElMotivo() {
        Labor planificada = labor(1L);
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of(planificada));
        existente(EstadoCampana.PLANIFICADA);

        service.cancelar(5L, "Sin semilla");

        assertThat(planificada.getMotivoCancelacion()).isEqualTo("Campaña cancelada: Sin semilla");
    }

    @Test
    void perderLaCampanaHeredaElMotivo() {
        Labor planificada = labor(1L);
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of(planificada));
        existente(EstadoCampana.EN_CURSO);

        service.marcarPerdida(5L, "Granizo", INICIO.plusDays(30));

        assertThat(planificada.getMotivoCancelacion()).isEqualTo("Campaña perdida: Granizo");
    }

    @Test
    void elMotivoHeredadoNoPasaDe200Caracteres() {
        Labor planificada = labor(1L);
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of(planificada));
        existente(EstadoCampana.EN_CURSO);

        service.marcarPerdida(5L, "x".repeat(200), INICIO.plusDays(30));

        assertThat(planificada.getMotivoCancelacion()).hasSize(200);
    }

    @Test
    void reabrirRechazaSiHayOtraCampanaAbierta() {
        existente(EstadoCampana.FINALIZADA);
        when(campanaRepository.existeAbiertaEnParcela(3L)).thenReturn(true);

        assertThatThrownBy(() -> service.reabrir(5L, "Faltó cosechar")).isInstanceOf(ConflictoException.class);
        verify(campanaRepository, never()).guardar(any());
    }

    @Test
    void editarValidaQueElCultivoExista() {
        existente(EstadoCampana.PLANIFICADA);
        when(cultivoRepository.existePorId(9L)).thenReturn(false);

        assertThatThrownBy(() -> service.editar(5L, 9L, INICIO))
                .isInstanceOf(com.agrocontrol.shared.domain.RecursoNoEncontradoException.class);
    }
}
