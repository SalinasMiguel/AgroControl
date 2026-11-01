package com.agrocontrol.usuario.infrastructure.adapter.out.persistence;

import com.agrocontrol.rol.infrastructure.adapter.out.persistence.RolJpaEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario", schema = "agrocontrol")
public class UsuarioJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombreCompleto;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_rol", nullable = false)
    private RolJpaEntity rol;

    @Column(name = "activo", nullable = false)
    private boolean activo;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "token_version", nullable = false)
    private int tokenVersion;

    @Column(name = "debe_cambiar_password", nullable = false)
    private boolean debeCambiarPassword;

    protected UsuarioJpaEntity() {
    }

    public UsuarioJpaEntity(Long id, String nombreCompleto, String email, String passwordHash,
                            RolJpaEntity rol, boolean activo, LocalDateTime creadoEn,
                            int tokenVersion, boolean debeCambiarPassword) {
        this.id = id;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.activo = activo;
        this.creadoEn = creadoEn;
        this.tokenVersion = tokenVersion;
        this.debeCambiarPassword = debeCambiarPassword;
    }

    public Long getId() { return id; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public RolJpaEntity getRol() { return rol; }
    public boolean isActivo() { return activo; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public int getTokenVersion() { return tokenVersion; }
    public boolean isDebeCambiarPassword() { return debeCambiarPassword; }
}
