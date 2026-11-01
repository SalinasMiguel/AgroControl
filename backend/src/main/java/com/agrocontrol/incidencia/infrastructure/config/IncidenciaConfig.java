package com.agrocontrol.incidencia.infrastructure.config;

import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.incidencia.application.FotoIncidenciaService;
import com.agrocontrol.incidencia.application.IncidenciaService;
import com.agrocontrol.incidencia.domain.FotoIncidenciaRepository;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IncidenciaConfig {

    @Bean
    public IncidenciaService incidenciaService(IncidenciaRepository incidenciaRepository,
                                               ParcelaRepository parcelaRepository,
                                               CampanaRepository campanaRepository,
                                               LaborRepository laborRepository,
                                               UsuarioRepository usuarioRepository) {
        return new IncidenciaService(incidenciaRepository, parcelaRepository, campanaRepository,
                laborRepository, usuarioRepository);
    }

    @Bean
    public FotoIncidenciaService fotoIncidenciaService(FotoIncidenciaRepository fotoRepository,
                                                       IncidenciaRepository incidenciaRepository) {
        return new FotoIncidenciaService(fotoRepository, incidenciaRepository);
    }
}
