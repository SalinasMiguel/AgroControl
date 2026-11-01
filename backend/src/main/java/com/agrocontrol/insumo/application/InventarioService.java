package com.agrocontrol.insumo.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.insumo.domain.CategoriaInsumo;
import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.insumo.domain.ConsumoLaborRepository;
import com.agrocontrol.insumo.domain.Insumo;
import com.agrocontrol.insumo.domain.InsumoRepository;
import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.insumo.domain.MovimientoInsumoRepository;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.UsuarioNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class InventarioService {

    private final InsumoRepository insumoRepository;
    private final MovimientoInsumoRepository movimientoRepository;
    private final ConsumoLaborRepository consumoRepository;
    private final LaborRepository laborRepository;
    private final UsuarioRepository usuarioRepository;
    private final CampanaRepository campanaRepository;

    public InventarioService(InsumoRepository insumoRepository, MovimientoInsumoRepository movimientoRepository,
                             ConsumoLaborRepository consumoRepository, LaborRepository laborRepository,
                             UsuarioRepository usuarioRepository, CampanaRepository campanaRepository) {
        this.insumoRepository = insumoRepository;
        this.movimientoRepository = movimientoRepository;
        this.consumoRepository = consumoRepository;
        this.laborRepository = laborRepository;
        this.usuarioRepository = usuarioRepository;
        this.campanaRepository = campanaRepository;
    }

    @Transactional(readOnly = true)
    public List<Insumo> listarInsumos() {
        return insumoRepository.listarTodos();
    }

    @Transactional(readOnly = true)
    public Insumo obtenerInsumo(Long id) {
        return insumoRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el insumo con id: " + id));
    }

    @Auditable(entidad = "INSUMO", accion = "CREAR")
    @Transactional
    public Insumo crearInsumo(String nombre, String unidadMedida, CategoriaInsumo categoria, BigDecimal stockMinimo,
                              String codigo, String marca) {
        // El stock nace en cero: solo cambia a través de movimientos, para que quede trazado
        Insumo insumo = new Insumo(null, nombre.trim(), unidadMedida.trim(), categoria, stockMinimo, codigo, marca);
        verificarPiezaNoRepetida(insumo);
        return insumoRepository.guardar(insumo);
    }

    // Nombre, unidad, categoría, mínimo, código y marca; el stock no se edita a mano (solo con movimientos)
    @Auditable(entidad = "INSUMO", accion = "ACTUALIZAR")
    @Transactional
    public Insumo actualizarInsumo(Long id, String nombre, String unidadMedida, CategoriaInsumo categoria,
                                   BigDecimal stockMinimo, String codigo, String marca) {
        Insumo insumo = obtenerInsumo(id);
        insumo.actualizar(nombre.trim(), unidadMedida.trim(), categoria, stockMinimo, codigo, marca);
        verificarPiezaNoRepetida(insumo);
        return insumoRepository.guardar(insumo);
    }

    // Avisa con claridad; el índice uq_insumo_codigo_marca lo garantiza si dos personas guardan a la vez
    private void verificarPiezaNoRepetida(Insumo insumo) {
        if (insumo.getCodigo() == null) {
            return;
        }
        insumoRepository.listarTodos().stream()
                .filter(otro -> !otro.getId().equals(insumo.getId()))
                .filter(otro -> otro.esMismaPieza(insumo.getCodigo(), insumo.getMarca()))
                .findFirst()
                .ifPresent(otro -> {
                    throw new IllegalStateException("Ese código ya está registrado en: " + otro.getNombre());
                });
    }

    // Lo que salió del almacén entre dos fechas, sumado por insumo y ordenado por categoría
    @Transactional(readOnly = true)
    public List<SalidaDeAlmacen> salidasEntre(LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) {
            throw new IllegalArgumentException("La fecha final no puede ser anterior a la inicial");
        }
        Map<Long, List<MovimientoInsumo>> porInsumo = movimientoRepository
                .listarSalidasEntre(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay()).stream()
                .collect(Collectors.groupingBy(MovimientoInsumo::getInsumoId));
        return insumoRepository.listarTodos().stream()
                .filter(insumo -> porInsumo.containsKey(insumo.getId()))
                .map(insumo -> {
                    List<MovimientoInsumo> salidas = porInsumo.get(insumo.getId());
                    BigDecimal total = salidas.stream().map(MovimientoInsumo::getCantidad)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SalidaDeAlmacen(insumo.getId(), insumo.getNombre(), insumo.getCategoria(),
                            insumo.getUnidadMedida(), total, salidas.size());
                })
                .sorted(Comparator.comparing(SalidaDeAlmacen::categoria).thenComparing(SalidaDeAlmacen::nombre))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovimientoInsumo> listarMovimientos(Long insumoId) {
        obtenerInsumo(insumoId);
        return movimientoRepository.listarPorInsumo(insumoId);
    }

    @Auditable(entidad = "MOVIMIENTO_INSUMO", accion = "REGISTRAR")
    @Transactional
    public MovimientoInsumo registrarMovimiento(Long insumoId, TipoMovimiento tipo, BigDecimal cantidad,
                                                String motivo, Long usuarioId) {
        Insumo insumo = obtenerInsumoParaActualizar(insumoId);
        verificarUsuario(usuarioId);
        aplicar(insumo, tipo, cantidad);
        insumoRepository.guardar(insumo);
        return movimientoRepository.guardar(new MovimientoInsumo(null, insumoId, tipo, cantidad, motivo, usuarioId));
    }

    @Transactional(readOnly = true)
    public List<ConsumoLabor> listarConsumos(Long laborId) {
        obtenerLabor(laborId);
        return consumoRepository.listarPorLabor(laborId);
    }

    // Una sola transacción: si falta stock no se guarda ni el consumo ni el movimiento.
    @Auditable(entidad = "CONSUMO_LABOR", accion = "REGISTRAR")
    @Transactional
    public ConsumoLabor registrarConsumo(Long laborId, Long insumoId, BigDecimal cantidad, Long usuarioId) {
        Labor labor = obtenerLabor(laborId);
        boolean campanaCerrada = campanaRepository.buscarPorId(labor.getCampanaId())
                .map(campana -> campana.estaCerrada()).orElse(false);
        if (campanaCerrada) {
            throw new ConflictoException("No se registran consumos en labores de una campaña cerrada");
        }
        if (labor.estaCancelada()) {
            throw new ConflictoException("No se registran consumos en una labor cancelada");
        }
        Insumo insumo = obtenerInsumoParaActualizar(insumoId);
        verificarUsuario(usuarioId);
        insumo.registrarSalida(cantidad);
        insumoRepository.guardar(insumo);
        ConsumoLabor consumo = consumoRepository.guardar(new ConsumoLabor(null, laborId, insumoId, cantidad));
        String motivo = "Consumo en labor " + labor.getId() + " (" + labor.getTipo() + ")";
        movimientoRepository.guardar(MovimientoInsumo.deConsumo(insumoId, cantidad, motivo, usuarioId, consumo.getId()));
        return consumo;
    }

    // Orden de bloqueo: primero el registro que se anula, después el insumo. Así, de dos anulaciones
    // simultáneas, la segunda espera y lee anulado = true antes de tocar el stock.
    @Auditable(entidad = "MOVIMIENTO_INSUMO", accion = "ANULAR")
    @Transactional
    public MovimientoInsumo anularMovimiento(Long insumoId, Long movimientoId, String motivo, Long usuarioId) {
        MovimientoInsumo movimiento = movimientoRepository.buscarMovimientoParaActualizar(movimientoId)
                .filter(m -> m.getInsumoId().equals(insumoId))
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el movimiento con id: " + movimientoId));
        if (!movimiento.esAnulableDirecto()) {
            throw new ConflictoException("Este movimiento no se anula directamente");
        }
        movimiento.anular(motivo, usuarioId);
        Insumo insumo = obtenerInsumoParaActualizar(insumoId);
        MovimientoInsumo inverso = MovimientoInsumo.inversoDe(movimiento, motivo, usuarioId);
        aplicar(insumo, inverso.getTipo(), inverso.getCantidad());
        insumoRepository.guardar(insumo);
        MovimientoInsumo anulado = movimientoRepository.guardar(movimiento);
        movimientoRepository.guardar(inverso);
        return anulado;
    }

    @Auditable(entidad = "CONSUMO_LABOR", accion = "ANULAR")
    @Transactional
    public ConsumoLabor anularConsumo(Long laborId, Long consumoId, String motivo, Long usuarioId) {
        ConsumoLabor consumo = consumoRepository.buscarConsumoParaActualizar(consumoId)
                .filter(c -> c.getLaborId().equals(laborId))
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el consumo con id: " + consumoId));
        consumo.anular(motivo, usuarioId);
        MovimientoInsumo salida = movimientoRepository.buscarPorConsumo(consumoId)
                .orElseThrow(() -> new ConflictoException("Este consumo no tiene su salida enlazada: corrija el stock con un ajuste"));
        salida.anular(motivo, usuarioId);
        Insumo insumo = obtenerInsumoParaActualizar(consumo.getInsumoId());
        MovimientoInsumo inverso = MovimientoInsumo.inversoDe(salida, motivo, usuarioId);
        aplicar(insumo, inverso.getTipo(), inverso.getCantidad());
        insumoRepository.guardar(insumo);
        movimientoRepository.guardar(salida);
        movimientoRepository.guardar(inverso);
        return consumoRepository.guardar(consumo);
    }

    // Conteo físico: registra la diferencia, no pisa el stock.
    @Auditable(entidad = "INSUMO", accion = "AJUSTAR")
    @Transactional
    public MovimientoInsumo ajustarStock(Long insumoId, BigDecimal stockContado, String motivo, Long usuarioId) {
        Insumo insumo = obtenerInsumoParaActualizar(insumoId);
        verificarUsuario(usuarioId);
        BigDecimal diferencia = stockContado.subtract(insumo.getStockActual());
        if (diferencia.signum() == 0) {
            throw new ConflictoException("El stock contado es igual al stock actual");
        }
        TipoMovimiento tipo = diferencia.signum() > 0 ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA;
        aplicar(insumo, tipo, diferencia.abs());
        insumoRepository.guardar(insumo);
        return movimientoRepository.guardar(MovimientoInsumo.deAjuste(insumoId, tipo, diferencia.abs(), motivo, usuarioId));
    }

    private static void aplicar(Insumo insumo, TipoMovimiento tipo, BigDecimal cantidad) {
        if (tipo == TipoMovimiento.ENTRADA) {
            insumo.registrarEntrada(cantidad);
        } else {
            insumo.registrarSalida(cantidad);
        }
    }

    private Insumo obtenerInsumoParaActualizar(Long id) {
        return insumoRepository.buscarPorIdParaActualizar(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el insumo con id: " + id));
    }

    private Labor obtenerLabor(Long laborId) {
        return laborRepository.buscarPorId(laborId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la labor con id: " + laborId));
    }

    private void verificarUsuario(Long usuarioId) {
        if (usuarioRepository.buscarPorId(usuarioId).isEmpty()) {
            throw new UsuarioNoEncontradoException(usuarioId);
        }
    }
}
