package com.agrocontrol.incidencia.application;

import com.agrocontrol.incidencia.domain.FotoIncidencia;
import com.agrocontrol.incidencia.domain.FotoIncidenciaRepository;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FotoIncidenciaServiceTest {

    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1, 2};

    @Mock private FotoIncidenciaRepository fotos;
    @Mock private IncidenciaRepository incidencias;
    private FotoIncidenciaService service;
    private Incidencia incidencia;

    @BeforeEach
    void preparar() {
        service = new FotoIncidenciaService(fotos, incidencias);
        incidencia = new Incidencia(1L, 2L, null, null, "Plaga", 5L);
        when(incidencias.buscarPorId(1L)).thenReturn(Optional.of(incidencia));
        lenient().when(fotos.guardar(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void elTipoSaleDeLosBytes() {
        FotoIncidencia foto = service.agregar(1L, JPG, 5L);
        assertThat(foto.tipoContenido()).isEqualTo("image/jpeg");
        assertThat(foto.tamano()).isEqualTo(JPG.length);
    }

    @Test
    void rechazaLoQueNoEsImagen() {
        byte[] html = "<script>alert(1)</script>".getBytes();
        assertThatThrownBy(() -> service.agregar(1L, html, 5L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rechazaFotosDeMasDe5Mb() {
        byte[] grande = new byte[FotoIncidenciaService.MAX_BYTES + 1];
        assertThatThrownBy(() -> service.agregar(1L, grande, 5L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void admiteHastaCincoFotos() {
        when(fotos.contarPorIncidencia(1L)).thenReturn(5L);
        assertThatThrownBy(() -> service.agregar(1L, JPG, 5L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void noAgregaEnUnaIncidenciaCerrada() {
        incidencia.resolver("Listo");
        assertThatThrownBy(() -> service.agregar(1L, JPG, 5L)).isInstanceOf(ConflictoException.class);
    }
}
