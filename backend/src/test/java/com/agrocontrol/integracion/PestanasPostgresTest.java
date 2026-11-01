package com.agrocontrol.integracion;

import com.agrocontrol.cosecha.application.CosechaService;
import com.agrocontrol.cosecha.domain.CalidadCosecha;
import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.incidencia.application.FotoIncidenciaService;
import com.agrocontrol.incidencia.application.IncidenciaService;
import com.agrocontrol.incidencia.domain.FotoIncidencia;
import com.agrocontrol.incidencia.domain.GravedadIncidencia;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.TipoIncidencia;
import com.agrocontrol.insumo.application.EquivalenciaService;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.domain.DocumentoCompra;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.cultivo.domain.CultivoRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class PestanasPostgresTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired private IncidenciaService incidencias;
    @Autowired private FotoIncidenciaService fotos;
    @Autowired private EquivalenciaService equivalencias;
    @Autowired private InventarioService inventario;
    @Autowired private CosechaService cosechas;
    @Autowired private CultivoRepository cultivos;
    @Autowired private JdbcTemplate jdbc;

    private Long usuario;

    @BeforeEach
    void preparar() {
        usuario = jdbc.queryForObject("SELECT min(id_usuario) FROM agrocontrol.usuario", Long.class);
    }

    private Incidencia incidencia() {
        Long parcela = jdbc.queryForObject("SELECT min(id_parcela) FROM agrocontrol.parcela", Long.class);
        return incidencias.registrar(parcela, null, null, "Plaga", TipoIncidencia.PLAGA, GravedadIncidencia.ALTA, usuario);
    }

    @Test
    void lasFotosSeGuardanYElListadoNoTraeLosBytes() {
        Long id = incidencia().getId();
        byte[] jpg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 7, 8, 9};

        FotoIncidencia guardada = fotos.agregar(id, jpg, usuario);

        List<FotoIncidencia> lista = fotos.listar(id);
        assertThat(lista).hasSize(1);
        assertThat(lista.get(0).datos()).isNull();
        assertThat(lista.get(0).tipoContenido()).isEqualTo("image/jpeg");
        assertThat(fotos.obtener(id, guardada.id()).datos()).isEqualTo(jpg);
    }

    @Test
    void elResponsableSeGuarda() {
        Long id = incidencia().getId();
        incidencias.asignarResponsable(id, usuario);
        assertThat(incidencias.obtener(id).getResponsableId()).isEqualTo(usuario);
    }

    @Test
    void laEquivalenciaValeEnLosDosSentidosYSePuedeQuitar() {
        List<Insumo> todos = inventario.listarInsumos();
        Long a = todos.get(0).getId();
        Long b = todos.get(1).getId();

        equivalencias.vincular(b, a);
        equivalencias.vincular(a, b);

        assertThat(equivalencias.listar(a)).extracting(Insumo::getId).containsExactly(b);
        assertThat(equivalencias.listar(b)).extracting(Insumo::getId).containsExactly(a);
        equivalencias.desvincular(a, b);
        assertThat(equivalencias.listar(a)).isEmpty();
    }

    @Test
    void laCompraSumaStockYGuardaProveedorYFactura() {
        Insumo insumo = inventario.listarInsumos().get(0);

        MovimientoInsumo compra = inventario.registrarCompra(insumo.getId(), new BigDecimal("5"), null,
                new DocumentoCompra(" Agroquímica S.A. ", "F-100"), usuario);

        assertThat(compra.getDocumento().proveedor()).isEqualTo("Agroquímica S.A.");
        assertThat(inventario.listarMovimientos(insumo.getId())).extracting(m -> m.getDocumento().numeroFactura()).contains("F-100");
        assertThat(inventario.obtenerInsumo(insumo.getId()).getStockActual())
                .isEqualByComparingTo(insumo.getStockActual().add(new BigDecimal("5")));
    }

    @Test
    void corregirDejaUnaSolaCargaVigente() {
        Long campana = jdbc.queryForObject("SELECT min(id_campana) FROM agrocontrol.campana", Long.class);
        LocalDate hoy = LocalDate.now();
        jdbc.update("UPDATE agrocontrol.campana SET estado = 'EN_CURSO', fecha_fin = NULL, fecha_inicio = ? WHERE id_campana = ?",
                hoy.minusDays(10), campana);
        Cosecha mala = cosechas.registrar(campana, new BigDecimal("10"), "t", hoy, CalidadCosecha.VACIA, usuario);

        Cosecha buena = cosechas.corregir(mala.getId(), "Error", new BigDecimal("12"), "t", hoy, CalidadCosecha.VACIA, usuario);

        List<Cosecha> vigentes = cosechas.listar(campana).stream().filter(c -> !c.isAnulado()).toList();
        assertThat(vigentes).extracting(Cosecha::getId).contains(buena.getId()).doesNotContain(mala.getId());
    }

    @Test
    void laMigracionCargaLaHumedadDeLosCultivosConocidos() {
        Long soya = jdbc.queryForObject("SELECT id_cultivo FROM agrocontrol.cultivo WHERE nombre = 'Soya'", Long.class);
        assertThat(cultivos.buscarPorId(soya).orElseThrow().getHumedadEstandarPct()).isEqualByComparingTo("13");
    }
}
