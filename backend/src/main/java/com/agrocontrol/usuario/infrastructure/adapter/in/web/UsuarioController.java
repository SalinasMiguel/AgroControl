package com.agrocontrol.usuario.infrastructure.adapter.in.web;

import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import com.agrocontrol.usuario.application.UsuarioService;
import com.agrocontrol.usuario.application.command.ActualizarUsuarioCommand;
import com.agrocontrol.usuario.application.command.RegistrarUsuarioCommand;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.infrastructure.adapter.in.web.dto.ActualizarUsuarioRequest;
import com.agrocontrol.usuario.infrastructure.adapter.in.web.dto.ClaveTemporalResponse;
import com.agrocontrol.usuario.infrastructure.adapter.in.web.dto.CrearUsuarioRequest;
import com.agrocontrol.usuario.infrastructure.adapter.in.web.dto.UsuarioResponse;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody CrearUsuarioRequest request) {
        RegistrarUsuarioCommand command = new RegistrarUsuarioCommand(
                request.rolId(), request.nombreCompleto(), request.email(), request.password());
        Usuario creado = service.registrar(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.desde(creado));
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return service.listar().stream().map(UsuarioResponse::desde).toList();
    }

    @GetMapping("/{id}")
    public UsuarioResponse buscarPorId(@PathVariable Long id) {
        return UsuarioResponse.desde(service.obtener(id));
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody ActualizarUsuarioRequest request) {
        return UsuarioResponse.desde(service.actualizar(id,
                new ActualizarUsuarioCommand(request.rolId(), request.nombreCompleto(), request.email())));
    }

    @PostMapping("/{id}/desactivar")
    public UsuarioResponse desactivar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return UsuarioResponse.desde(service.desactivar(id, UsuarioAutenticado.id(jwt)));
    }

    @PostMapping("/{id}/activar")
    public UsuarioResponse activar(@PathVariable Long id) {
        return UsuarioResponse.desde(service.activar(id));
    }

    @PostMapping("/{id}/restablecer-password")
    public ResponseEntity<ClaveTemporalResponse> restablecerPassword(@PathVariable Long id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new ClaveTemporalResponse(service.restablecerPassword(id).password()));
    }
}
