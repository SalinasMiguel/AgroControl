package com.agrocontrol.insumo.infrastructure.adapter.in.web;

import com.agrocontrol.insumo.application.EquivalenciaService;
import com.agrocontrol.insumo.infrastructure.adapter.in.web.dto.InsumoResponse;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/insumos/{id}/equivalencias")
public class EquivalenciaController {

    public record VincularRequest(@NotNull(message = "Debe indicar el insumo equivalente.") Long equivalenteId) {
    }

    private final EquivalenciaService service;

    public EquivalenciaController(EquivalenciaService service) {
        this.service = service;
    }

    @GetMapping
    public List<InsumoResponse> listar(@PathVariable Long id) {
        return service.listar(id).stream().map(InsumoResponse::desde).toList();
    }

    @PostMapping
    public ResponseEntity<Void> vincular(@PathVariable Long id, @Valid @RequestBody VincularRequest request) {
        service.vincular(id, request.equivalenteId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{equivalenteId}")
    public ResponseEntity<Void> desvincular(@PathVariable Long id, @PathVariable Long equivalenteId) {
        service.desvincular(id, equivalenteId);
        return ResponseEntity.noContent().build();
    }
}
