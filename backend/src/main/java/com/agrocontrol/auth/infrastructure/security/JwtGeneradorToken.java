package com.agrocontrol.auth.infrastructure.security;

import com.agrocontrol.auth.domain.GeneradorToken;
import com.agrocontrol.usuario.domain.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class JwtGeneradorToken implements GeneradorToken {

    private final JwtEncoder encoder;
    private final Duration duracion;

    public JwtGeneradorToken(JwtEncoder encoder, @Value("${agrocontrol.jwt.horas}") long horas) {
        this.encoder = encoder;
        this.duracion = Duration.ofHours(horas);
    }

    @Override
    public String generar(Usuario usuario, String rol) {
        Instant ahora = Instant.now();
        // sub = id del usuario: los controladores lo usan como "quién registra" en vez de confiar en el body
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("agrocontrol")
                .subject(String.valueOf(usuario.getId()))
                .issuedAt(ahora)
                .expiresAt(ahora.plus(duracion))
                .claim("nombre", usuario.getNombreCompleto())
                .claim("rol", rol)
                .claim("ver", usuario.getTokenVersion())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
