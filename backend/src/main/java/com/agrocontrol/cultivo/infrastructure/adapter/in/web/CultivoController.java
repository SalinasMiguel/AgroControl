package com.agrocontrol.cultivo.infrastructure.adapter.in.web;

import com.agrocontrol.cultivo.application.CultivoService;
import com.agrocontrol.cultivo.infrastructure.adapter.in.web.dto.CrearCultivoRequest;
import com.agrocontrol.cultivo.infrastructure.adapter.in.web.dto.CultivoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cultivos")
public class CultivoController {

    private final CultivoService service;

    public CultivoController(CultivoService service) {
        this.service = service;
    }

    @GetMapping
    public List<CultivoResponse> listar() {
        return service.listar().stream().map(CultivoResponse::desde).toList();
    }

    @PostMapping
    public ResponseEntity<CultivoResponse> crear(@Valid @RequestBody CrearCultivoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CultivoResponse.desde(service.crear(request.nombre(), request.cicloDias(), request.humedadEstandarPct())));
    }

    @PutMapping("/{id}")
    public CultivoResponse actualizar(@PathVariable Long id, @Valid @RequestBody CrearCultivoRequest request) {
        return CultivoResponse.desde(service.actualizar(id, request.nombre(), request.cicloDias(), request.humedadEstandarPct()));
    }
}
