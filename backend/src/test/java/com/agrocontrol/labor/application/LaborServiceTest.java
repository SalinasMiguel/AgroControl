package com.agrocontrol.labor.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.labor.domain.EstadoLabor;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.shared.domain.AccesoDenegadoException;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LaborServiceTest {

    @Mock
    private LaborRepository laborRepository;
    @Mock
    private CampanaRepository campanaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private RolRepository rolRepository;

    @InjectMocks
    private LaborService service;

    private Campana campanaFinalizada() {
        Campana campana = new Campana(5L, 3L, 1L, LocalDate.of(2026, 1, 1));
        campana.iniciar();
        campana.finalizar(LocalDate.of(2026, 5, 1));
        return campana;
    }

    private Labor laborPlanificada() {
        Labor labor = new Labor(9L, 5L, 3L, "RIEGO", LocalDate.now());
        when(laborRepository.buscarPorId(9L)).thenReturn(Optional.of(labor));
        return labor;
    }

    private void usuarioConRol(Long id, String rol, boolean activo) {
        when(usuarioRepository.buscarPorId(id)).thenReturn(Optional.of(
                new Usuario(id, "Luis Choque", "luis@agrocontrol.com", "hash", 3L, activo, LocalDateTime.now())));
        when(rolRepository.buscarPorId(3L)).thenReturn(Optional.of(new Rol(3L, rol, null)));
    }

    @Test
    void planificaTomandoLaParcelaDeLaCampana() {
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));
        when(laborRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Labor labor = service.planificar(5L, " riego ", LocalDate.now());

        assertThat(labor.getParcelaId()).isEqualTo(3L);
        assertThat(labor.getTipo()).isEqualTo("RIEGO");
        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.PLANIFICADA);
    }

    @Test
    void noPlanificaEnCampanaFinalizada() {
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campanaFinalizada()));

        assertThatThrownBy(() -> service.planificar(5L, "RIEGO", LocalDate.now()))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void ejecutarGuardaElNuevoEstado() {
        laborPlanificada();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));
        when(laborRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Labor ejecutada = service.ejecutar(9L, LocalDate.now());

        assertThat(ejecutada.getEstado()).isEqualTo(EstadoLabor.EJECUTADA);
        verify(laborRepository).guardar(ejecutada);
    }

    @Test
    void noEjecutaLaboresDeCampanaFinalizada() {
        laborPlanificada();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campanaFinalizada()));

        assertThatThrownBy(() -> service.ejecutar(9L, LocalDate.now())).isInstanceOf(ConflictoException.class);
        verify(laborRepository, never()).guardar(any());
    }

    @Test
    void soloAsignaOperariosActivos() {
        laborPlanificada();
        usuarioConRol(7L, "ALMACENERO", true);

        assertThatThrownBy(() -> service.asignar(9L, 7L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void operarioInactivoNoSeAsigna() {
        laborPlanificada();
        usuarioConRol(7L, "OPERARIO", false);

        assertThatThrownBy(() -> service.asignar(9L, 7L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void operarioSinAsignacionNoPuedeTocarLaLabor() {
        laborPlanificada();
        when(laborRepository.estaAsignada(9L, 7L)).thenReturn(false);

        assertThatThrownBy(() -> service.verificarAsignacion(9L, 7L)).isInstanceOf(AccesoDenegadoException.class);
    }

    @Test
    void iniciarPasaAEnCursoYLuegoSePuedeEjecutar() {
        laborPlanificada();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));
        when(laborRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.iniciar(9L).getEstado()).isEqualTo(EstadoLabor.EN_CURSO);
        assertThat(service.ejecutar(9L, LocalDate.now()).getEstado()).isEqualTo(EstadoLabor.EJECUTADA);
    }

    @Test
    void noSeIniciaDosVeces() {
        Labor labor = laborPlanificada();
        labor.iniciar();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));

        assertThatThrownBy(() -> service.iniciar(9L)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void editarCancelarYReabrirExigenCampanaAbierta() {
        laborPlanificada();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campanaFinalizada()));

        assertThatThrownBy(() -> service.editar(9L, "RIEGO", LocalDate.now())).isInstanceOf(ConflictoException.class);
        assertThatThrownBy(() -> service.cancelar(9L, "Llovió")).isInstanceOf(ConflictoException.class);
        assertThatThrownBy(() -> service.reabrir(9L, "Faltó una pasada")).isInstanceOf(ConflictoException.class);
        verify(laborRepository, never()).guardar(any());
    }

    @Test
    void editarNormalizaElTipo() {
        laborPlanificada();
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));
        when(laborRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Labor labor = service.editar(9L, " fumigacion ", LocalDate.now());

        assertThat(labor.getTipo()).isEqualTo("FUMIGACION");
    }

    @Test
    void noSeAsignaUnaLaborCancelada() {
        laborPlanificada().cancelar("Llovió");

        assertThatThrownBy(() -> service.asignar(9L, 7L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void asignarDejaLaLaborAsignada() {
        Labor labor = laborPlanificada();
        usuarioConRol(7L, "OPERARIO", true);
        when(laborRepository.estaAsignada(9L, 7L)).thenReturn(false);

        service.asignar(9L, 7L);

        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.ASIGNADA);
        verify(laborRepository).guardar(labor);
    }
}
