package com.agrocontrol.labor.infrastructure.adapter.in.web;

import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import com.agrocontrol.insumo.application.InventarioService;
import com.agrocontrol.labor.application.LaborService;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.AsignacionResponse;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.AsignarOperarioRequest;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.ConsumoResponse;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.EditarLaborRequest;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.EjecutarLaborRequest;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.LaborResponse;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.PlanificarLaborRequest;
import com.agrocontrol.labor.infrastructure.adapter.in.web.dto.RegistrarConsumoRequest;
import com.agrocontrol.shared.web.MotivoRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/labores")
public class LaborController {

    private final LaborService laborService;
    private final InventarioService inventarioService;

    public LaborController(LaborService laborService, InventarioService inventarioService) {
        this.laborService = laborService;
        this.inventarioService = inventarioService;
    }

    // El operario recibe solo su agenda (RN-05); el resto de roles ve todas las labores
    @GetMapping
    public List<LaborResponse> listar(@RequestParam(required = false) Long campanaId, @AuthenticationPrincipal Jwt jwt) {
        var labores = UsuarioAutenticado.esOperario(jwt)
                ? laborService.listarAsignadas(UsuarioAutenticado.id(jwt), campanaId)
                : laborService.listar(campanaId);
        return labores.stream().map(LaborResponse::desde).toList();
    }

    @GetMapping("/asignaciones")
    public List<AsignacionResponse> listarAsignaciones() {
        return laborService.listarAsignaciones().stream().map(AsignacionResponse::desde).toList();
    }

    @GetMapping("/{id}")
    public LaborResponse buscarPorId(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        verificarOperario(id, jwt);
        return LaborResponse.desde(laborService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<LaborResponse> planificar(@Valid @RequestBody PlanificarLaborRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(LaborResponse.desde(
                laborService.planificar(request.campanaId(), request.tipo(), request.fechaPlan())));
    }

    @PostMapping("/{id}/asignaciones")
    public ResponseEntity<AsignacionResponse> asignar(@PathVariable Long id,
                                                      @Valid @RequestBody AsignarOperarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AsignacionResponse.desde(laborService.asignar(id, request.usuarioId())));
    }

    @PutMapping("/{id}")
    public LaborResponse editar(@PathVariable Long id, @Valid @RequestBody EditarLaborRequest request) {
        return LaborResponse.desde(laborService.editar(id, request.tipo(), request.fechaPlan()));
    }

    @PostMapping("/{id}/cancelar")
    public LaborResponse cancelar(@PathVariable Long id, @Valid @RequestBody MotivoRequest request) {
        return LaborResponse.desde(laborService.cancelar(id, request.motivo()));
    }

    @PostMapping("/{id}/reabrir")
    public LaborResponse reabrir(@PathVariable Long id, @Valid @RequestBody MotivoRequest request) {
        return LaborResponse.desde(laborService.reabrir(id, request.motivo()));
    }

    @PostMapping("/{id}/iniciar")
    public LaborResponse iniciar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        verificarOperario(id, jwt);
        return LaborResponse.desde(laborService.iniciar(id));
    }

    @PostMapping("/{id}/ejecutar")
    public LaborResponse ejecutar(@PathVariable Long id, @Valid @RequestBody EjecutarLaborRequest request,
                                  @AuthenticationPrincipal Jwt jwt) {
        verificarOperario(id, jwt);
        return LaborResponse.desde(laborService.ejecutar(id, request.fechaEjecucion()));
    }

    // Insumos usados en la labor: cada consumo descuenta stock y deja un movimiento de SALIDA.
    @GetMapping("/{id}/consumos")
    public List<ConsumoResponse> listarConsumos(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        verificarOperario(id, jwt);
        return inventarioService.listarConsumos(id).stream().map(ConsumoResponse::desde).toList();
    }

    @PostMapping("/{id}/consumos")
    public ResponseEntity<ConsumoResponse> registrarConsumo(@PathVariable Long id,
                                                            @Valid @RequestBody RegistrarConsumoRequest request,
                                                            @AuthenticationPrincipal Jwt jwt) {
        verificarOperario(id, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(ConsumoResponse.desde(
                inventarioService.registrarConsumo(id, request.insumoId(), request.cantidad(), UsuarioAutenticado.id(jwt))));
    }

    @PostMapping("/{laborId}/consumos/{id}/anular")
    public ConsumoResponse anularConsumo(@PathVariable Long laborId, @PathVariable Long id,
                                         @Valid @RequestBody MotivoRequest request, @AuthenticationPrincipal Jwt jwt) {
        return ConsumoResponse.desde(inventarioService.anularConsumo(laborId, id, request.motivo(), UsuarioAutenticado.id(jwt)));
    }

    private void verificarOperario(Long laborId, Jwt jwt) {
        if (UsuarioAutenticado.esOperario(jwt)) {
            laborService.verificarAsignacion(laborId, UsuarioAutenticado.id(jwt));
        }
    }
}
