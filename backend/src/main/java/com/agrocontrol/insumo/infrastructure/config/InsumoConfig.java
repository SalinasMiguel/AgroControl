package com.agrocontrol.insumo.infrastructure.config;

import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.insumo.application.EquivalenciaService;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.domain.EquivalenciaRepository;
import com.agrocontrol.insumo.domain.ConsumoLaborRepository;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.insumo.domain.MovimientoInsumoRepository;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InsumoConfig {

    @Bean
    public InventarioService inventarioService(InsumoRepository insumoRepository,
                                               MovimientoInsumoRepository movimientoRepository,
                                               ConsumoLaborRepository consumoRepository,
                                               LaborRepository laborRepository,
                                               UsuarioRepository usuarioRepository,
                                               CampanaRepository campanaRepository) {
        return new InventarioService(insumoRepository, movimientoRepository, consumoRepository,
                laborRepository, usuarioRepository, campanaRepository);
    }

    @Bean
    public EquivalenciaService equivalenciaService(EquivalenciaRepository equivalenciaRepository,
                                                   InsumoRepository insumoRepository) {
        return new EquivalenciaService(equivalenciaRepository, insumoRepository);
    }
}
