package com.agrocontrol.campana.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import com.agrocontrol.cultivo.domain.Cultivo;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.incidencia.domain.EstadoIncidencia;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.insumo.domain.CategoriaInsumo;
import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.insumo.domain.ConsumoLaborRepository;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.labor.domain.EstadoLabor;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

public class AvanceCampanaService {

    private final CampanaRepository campanaRepository;
    private final LaborRepository laborRepository;
    private final ConsumoLaborRepository consumoRepository;
    private final InsumoRepository insumoRepository;
    private final CosechaRepository cosechaRepository;
    private final IncidenciaRepository incidenciaRepository;
    private final ParcelaRepository parcelaRepository;
    private final CultivoRepository cultivoRepository;

    public AvanceCampanaService(CampanaRepository campanaRepository, LaborRepository laborRepository,
                                ConsumoLaborRepository consumoRepository, InsumoRepository insumoRepository,
                                CosechaRepository cosechaRepository, IncidenciaRepository incidenciaRepository,
                                ParcelaRepository parcelaRepository, CultivoRepository cultivoRepository) {
        this.campanaRepository = campanaRepository;
        this.laborRepository = laborRepository;
        this.consumoRepository = consumoRepository;
        this.insumoRepository = insumoRepository;
        this.cosechaRepository = cosechaRepository;
        this.incidenciaRepository = incidenciaRepository;
        this.parcelaRepository = parcelaRepository;
        this.cultivoRepository = cultivoRepository;
    }

    @Transactional(readOnly = true)
    public AvanceCampana calcular(Long campanaId, LocalDate hoy) {
        Campana campana = campanaRepository.buscarPorId(campanaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la campaña con id: " + campanaId));
        Cultivo cultivo = cultivoRepository.buscarPorId(campana.getCultivoId()).orElse(null);

        List<Labor> labores = laborRepository.listarPorCampana(campanaId).stream()
                .filter(labor -> labor.getEstado() != EstadoLabor.CANCELADA)
                .toList();
        int planificadas = contar(labores, EstadoLabor.PLANIFICADA) + contar(labores, EstadoLabor.ASIGNADA);
        int enCurso = contar(labores, EstadoLabor.EN_CURSO);
        int ejecutadas = contar(labores, EstadoLabor.EJECUTADA);

        LocalDate hasta = campana.getFechaFin() != null ? campana.getFechaFin() : hoy;
        int dias = (int) Math.max(0, ChronoUnit.DAYS.between(campana.getFechaInicio(), hasta));
        Integer ciclo = cultivo == null ? null : cultivo.getCicloDias();

        List<Cosecha> cosechas = cosechaRepository.listarPorCampana(campanaId).stream()
                .filter(cosecha -> !cosecha.isAnulado())
                .toList();
        List<Incidencia> incidencias = incidenciaRepository.listarPorParcela(campana.getParcelaId()).stream()
                .filter(incidencia -> campanaId.equals(incidencia.getCampanaId()))
                .filter(incidencia -> incidencia.getEstado() != EstadoIncidencia.ANULADA)
                .toList();

        BigDecimal toneladas = cosechas.stream().map(Cosecha::getToneladas).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal humedadEstandar = cultivo == null ? null : cultivo.getHumedadEstandarPct();
        BigDecimal netas = cosechas.stream().map(c -> c.getToneladasNetas(humedadEstandar))
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(3, RoundingMode.HALF_UP);

        return new AvanceCampana(
                campanaId,
                cultivo == null ? null : cultivo.getNombre(),
                campana.getEstado(),
                labores.size(), planificadas, enCurso, ejecutadas,
                porcentaje(ejecutadas, labores.size()),
                dias,
                ciclo,
                ciclo == null ? null : Math.min(100, porcentaje(dias, ciclo)),
                insumosConsumidos(labores),
                totalesDeCosecha(cosechas),
                toneladas,
                netas,
                rendimiento(campana, netas),
                (int) incidencias.stream().filter(Incidencia::estaAbierta).count(),
                incidencias.size()
        );
    }

    private List<AvanceCampana.InsumoConsumido> insumosConsumidos(List<Labor> labores) {
        Map<Long, BigDecimal> porInsumo = new LinkedHashMap<>();
        for (Labor labor : labores) {
            for (ConsumoLabor consumo : consumoRepository.listarPorLabor(labor.getId())) {
                if (!consumo.isAnulado()) {
                    porInsumo.merge(consumo.getInsumoId(), consumo.getCantidad(), BigDecimal::add);
                }
            }
        }
        Map<Long, Insumo> insumos = insumoRepository.listarTodos().stream()
                .collect(Collectors.toMap(Insumo::getId, Function.identity()));
        return porInsumo.entrySet().stream()
                .map(e -> {
                    Insumo insumo = insumos.get(e.getKey());
                    return new AvanceCampana.InsumoConsumido(e.getKey(),
                            insumo == null ? "Insumo " + e.getKey() : insumo.getNombre(),
                            insumo == null ? CategoriaInsumo.OTRO : insumo.getCategoria(),
                            insumo == null ? "" : insumo.getUnidadMedida(), e.getValue());
                })
                .toList();
    }

    private static List<AvanceCampana.CosechaTotal> totalesDeCosecha(List<Cosecha> cosechas) {
        Map<String, BigDecimal> porUnidad = new TreeMap<>();
        cosechas.forEach(c -> porUnidad.merge(c.getUnidadMedida(), c.getCantidad(), BigDecimal::add));
        return porUnidad.entrySet().stream()
                .map(e -> new AvanceCampana.CosechaTotal(e.getKey(), e.getValue()))
                .toList();
    }

    // Toneladas por hectárea sembrada; sin ese dato se usa el área de la parcela
    private BigDecimal rendimiento(Campana campana, BigDecimal toneladas) {
        BigDecimal area = campana.getAreaSembradaHa() != null ? campana.getAreaSembradaHa()
                : parcelaRepository.buscarPorId(campana.getParcelaId()).map(parcela -> parcela.getAreaHa()).orElse(null);
        if (area == null || area.signum() == 0 || toneladas.signum() == 0) {
            return null;
        }
        return toneladas.divide(area, 2, RoundingMode.HALF_UP);
    }

    private static int contar(List<Labor> labores, EstadoLabor estado) {
        return (int) labores.stream().filter(labor -> labor.getEstado() == estado).count();
    }

    private static int porcentaje(int parte, int total) {
        return total == 0 ? 0 : Math.round(parte * 100f / total);
    }
}
