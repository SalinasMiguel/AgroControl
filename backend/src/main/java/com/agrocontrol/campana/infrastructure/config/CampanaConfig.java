package com.agrocontrol.campana.infrastructure.config;

import com.agrocontrol.campana.application.AvanceCampanaService;
import com.agrocontrol.campana.application.CampanaService;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.cosecha.domain.CosechaRepository;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.insumo.domain.ConsumoLaborRepository;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CampanaConfig {

    @Bean
    public CampanaService campanaService(CampanaRepository campanaRepository, ParcelaRepository parcelaRepository,
                                         CultivoRepository cultivoRepository, LaborRepository laborRepository) {
        return new CampanaService(campanaRepository, parcelaRepository, cultivoRepository, laborRepository);
    }

    @Bean
    public AvanceCampanaService avanceCampanaService(CampanaRepository campanaRepository, LaborRepository laborRepository,
                                                     ConsumoLaborRepository consumoRepository,
                                                     InsumoRepository insumoRepository,
                                                     CosechaRepository cosechaRepository,
                                                     IncidenciaRepository incidenciaRepository,
                                                     ParcelaRepository parcelaRepository,
                                                     CultivoRepository cultivoRepository) {
        return new AvanceCampanaService(campanaRepository, laborRepository, consumoRepository, insumoRepository,
                cosechaRepository, incidenciaRepository, parcelaRepository, cultivoRepository);
    }
}
