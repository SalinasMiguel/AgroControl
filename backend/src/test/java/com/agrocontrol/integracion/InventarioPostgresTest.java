package com.agrocontrol.integracion;

import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.domain.CategoriaInsumo;
import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import com.agrocontrol.labor.application.LaborService;
import com.agrocontrol.labor.domain.EstadoLabor;
import com.agrocontrol.labor.domain.Labor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Reglas de stock contra un PostgreSQL real: la regla stock_actual = entradas - salidas y los bloqueos de fila.
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class InventarioPostgresTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    private InventarioService inventario;
    @Autowired
    private LaborService laborService;
    @Autowired
    private JdbcTemplate jdbc;

    private Long usuario;
    private Long labor;
    private Long insumo;

    private static BigDecimal bd(String valor) {
        return new BigDecimal(valor);
    }

    @BeforeEach
    void preparar() {
        usuario = jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);
        Long campana = jdbc.queryForObject("SELECT min(id_campana) FROM agrocontrol.campana WHERE estado IN ('PLANIFICADA', 'EN_CURSO')", Long.class);
        labor = laborService.planificar(campana, "PRUEBA", LocalDate.now()).getId();
        insumo = inventario.crearInsumo("Prueba " + UUID.randomUUID(), "kg", CategoriaInsumo.OTRO, BigDecimal.ZERO).getId();
    }

    private BigDecimal stock() {
        return inventario.obtenerInsumo(insumo).getStockActual();
    }

    private MovimientoInsumo mover(TipoMovimiento tipo, String cantidad) {
        return inventario.registrarMovimiento(insumo, tipo, bd(cantidad), "prueba", usuario);
    }

    private void anularMovimiento(MovimientoInsumo movimiento) {
        inventario.anularMovimiento(insumo, movimiento.getId(), "Error de carga", usuario);
    }

    private void secuenciaCompleta() {
        MovimientoInsumo entrada = mover(TipoMovimiento.ENTRADA, "100");
        MovimientoInsumo salida = mover(TipoMovimiento.SALIDA, "10");
        ConsumoLabor consumo = inventario.registrarConsumo(labor, insumo, bd("5"), usuario);
        MovimientoInsumo ajuste = inventario.ajustarStock(insumo, bd("80"), "Conteo físico", usuario);
        assertThat(stock()).isEqualByComparingTo("80");

        anularMovimiento(ajuste);
        assertThat(stock()).isEqualByComparingTo("85");
        inventario.anularConsumo(labor, consumo.getId(), "Error de carga", usuario);
        assertThat(stock()).isEqualByComparingTo("90");

        assertThatThrownBy(() -> anularMovimiento(entrada)).isInstanceOf(IllegalStateException.class);
        assertThat(stock()).isEqualByComparingTo("90");

        anularMovimiento(salida);
        assertThat(stock()).isEqualByComparingTo("100");
        anularMovimiento(entrada);
        assertThat(stock()).isEqualByComparingTo("0");
    }

    @Test
    void elStockCuadraTrasTodaLaSecuencia() {
        secuenciaCompleta();

        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM agrocontrol.insumo i
                WHERE i.stock_actual <> (SELECT coalesce(sum(CASE m.tipo WHEN 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END), 0)
                                         FROM agrocontrol.movimiento_insumo m WHERE m.id_insumo = i.id_insumo)""",
                Integer.class)).isZero();
    }

    @Test
    void lasSalidasExcluyenAnuladosYAjustes() {
        secuenciaCompleta();

        assertThat(inventario.salidasEntre(LocalDate.now(), LocalDate.now()))
                .noneMatch(salida -> salida.insumoId().equals(insumo));
    }

    @Test
    void dosAnulacionesSimultaneasDevuelvenElStockUnaVez() throws Exception {
        mover(TipoMovimiento.ENTRADA, "10");
        ConsumoLabor consumo = inventario.registrarConsumo(labor, insumo, bd("4"), usuario);
        ExecutorService hilos = Executors.newFixedThreadPool(2);
        try {
            List<Future<ConsumoLabor>> resultados = hilos.invokeAll(List.of(
                    () -> inventario.anularConsumo(labor, consumo.getId(), "Doble clic", usuario),
                    () -> inventario.anularConsumo(labor, consumo.getId(), "Doble clic", usuario)));
            int rechazados = 0;
            for (Future<ConsumoLabor> resultado : resultados) {
                try {
                    resultado.get();
                } catch (ExecutionException e) {
                    assertThat(e.getCause()).isInstanceOf(IllegalStateException.class);
                    rechazados++;
                }
            }
            assertThat(rechazados).isEqualTo(1);
        } finally {
            hilos.shutdown();
        }
        assertThat(stock()).isEqualByComparingTo("10");
    }

    @Test
    void cancelarLaborConConsumosNoTocaElStock() {
        mover(TipoMovimiento.ENTRADA, "10");
        inventario.registrarConsumo(labor, insumo, bd("4"), usuario);

        Labor cancelada = laborService.cancelar(labor, "Llovió");

        assertThat(cancelada.getEstado()).isEqualTo(EstadoLabor.CANCELADA);
        assertThat(stock()).isEqualByComparingTo("6");
        assertThat(inventario.listarConsumos(labor)).hasSize(1);
    }

    @Test
    void anularUnoDeDosConsumosIgualesDevuelveSoloSuCantidad() {
        mover(TipoMovimiento.ENTRADA, "10");
        ConsumoLabor primero = inventario.registrarConsumo(labor, insumo, bd("3"), usuario);
        inventario.registrarConsumo(labor, insumo, bd("3"), usuario);

        inventario.anularConsumo(labor, primero.getId(), "Repetido", usuario);

        assertThat(stock()).isEqualByComparingTo("7");
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM agrocontrol.movimiento_insumo
                WHERE id_insumo = ? AND origen = 'CONSUMO' AND NOT anulado""", Integer.class, insumo)).isEqualTo(1);
    }
}
