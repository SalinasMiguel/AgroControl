package com.agrocontrol.incidencia.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.incidencia.domain.EstadoIncidencia;
import com.agrocontrol.incidencia.domain.GravedadIncidencia;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.TipoIncidencia;
import com.agrocontrol.incidencia.domain.IncidenciaRepository;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.UsuarioNoEncontradoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidenciaServiceTest {

    @Mock
    private IncidenciaRepository incidenciaRepository;
    @Mock
    private ParcelaRepository parcelaRepository;
    @Mock
    private CampanaRepository campanaRepository;
    @Mock
    private LaborRepository laborRepository;
    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private IncidenciaService service;

    private void existeParcela(Long id) {
        when(parcelaRepository.buscarPorId(id)).thenReturn(Optional.of(new Parcela(id, 1L, "P-01", null)));
    }

    private void existeUsuario(Long id) {
        when(usuarioRepository.buscarPorId(id)).thenReturn(Optional.of(mock(Usuario.class)));
    }

    private void guardaLoRecibido() {
        when(incidenciaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void sinClasificarQuedaComoOtroYMedia() {
        Incidencia incidencia = new Incidencia(1L, 3L, null, null, "Algo pasó", 7L);
        incidencia.clasificar(null, null);
        assertThat(incidencia.getTipo()).isEqualTo(TipoIncidencia.OTRO);
        assertThat(incidencia.getGravedad()).isEqualTo(GravedadIncidencia.MEDIA);

        incidencia.clasificar(TipoIncidencia.MAQUINARIA, GravedadIncidencia.ALTA);
        assertThat(incidencia.getTipo()).isEqualTo(TipoIncidencia.MAQUINARIA);
        assertThat(incidencia.getGravedad()).isEqualTo(GravedadIncidencia.ALTA);
    }

    @Test
    void registraSobreUnaParcela() {
        existeParcela(3L);
        existeUsuario(7L);
        guardaLoRecibido();

        Incidencia incidencia = service.registrar(3L, null, null, "  Plaga de gusano  ", null, null, 7L);

        assertThat(incidencia.getParcelaId()).isEqualTo(3L);
        assertThat(incidencia.getDescripcion()).isEqualTo("Plaga de gusano");
    }

    @Test
    void desdeLaLaborDeduceCampanaYParcela() {
        when(laborRepository.buscarPorId(9L)).thenReturn(Optional.of(new Labor(9L, 5L, 3L, "RIEGO", LocalDate.now())));
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));
        existeParcela(3L);
        existeUsuario(7L);
        guardaLoRecibido();

        Incidencia incidencia = service.registrar(null, null, 9L, "Bomba de riego averiada", null, null, 7L);

        assertThat(incidencia.getCampanaId()).isEqualTo(5L);
        assertThat(incidencia.getParcelaId()).isEqualTo(3L);
    }

    @Test
    void campanaDeOtraParcelaLanza409() {
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));

        assertThatThrownBy(() -> service.registrar(4L, 5L, null, "Helada", null, null, 7L))
                .isInstanceOf(ConflictoException.class);
        verify(incidenciaRepository, never()).guardar(any());
    }

    @Test
    void sinReferenciaLanza400() {
        assertThatThrownBy(() -> service.registrar(null, null, null, "Algo pasó", null, null, 7L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void laborInexistenteLanza404() {
        when(laborRepository.buscarPorId(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.registrar(null, null, 9L, "Algo pasó", null, null, 7L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void usuarioInexistenteLanza404() {
        existeParcela(3L);
        when(usuarioRepository.buscarPorId(7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.registrar(3L, null, null, "Algo pasó", null, null, 7L))
                .isInstanceOf(UsuarioNoEncontradoException.class);
    }

    private Incidencia abierta() {
        Incidencia incidencia = new Incidencia(4L, 3L, null, null, "Helada", 7L);
        when(incidenciaRepository.buscarPorId(4L)).thenReturn(Optional.of(incidencia));
        return incidencia;
    }

    @Test
    void seAtiendeYLuegoSeResuelve() {
        abierta();
        guardaLoRecibido();

        assertThat(service.atender(4L).getEstado()).isEqualTo(EstadoIncidencia.EN_ATENCION);
        Incidencia resuelta = service.resolver(4L, "  Se cubrió con manta térmica ");

        assertThat(resuelta.getEstado()).isEqualTo(EstadoIncidencia.RESUELTA);
        assertThat(resuelta.getResolucion()).isEqualTo("Se cubrió con manta térmica");
        assertThat(resuelta.getResueltaEn()).isNotNull();
    }

    @Test
    void noSeResuelveSinDecirComoNiDosVeces() {
        Incidencia incidencia = abierta();

        assertThatThrownBy(() -> service.resolver(4L, " ")).isInstanceOf(IllegalArgumentException.class);
        incidencia.resolver("Listo");
        assertThatThrownBy(() -> service.resolver(4L, "Otra vez")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service.atender(4L)).isInstanceOf(IllegalStateException.class);
    }

    private Incidencia existente() {
        Incidencia incidencia = new Incidencia(4L, 3L, null, null, "Plaga", 7L);
        when(incidenciaRepository.buscarPorId(4L)).thenReturn(Optional.of(incidencia));
        return incidencia;
    }

    @Test
    void anularDesdeAbiertaOEnAtencion() {
        when(incidenciaRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));
        existente();
        Incidencia abierta = service.anular(4L, "Cargada por error", 7L);
        assertThat(abierta.getEstado()).isEqualTo(EstadoIncidencia.ANULADA);
        assertThat(abierta.getAnulacion().motivo()).isEqualTo("Cargada por error");
        assertThat(abierta.getAnulacion().usuarioId()).isEqualTo(7L);
        assertThat(abierta.getAnulacion().fecha()).isNotNull();

        existente().atender();
        assertThat(service.anular(4L, "Repetida", 7L).getEstado()).isEqualTo(EstadoIncidencia.ANULADA);
    }

    @Test
    void noSeAnulaUnaResuelta() {
        existente().resolver("Fumigada");

        assertThatThrownBy(() -> service.anular(4L, "Error", 7L)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void noSeResuelveUnaAnulada() {
        existente().anular("Error", 7L);

        assertThatThrownBy(() -> service.resolver(4L, "Fumigada")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void estaAbiertaSoloAbiertaYEnAtencion() {
        Incidencia incidencia = new Incidencia(4L, 3L, null, null, "Plaga", 7L);
        assertThat(incidencia.estaAbierta()).isTrue();
        incidencia.atender();
        assertThat(incidencia.estaAbierta()).isTrue();
        incidencia.resolver("Fumigada");
        assertThat(incidencia.estaAbierta()).isFalse();
    }
}
