package com.agrocontrol.campana.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.PlanSiembra;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import com.agrocontrol.cultivo.domain.Cultivo;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.insumo.domain.ConsumoLaborRepository;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvanceCampanaServiceTest {

    @Mock
    private CampanaRepository campanaRepository;
    @Mock
    private LaborRepository laborRepository;
    @Mock
    private ConsumoLaborRepository consumoRepository;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private CosechaRepository cosechaRepository;
    @Mock
    private IncidenciaRepository incidenciaRepository;
    @Mock
    private ParcelaRepository parcelaRepository;
    @Mock
    private CultivoRepository cultivoRepository;

    @InjectMocks
    private AvanceCampanaService service;

    @Test
    void resumeLaboresInsumosCosechaEIncidencias() {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        Campana campana = new Campana(5L, 3L, 1L, inicio);
        campana.iniciar();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.of(new Cultivo(1L, "Soya", 120)));
        when(parcelaRepository.buscarPorId(3L)).thenReturn(Optional.of(new Parcela(3L, 1L, "P-01", new BigDecimal("10"))));

        Labor siembra = new Labor(1L, 5L, 3L, "SIEMBRA", inicio);
        siembra.ejecutar(inicio);
        Labor riego = new Labor(2L, 5L, 3L, "RIEGO", inicio.plusDays(10));
        riego.iniciar();
        Labor fumigacion = new Labor(3L, 5L, 3L, "FUMIGACION", inicio.plusDays(30));
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of(siembra, riego, fumigacion));

        when(consumoRepository.listarPorLabor(1L)).thenReturn(List.of(new ConsumoLabor(1L, 1L, 8L, new BigDecimal("50"))));
        when(consumoRepository.listarPorLabor(2L)).thenReturn(List.of(new ConsumoLabor(2L, 2L, 8L, new BigDecimal("25"))));
        when(consumoRepository.listarPorLabor(3L)).thenReturn(List.of());
        when(insumoRepository.listarTodos()).thenReturn(List.of(new Insumo(8L, "Semilla de soya", "kg")));

        when(cosechaRepository.listarPorCampana(5L)).thenReturn(List.of(
                new Cosecha(1L, 5L, new BigDecimal("20"), "t", 2L),
                new Cosecha(2L, 5L, new BigDecimal("5000"), "kg", 2L)));

        Incidencia resuelta = new Incidencia(1L, 3L, 5L, null, "Helada", 2L);
        resuelta.resolver("Manta térmica");
        when(incidenciaRepository.listarPorParcela(3L)).thenReturn(List.of(
                resuelta,
                new Incidencia(2L, 3L, 5L, null, "Plaga", 2L),
                new Incidencia(3L, 3L, 99L, null, "De otra campaña", 2L)));

        AvanceCampana avance = service.calcular(5L, inicio.plusDays(60));

        assertThat(avance.laboresTotal()).isEqualTo(3);
        assertThat(avance.laboresEjecutadas()).isEqualTo(1);
        assertThat(avance.laboresEnCurso()).isEqualTo(1);
        assertThat(avance.porcentajeLabores()).isEqualTo(33);
        assertThat(avance.diasTranscurridos()).isEqualTo(60);
        assertThat(avance.porcentajeCiclo()).isEqualTo(50);
        assertThat(avance.insumos()).singleElement()
                .satisfies(i -> assertThat(i.cantidad()).isEqualByComparingTo("75"));
        // 20 t + 5000 kg = 25 t en 10 ha
        assertThat(avance.rendimientoToneladasPorHa()).isEqualByComparingTo("2.5");
        assertThat(avance.incidenciasTotal()).isEqualTo(2);
        assertThat(avance.incidenciasAbiertas()).isEqualTo(1);
    }

    @Test
    void campanaSinLaboresNiCosecha() {
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.empty());
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of());
        when(insumoRepository.listarTodos()).thenReturn(List.of());
        when(cosechaRepository.listarPorCampana(5L)).thenReturn(List.of());
        when(incidenciaRepository.listarPorParcela(3L)).thenReturn(List.of());
        when(parcelaRepository.buscarPorId(3L)).thenReturn(Optional.empty());

        AvanceCampana avance = service.calcular(5L, LocalDate.now());

        assertThat(avance.porcentajeLabores()).isZero();
        assertThat(avance.porcentajeCiclo()).isNull();
        assertThat(avance.rendimientoToneladasPorHa()).isNull();
    }

    @Test
    void elAvanceIgnoraLoAnuladoYLoCancelado() {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        Campana campana = new Campana(5L, 3L, 1L, inicio);
        campana.iniciar();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.of(new Cultivo(1L, "Soya", 120)));
        when(parcelaRepository.buscarPorId(3L)).thenReturn(Optional.of(new Parcela(3L, 1L, "P-01", new BigDecimal("10"))));

        Labor ejecutada = new Labor(1L, 5L, 3L, "SIEMBRA", inicio);
        ejecutada.ejecutar(inicio);
        Labor asignada = new Labor(2L, 5L, 3L, "RIEGO", inicio);
        asignada.marcarAsignada();
        Labor cancelada = new Labor(3L, 5L, 3L, "RIEGO", inicio);
        cancelada.cancelar("Llovió");
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of(ejecutada, asignada, cancelada));

        Cosecha cosecha = new Cosecha(1L, 5L, BigDecimal.TEN, "t", 7L);
        cosecha.anular("Error", 7L);
        when(cosechaRepository.listarPorCampana(5L)).thenReturn(List.of(cosecha));

        ConsumoLabor consumo = new ConsumoLabor(1L, 1L, 4L, BigDecimal.ONE);
        consumo.anular("Error", 7L);
        when(consumoRepository.listarPorLabor(1L)).thenReturn(List.of(consumo));
        when(consumoRepository.listarPorLabor(2L)).thenReturn(List.of());
        when(insumoRepository.listarTodos()).thenReturn(List.of());

        Incidencia incidencia = new Incidencia(1L, 3L, 5L, null, "Plaga", 7L);
        incidencia.anular("Error", 7L);
        when(incidenciaRepository.listarPorParcela(3L)).thenReturn(List.of(incidencia));

        AvanceCampana avance = service.calcular(5L, inicio.plusDays(1));

        assertThat(avance.laboresTotal()).isEqualTo(2);
        assertThat(avance.laboresPlanificadas()).isEqualTo(1);
        assertThat(avance.porcentajeLabores()).isEqualTo(50);
        assertThat(avance.cosecha()).isEmpty();
        assertThat(avance.insumos()).isEmpty();
        assertThat(avance.rendimientoToneladasPorHa()).isNull();
        assertThat(avance.incidenciasTotal()).isZero();
        assertThat(avance.incidenciasAbiertas()).isZero();
    }

    @Test
    void elRendimientoUsaLoSembradoYNoTodaLaParcela() {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        Campana campana = new Campana(5L, 3L, 1L, inicio);
        campana.definirSiembra(new PlanSiembra(new BigDecimal("4"), null, null));
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.of(new Cultivo(1L, "Soya", 120)));
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of());
        when(insumoRepository.listarTodos()).thenReturn(List.of());
        when(incidenciaRepository.listarPorParcela(3L)).thenReturn(List.of());
        when(cosechaRepository.listarPorCampana(5L)).thenReturn(List.of(new Cosecha(1L, 5L, new BigDecimal("10"), "t", 7L)));

        AvanceCampana avance = service.calcular(5L, inicio.plusDays(1));

        assertThat(avance.rendimientoToneladasPorHa()).isEqualByComparingTo("2.50");
    }

    @Test
    void elRendimientoCuentaQuintales() {
        LocalDate inicio = LocalDate.of(2026, 9, 1);
        Campana campana = new Campana(5L, 3L, 1L, inicio);
        campana.iniciar();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
        when(cultivoRepository.buscarPorId(1L)).thenReturn(Optional.of(new Cultivo(1L, "Soya", 120)));
        when(parcelaRepository.buscarPorId(3L)).thenReturn(Optional.of(new Parcela(3L, 1L, "P-01", new BigDecimal("2"))));
        when(laborRepository.listarPorCampana(5L)).thenReturn(List.of());
        when(insumoRepository.listarTodos()).thenReturn(List.of());
        when(incidenciaRepository.listarPorParcela(3L)).thenReturn(List.of());
        when(cosechaRepository.listarPorCampana(5L)).thenReturn(List.of(
                new Cosecha(1L, 5L, new BigDecimal("100"), "qq", 7L),
                new Cosecha(2L, 5L, new BigDecimal("400"), "kg", 7L)));

        AvanceCampana avance = service.calcular(5L, inicio.plusDays(1));

        assertThat(avance.cosechaToneladas()).isEqualByComparingTo("5.0");
        assertThat(avance.rendimientoToneladasPorHa()).isEqualByComparingTo("2.50");
    }
}
