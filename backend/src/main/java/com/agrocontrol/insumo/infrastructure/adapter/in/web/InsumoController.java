package com.agrocontrol.insumo.infrastructure.adapter.in.web;

import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.insumo.application.SalidaDeAlmacen;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.AjusteStockRequest;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.CrearInsumoRequest;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.InsumoResponse;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.MovimientoResponse;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.RegistrarCompraRequest;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.RegistrarMovimientoRequest;
import com.agrocontrol.shared.web.MotivoRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/insumos")
public class InsumoController {

    private final InventarioService service;

    public InsumoController(InventarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<InsumoResponse> listar() {
        return service.listarInsumos().stream().map(InsumoResponse::desde).toList();
    }

    @GetMapping("/{id}")
    public InsumoResponse buscarPorId(@PathVariable Long id) {
        return InsumoResponse.desde(service.obtenerInsumo(id));
    }

    @PostMapping
    public ResponseEntity<InsumoResponse> crear(@Valid @RequestBody CrearInsumoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(InsumoResponse.desde(service.crearInsumo(request.nombre(), request.unidadMedida(),
                        request.categoria(), request.stockMinimo(), request.codigo(), request.marca())));
    }

    @PutMapping("/{id}")
    public InsumoResponse actualizar(@PathVariable Long id, @Valid @RequestBody CrearInsumoRequest request) {
        return InsumoResponse.desde(service.actualizarInsumo(id, request.nombre(), request.unidadMedida(),
                request.categoria(), request.stockMinimo(), request.codigo(), request.marca()));
    }

    // Por defecto, lo que va del mes: cuánto combustible, repuestos, etc. salió del almacén
    @GetMapping("/salidas")
    public List<SalidaDeAlmacen> salidas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        LocalDate hoy = LocalDate.now();
        return service.salidasEntre(desde == null ? hoy.withDayOfMonth(1) : desde, hasta == null ? hoy : hasta);
    }

    @PostMapping("/{id}/movimientos/{movimientoId}/anular")
    public MovimientoResponse anularMovimiento(@PathVariable Long id, @PathVariable Long movimientoId,
                                               @Valid @RequestBody MotivoRequest request,
                                               @AuthenticationPrincipal Jwt jwt) {
        return MovimientoResponse.desde(service.anularMovimiento(id, movimientoId, request.motivo(), UsuarioAutenticado.id(jwt)));
    }

    @PostMapping("/{id}/ajustes")
    public ResponseEntity<MovimientoResponse> ajustar(@PathVariable Long id, @Valid @RequestBody AjusteStockRequest request,
                                                      @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED).body(MovimientoResponse.desde(
                service.ajustarStock(id, request.stockContado(), request.motivo(), UsuarioAutenticado.id(jwt))));
    }

    @PostMapping("/{id}/compras")
    public ResponseEntity<MovimientoResponse> registrarCompra(@PathVariable Long id,
                                                              @Valid @RequestBody RegistrarCompraRequest request,
                                                              @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED).body(MovimientoResponse.desde(service.registrarCompra(
                id, request.cantidad(), request.motivo(), request.documento(), UsuarioAutenticado.id(jwt))));
    }

    @GetMapping("/{id}/movimientos")
    public List<MovimientoResponse> listarMovimientos(@PathVariable Long id) {
        return service.listarMovimientos(id).stream().map(MovimientoResponse::desde).toList();
    }

    @PostMapping("/{id}/movimientos")
    public ResponseEntity<MovimientoResponse> registrarMovimiento(@PathVariable Long id,
                                                                  @Valid @RequestBody RegistrarMovimientoRequest request,
                                                                  @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED).body(MovimientoResponse.desde(service.registrarMovimiento(
                id, request.tipo(), request.cantidad(), request.motivo(), UsuarioAutenticado.id(jwt))));
    }
}
