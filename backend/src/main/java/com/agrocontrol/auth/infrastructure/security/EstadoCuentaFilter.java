package com.agrocontrol.auth.infrastructure.security;

import com.agrocontrol.auth.application.AuthService;
import com.agrocontrol.auth.application.EstadoCuenta;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

// El JWT no se puede revocar: en cada petición con token se compara contra la cuenta real, para que
// desactivar a alguien o cambiarle el rol o la clave surta efecto de inmediato.
// Se crea con new en SecurityConfig: como bean, Spring Boot también lo registraría fuera de la cadena.
public class EstadoCuentaFilter extends OncePerRequestFilter {

    public interface EscritorProblema {
        void escribir(HttpServletResponse respuesta, HttpStatus estado, String detalle) throws IOException;
    }

    private final AuthService authService;
    private final EscritorProblema escritor;

    public EstadoCuentaFilter(AuthService authService, EscritorProblema escritor) {
        this.authService = authService;
        this.escritor = escritor;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            chain.doFilter(request, response);
            return;
        }
        Optional<EstadoCuenta> cuenta = authService.estadoCuenta(UsuarioAutenticado.id(jwt));
        if (cuenta.isEmpty() || !cuenta.get().activo() || cuenta.get().tokenVersion() != UsuarioAutenticado.version(jwt)) {
            escritor.escribir(response, HttpStatus.UNAUTHORIZED, "Su sesión ya no es válida, inicie sesión de nuevo");
            return;
        }
        if (cuenta.get().debeCambiarPassword() && !permitidaConClavePendiente(request)) {
            escritor.escribir(response, HttpStatus.FORBIDDEN, "Debe cambiar su contraseña antes de continuar");
            return;
        }
        chain.doFilter(request, response);
    }

    private static boolean permitidaConClavePendiente(HttpServletRequest request) {
        String ruta = request.getRequestURI();
        return (HttpMethod.POST.matches(request.getMethod()) && ruta.equals("/api/auth/cambiar-password"))
                || (HttpMethod.GET.matches(request.getMethod()) && ruta.equals("/api/auth/me"));
    }
}
