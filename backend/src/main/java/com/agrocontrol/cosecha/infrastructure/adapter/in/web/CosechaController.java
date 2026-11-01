package com.agrocontrol.cosecha.infrastructure.adapter.in.web;

import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import com.agrocontrol.cosecha.application.CosechaService;
import com.agrocontrol.cosecha.infrastructure.adapter.in.web.dto.CorregirCosechaRequest;
import com.agrocontrol.cosecha.infrastructure.adapter.in.web.dto.CosechaResponse;
import com.agrocontrol.cosecha.infrastructure.adapter.in.web.dto.RegistrarCosechaRequest;
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
@RequestMapping("/api/cosechas")
public class CosechaController {

    private final CosechaService service;

    public CosechaController(CosechaService service) {
        this.service = service;
    }

    @GetMapping
    public List<CosechaResponse> listar(@RequestParam(required = false) Long campanaId) {
        return service.listar(campanaId).stream().map(CosechaResponse::desde).toList();
    }

    @PostMapping
    public ResponseEntity<CosechaResponse> registrar(@Valid @RequestBody RegistrarCosechaRequest request,
                                                     @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED).body(CosechaResponse.desde(service.registrar(
                request.campanaId(), request.cantidad(), request.unidadMedida(), request.fecha(),
                request.calidad(), UsuarioAutenticado.id(jwt))));
    }

    @PostMapping("/{id}/corregir")
    public ResponseEntity<CosechaResponse> corregir(@PathVariable Long id, @Valid @RequestBody CorregirCosechaRequest request,
                                                    @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED).body(CosechaResponse.desde(service.corregir(
                id, request.motivo(), request.cantidad(), request.unidadMedida(), request.fecha(),
                request.calidad(), UsuarioAutenticado.id(jwt))));
    }

    @PostMapping("/{id}/anular")
    public CosechaResponse anular(@PathVariable Long id, @Valid @RequestBody MotivoRequest request,
                                  @AuthenticationPrincipal Jwt jwt) {
        return CosechaResponse.desde(service.anular(id, request.motivo(), UsuarioAutenticado.id(jwt)));
    }
}
