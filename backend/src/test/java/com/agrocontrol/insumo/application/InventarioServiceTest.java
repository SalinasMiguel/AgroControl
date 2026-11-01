package com.agrocontrol.insumo.application;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.insumo.domain.CategoriaInsumo;
import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.insumo.domain.ConsumoLaborRepository;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.insumo.domain.MovimientoInsumoRepository;
import com.agrocontrol.insumo.domain.OrigenMovimiento;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {

    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private MovimientoInsumoRepository movimientoRepository;
    @Mock
    private ConsumoLaborRepository consumoRepository;
    @Mock
    private LaborRepository laborRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private CampanaRepository campanaRepository;

    @InjectMocks
    private InventarioService service;

    private Insumo insumoConStock(String stock) {
        Insumo insumo = new Insumo(4L, "Urea", "kg");
        insumo.registrarEntrada(new BigDecimal(stock));
        // El stock se cambia leyendo con bloqueo de fila, nunca con la lectura normal
        when(insumoRepository.buscarPorIdParaActualizar(4L)).thenReturn(Optional.of(insumo));
        return insumo;
    }

    private void existeUsuario() {
        when(usuarioRepository.buscarPorId(7L)).thenReturn(Optional.of(mock(Usuario.class)));
    }

    private void laborDeCampana(Campana campana) {
        when(laborRepository.buscarPorId(9L)).thenReturn(Optional.of(new Labor(9L, 5L, 3L, "FUMIGACION", LocalDate.now())));
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(campana));
    }

    @Test
    void entradaSumaStockYQuedaRegistrada() {
        Insumo insumo = insumoConStock("10");
        existeUsuario();
        when(movimientoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        MovimientoInsumo movimiento = service.registrarMovimiento(4L, TipoMovimiento.ENTRADA, new BigDecimal("5"), "compra", 7L);

        assertThat(insumo.getStockActual()).isEqualByComparingTo("15");
        assertThat(movimiento.getUsuarioId()).isEqualTo(7L);
        verify(insumoRepository).guardar(insumo);
    }

    @Test
    void salidaSinStockSuficienteNoGuardaNada() {
        insumoConStock("3");
        existeUsuario();

        assertThatThrownBy(() -> service.registrarMovimiento(4L, TipoMovimiento.SALIDA, new BigDecimal("5"), null, 7L))
                .isInstanceOf(IllegalStateException.class);
        verify(insumoRepository, never()).guardar(any());
        verify(movimientoRepository, never()).guardar(any());
    }

    @Test
    void consumoDescuentaStockYRegistraUnaSalida() {
        laborDeCampana(new Campana(5L, 3L, 1L, LocalDate.now()));
        Insumo insumo = insumoConStock("10");
        existeUsuario();
        when(consumoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        service.registrarConsumo(9L, 4L, new BigDecimal("2.5"), 7L);

        assertThat(insumo.getStockActual()).isEqualByComparingTo("7.5");
        verify(movimientoRepository).guardar(any(MovimientoInsumo.class));
    }

    @Test
    void consumoEnCampanaFinalizadaLanza409() {
        Campana finalizada = new Campana(5L, 3L, 1L, LocalDate.of(2026, 1, 1));
        finalizada.iniciar();
        finalizada.finalizar(LocalDate.of(2026, 5, 1));
        laborDeCampana(finalizada);

        assertThatThrownBy(() -> service.registrarConsumo(9L, 4L, BigDecimal.ONE, 7L))
                .isInstanceOf(ConflictoException.class);
        verify(insumoRepository, never()).buscarPorIdParaActualizar(any());
        verify(consumoRepository, never()).guardar(any());
    }

    @Test
    void avisaCuandoElStockLlegaAlMinimo() {
        Insumo diesel = new Insumo(4L, "Diésel", "L", CategoriaInsumo.COMBUSTIBLE, new BigDecimal("300"));
        diesel.registrarEntrada(new BigDecimal("320"));
        assertThat(diesel.porAgotarse()).isFalse();

        diesel.registrarSalida(new BigDecimal("20"));

        assertThat(diesel.porAgotarse()).isTrue();
        // Sin mínimo definido nunca avisa
        assertThat(new Insumo(5L, "Grasa", "kg").porAgotarse()).isFalse();
    }

    @Test
    void sumaLasSalidasDelPeriodoPorInsumo() {
        LocalDate hoy = LocalDate.of(2026, 10, 25);
        when(movimientoRepository.listarSalidasEntre(hoy.withDayOfMonth(1).atStartOfDay(), hoy.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(
                        new MovimientoInsumo(1L, 4L, TipoMovimiento.SALIDA, new BigDecimal("120"), "Tractor 1", 7L),
                        new MovimientoInsumo(2L, 4L, TipoMovimiento.SALIDA, new BigDecimal("60"), "Tractor 2", 7L),
                        new MovimientoInsumo(3L, 6L, TipoMovimiento.SALIDA, BigDecimal.ONE, "Tractor 1", 7L)));
        when(insumoRepository.listarTodos()).thenReturn(List.of(
                new Insumo(4L, "Diésel", "L", CategoriaInsumo.COMBUSTIBLE, null),
                new Insumo(6L, "Filtro de aceite", "unidad", CategoriaInsumo.REPUESTO, null),
                new Insumo(8L, "Urea", "kg", CategoriaInsumo.FERTILIZANTE, null)));

        List<SalidaDeAlmacen> salidas = service.salidasEntre(hoy.withDayOfMonth(1), hoy);

        assertThat(salidas).extracting(SalidaDeAlmacen::nombre).containsExactly("Diésel", "Filtro de aceite");
        assertThat(salidas.get(0).cantidad()).isEqualByComparingTo("180");
        assertThat(salidas.get(0).movimientos()).isEqualTo(2);
    }

    @Test
    void noSeRegistraConsumoEnLaborCancelada() {
        Labor labor = new Labor(9L, 5L, 3L, "RIEGO", LocalDate.now());
        labor.cancelar("Llovió");
        when(laborRepository.buscarPorId(9L)).thenReturn(Optional.of(labor));
        when(campanaRepository.buscarPorId(5L)).thenReturn(Optional.of(new Campana(5L, 3L, 1L, LocalDate.now())));

        assertThatThrownBy(() -> service.registrarConsumo(9L, 4L, BigDecimal.ONE, 1L)).isInstanceOf(ConflictoException.class);

        verify(insumoRepository, never()).guardar(any());
    }

    private static MovimientoInsumo movimiento(OrigenMovimiento origen, TipoMovimiento tipo, String cantidad) {
        return MovimientoInsumo.reconstruir(20L, 4L, tipo, new BigDecimal(cantidad), "m", 7L, LocalDateTime.now(),
                null, origen, null, null);
    }

    @ParameterizedTest
    @EnumSource(value = OrigenMovimiento.class, names = {"CONSUMO", "ANULACION"})
    void soloManualYAjusteSeAnulanDirecto(OrigenMovimiento origen) {
        when(movimientoRepository.buscarMovimientoParaActualizar(20L))
                .thenReturn(Optional.of(movimiento(origen, TipoMovimiento.SALIDA, "5")));

        assertThatThrownBy(() -> service.anularMovimiento(4L, 20L, "Error", 7L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void anularUnaEntradaSinStockDa409() {
        when(movimientoRepository.buscarMovimientoParaActualizar(20L))
                .thenReturn(Optional.of(movimiento(OrigenMovimiento.MANUAL, TipoMovimiento.ENTRADA, "5")));
        insumoConStock("3");

        assertThatThrownBy(() -> service.anularMovimiento(4L, 20L, "Error", 7L)).isInstanceOf(IllegalStateException.class);

        verify(movimientoRepository, never()).guardar(any());
        verify(insumoRepository, never()).guardar(any());
    }

    @Test
    void anularUnaSalidaDevuelveElStockConUnMovimientoInverso() {
        when(movimientoRepository.buscarMovimientoParaActualizar(20L))
                .thenReturn(Optional.of(movimiento(OrigenMovimiento.MANUAL, TipoMovimiento.SALIDA, "5")));
        Insumo insumo = insumoConStock("3");
        when(movimientoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        MovimientoInsumo anulado = service.anularMovimiento(4L, 20L, "Error", 7L);

        assertThat(anulado.isAnulado()).isTrue();
        assertThat(insumo.getStockActual()).isEqualByComparingTo("8");
        ArgumentCaptor<MovimientoInsumo> guardados = ArgumentCaptor.forClass(MovimientoInsumo.class);
        verify(movimientoRepository, times(2)).guardar(guardados.capture());
        MovimientoInsumo inverso = guardados.getAllValues().get(1);
        assertThat(inverso.getTipo()).isEqualTo(TipoMovimiento.ENTRADA);
        assertThat(inverso.getOrigen()).isEqualTo(OrigenMovimiento.ANULACION);
        assertThat(inverso.getMovimientoAnuladoId()).isEqualTo(20L);
    }

    @Test
    void elMotivoDelInversoNoPasaDe150Caracteres() {
        MovimientoInsumo inverso = MovimientoInsumo.inversoDe(
                movimiento(OrigenMovimiento.MANUAL, TipoMovimiento.SALIDA, "5"), "x".repeat(200), 7L);

        assertThat(inverso.getMotivo()).hasSizeLessThanOrEqualTo(150);
    }

    @Test
    void movimientoDeOtroInsumoDa404() {
        when(movimientoRepository.buscarMovimientoParaActualizar(20L))
                .thenReturn(Optional.of(movimiento(OrigenMovimiento.MANUAL, TipoMovimiento.SALIDA, "5")));

        assertThatThrownBy(() -> service.anularMovimiento(8L, 20L, "Error", 7L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    private static ConsumoLabor consumo() {
        return new ConsumoLabor(30L, 9L, 4L, new BigDecimal("2"));
    }

    @Test
    void consumoDeOtraLaborDa404() {
        when(consumoRepository.buscarConsumoParaActualizar(30L)).thenReturn(Optional.of(consumo()));

        assertThatThrownBy(() -> service.anularConsumo(8L, 30L, "Error", 7L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void consumoSinMovimientoEnlazadoDa409() {
        when(consumoRepository.buscarConsumoParaActualizar(30L)).thenReturn(Optional.of(consumo()));
        when(movimientoRepository.buscarPorConsumo(30L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.anularConsumo(9L, 30L, "Error", 7L)).isInstanceOf(ConflictoException.class);
    }

    @Test
    void anularConsumoFuncionaConCampanaCerrada() {
        ConsumoLabor consumo = consumo();
        when(consumoRepository.buscarConsumoParaActualizar(30L)).thenReturn(Optional.of(consumo));
        MovimientoInsumo salida = movimiento(OrigenMovimiento.CONSUMO, TipoMovimiento.SALIDA, "2");
        when(movimientoRepository.buscarPorConsumo(30L)).thenReturn(Optional.of(salida));
        Insumo insumo = insumoConStock("3");
        when(consumoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));
        when(movimientoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        ConsumoLabor anulado = service.anularConsumo(9L, 30L, "Error", 7L);

        assertThat(anulado.isAnulado()).isTrue();
        assertThat(salida.isAnulado()).isTrue();
        assertThat(insumo.getStockActual()).isEqualByComparingTo("5");
        verify(campanaRepository, never()).buscarPorId(any());
    }

    @Test
    void ajusteIgualAlStockDa409() {
        insumoConStock("80");
        existeUsuario();

        assertThatThrownBy(() -> service.ajustarStock(4L, new BigDecimal("80.00"), "Conteo", 7L))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void ajustePorDebajoCreaSalidaYPorEncimaEntrada() {
        Insumo insumo = insumoConStock("85");
        existeUsuario();
        when(movimientoRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        MovimientoInsumo salida = service.ajustarStock(4L, new BigDecimal("80"), "Conteo", 7L);
        assertThat(salida.getTipo()).isEqualTo(TipoMovimiento.SALIDA);
        assertThat(salida.getCantidad()).isEqualByComparingTo("5");
        assertThat(salida.getOrigen()).isEqualTo(OrigenMovimiento.AJUSTE);

        MovimientoInsumo entrada = service.ajustarStock(4L, new BigDecimal("85"), "Conteo", 7L);
        assertThat(entrada.getTipo()).isEqualTo(TipoMovimiento.ENTRADA);
        assertThat(insumo.getStockActual()).isEqualByComparingTo("85");
    }
}
