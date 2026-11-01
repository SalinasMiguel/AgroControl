package com.agrocontrol.usuario.domain;

import java.time.LocalDateTime;

public class Usuario {

    private final Long id;
    private String nombreCompleto;
    private String email;
    private String passwordHash;
    private Long rolId;
    private boolean activo;
    private final LocalDateTime creadoEn;
    private int tokenVersion;
    private boolean debeCambiarPassword;

    public Usuario(Long id, String nombreCompleto, String email, String passwordHash, Long rolId) {
        this(id, nombreCompleto, email, passwordHash, rolId, true, LocalDateTime.now());
    }

    public Usuario(Long id, String nombreCompleto, String email, String passwordHash, Long rolId,
                   boolean activo, LocalDateTime creadoEn) {
        this(id, nombreCompleto, email, passwordHash, rolId, activo, creadoEn, 0, false);
    }

    public Usuario(Long id, String nombreCompleto, String email, String passwordHash, Long rolId,
                   boolean activo, LocalDateTime creadoEn, int tokenVersion, boolean debeCambiarPassword) {
        validarDatos(nombreCompleto, email);
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria");
        }
        if (rolId == null) {
            throw new IllegalArgumentException("El usuario debe tener un rol asignado");
        }
        this.id = id;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.passwordHash = passwordHash;
        this.rolId = rolId;
        this.activo = activo;
        this.creadoEn = creadoEn;
        this.tokenVersion = tokenVersion;
        this.debeCambiarPassword = debeCambiarPassword;
    }

    private static void validarDatos(String nombreCompleto, String email) {
        if (nombreCompleto == null || nombreCompleto.isBlank()) {
            throw new IllegalArgumentException("El nombre completo es obligatorio");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("El email no es válido");
        }
    }

    // Cambiar el rol invalida los tokens: el rol viaja dentro del JWT.
    public void actualizarDatos(String nombreCompleto, String email, Long rolId) {
        validarDatos(nombreCompleto, email);
        if (rolId == null) {
            throw new IllegalArgumentException("El usuario debe tener un rol asignado");
        }
        if (!rolId.equals(this.rolId)) {
            tokenVersion++;
        }
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.rolId = rolId;
    }

    public void cambiarPassword(String nuevoHash) {
        this.passwordHash = nuevoHash;
        this.debeCambiarPassword = false;
        tokenVersion++;
    }

    public void restablecerPassword(String hashTemporal) {
        this.passwordHash = hashTemporal;
        this.debeCambiarPassword = true;
        tokenVersion++;
    }

    public void exigirCambioPassword() { this.debeCambiarPassword = true; }

    public void desactivar() { this.activo = false; }
    public void activar() { this.activo = true; }

    public Long getId() { return id; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Long getRolId() { return rolId; }
    public boolean isActivo() { return activo; }
    public EstadoUsuario getEstado() { return activo ? EstadoUsuario.ACTIVO : EstadoUsuario.INACTIVO; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public int getTokenVersion() { return tokenVersion; }
    public boolean isDebeCambiarPassword() { return debeCambiarPassword; }
}
