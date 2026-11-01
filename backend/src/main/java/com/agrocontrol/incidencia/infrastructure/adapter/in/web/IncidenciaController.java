package com.agrocontrol.incidencia.infrastructure.adapter.in.web;

import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import com.agrocontrol.incidencia.application.IncidenciaService;
import com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto.IncidenciaResponse;
import com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto.RegistrarIncidenciaRequest;
import com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto.ResolverIncidenciaRequest;
import com.agrocontrol.shared.web.MotivoRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/incidencias")
public class IncidenciaController {

    private final IncidenciaService service;

    public IncidenciaController(IncidenciaService service) {
        this.service = service;
    }

    @GetMapping
    public List<IncidenciaResponse> listar(@RequestParam(required = false) Long parcelaId) {
        return service.listar(parcelaId).stream().map(IncidenciaResponse::desde).toList();
    }

    @PostMapping
    public ResponseEntity<IncidenciaResponse> registrar(@Valid @RequestBody RegistrarIncidenciaRequest request,
                                                        @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED).body(IncidenciaResponse.desde(service.registrar(
                request.parcelaId(), request.campanaId(), request.laborId(), request.descripcion(),
                request.tipo(), request.gravedad(), UsuarioAutenticado.id(jwt))));
    }

    @PostMapping("/{id}/atender")
    public IncidenciaResponse atender(@PathVariable Long id) {
        return IncidenciaResponse.desde(service.atender(id));
    }

    @PostMapping("/{id}/resolver")
    public IncidenciaResponse resolver(@PathVariable Long id, @Valid @RequestBody ResolverIncidenciaRequest request) {
        return IncidenciaResponse.desde(service.resolver(id, request.resolucion()));
    }

    @PostMapping("/{id}/anular")
    public IncidenciaResponse anular(@PathVariable Long id, @Valid @RequestBody MotivoRequest request,
                                     @AuthenticationPrincipal Jwt jwt) {
        return IncidenciaResponse.desde(service.anular(id, request.motivo(), UsuarioAutenticado.id(jwt)));
    }
}
