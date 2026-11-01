package com.agrocontrol.auth.infrastructure.adapter.in.web;

import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.command.CambiarPasswordCommand;
import com.agrocontrol.auth.infrastructure.adapter.in.web.dto.CambiarPasswordRequest;
import com.agrocontrol.auth.infrastructure.adapter.in.web.dto.LoginRequest;
import com.agrocontrol.auth.infrastructure.adapter.in.web.dto.SesionResponse;
import com.agrocontrol.auth.infrastructure.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public SesionResponse login(@Valid @RequestBody LoginRequest request) {
        return SesionResponse.desde(service.iniciarSesion(request.email(), request.password()));
    }

    // Datos frescos del usuario del token (el front lo llama al recargar la página)
    @GetMapping("/me")
    public SesionResponse yo(@AuthenticationPrincipal Jwt jwt) {
        return SesionResponse.desde(service.sesionActual(UsuarioAutenticado.id(jwt), jwt.getTokenValue()));
    }

    @PostMapping("/cambiar-password")
    public SesionResponse cambiarPassword(@AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody CambiarPasswordRequest request) {
        return SesionResponse.desde(service.cambiarPassword(UsuarioAutenticado.id(jwt),
                new CambiarPasswordCommand(request.passwordActual(), request.passwordNueva())));
    }
}
