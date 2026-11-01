package com.agrocontrol.incidencia.infrastructure.adapter.in.web;

import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import com.agrocontrol.incidencia.application.FotoIncidenciaService;
import com.agrocontrol.incidencia.domain.FotoIncidencia;
import com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto.FotoIncidenciaResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/incidencias/{incidenciaId}/fotos")
public class FotoIncidenciaController {

    private final FotoIncidenciaService service;

    public FotoIncidenciaController(FotoIncidenciaService service) {
        this.service = service;
    }

    @GetMapping
    public List<FotoIncidenciaResponse> listar(@PathVariable Long incidenciaId) {
        return service.listar(incidenciaId).stream().map(FotoIncidenciaResponse::desde).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FotoIncidenciaResponse> agregar(@PathVariable Long incidenciaId,
                                                          @RequestParam("foto") MultipartFile foto,
                                                          @AuthenticationPrincipal Jwt jwt) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(FotoIncidenciaResponse.desde(
                service.agregar(incidenciaId, foto.getBytes(), UsuarioAutenticado.id(jwt))));
    }

    @GetMapping("/{fotoId}")
    public ResponseEntity<byte[]> ver(@PathVariable Long incidenciaId, @PathVariable Long fotoId) {
        FotoIncidencia foto = service.obtener(incidenciaId, fotoId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.tipoContenido()))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(foto.datos());
    }
}
