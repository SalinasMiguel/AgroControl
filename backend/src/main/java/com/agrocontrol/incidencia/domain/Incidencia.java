package com.agrocontrol.incidencia.domain;

import com.agrocontrol.shared.domain.Anulacion;

import java.time.LocalDateTime;

public class Incidencia {

    private Long id;
    private Long parcelaId;
    private Long campanaId;
    private Long laborId;
    private String descripcion;
    private Long usuarioId;
    private LocalDateTime fecha = LocalDateTime.now();
    private EstadoIncidencia estado = EstadoIncidencia.ABIERTA;
    private String resolucion;
    private LocalDateTime resueltaEn;
    private Anulacion anulacion;
    private TipoIncidencia tipo = TipoIncidencia.OTRO;
    private GravedadIncidencia gravedad = GravedadIncidencia.MEDIA;

    private Incidencia() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static Incidencia reconstruir(Long id, Long parcelaId, Long campanaId, Long laborId, String descripcion,
                                         Long usuarioId, LocalDateTime fecha, EstadoIncidencia estado,
                                         String resolucion, LocalDateTime resueltaEn, Anulacion anulacion,
                                         TipoIncidencia tipo, GravedadIncidencia gravedad) {
        Incidencia i = new Incidencia();
        i.id = id;
        i.parcelaId = parcelaId;
        i.campanaId = campanaId;
        i.laborId = laborId;
        i.descripcion = descripcion;
        i.usuarioId = usuarioId;
        i.fecha = fecha;
        i.estado = estado;
        i.resolucion = resolucion;
        i.resueltaEn = resueltaEn;
        i.anulacion = anulacion;
        i.tipo = tipo;
        i.gravedad = gravedad;
        return i;
    }

    public Incidencia(Long id, Long parcelaId, Long campanaId, Long laborId, String descripcion, Long usuarioId) {
        if (descripcion == null || descripcion.isBlank()) {
            throw new IllegalArgumentException("La descripción de la incidencia no puede estar vacía");
        }
        if (usuarioId == null) {
            throw new IllegalArgumentException("La incidencia debe registrarse con un usuario");
        }
        this.id = id;
        this.parcelaId = parcelaId;
        this.campanaId = campanaId;
        this.laborId = laborId;
        this.descripcion = descripcion;
        this.usuarioId = usuarioId;
    }

    // Sin clasificar queda como OTRO y MEDIA, igual que las incidencias anteriores
    public void clasificar(TipoIncidencia tipo, GravedadIncidencia gravedad) {
        this.tipo = tipo == null ? TipoIncidencia.OTRO : tipo;
        this.gravedad = gravedad == null ? GravedadIncidencia.MEDIA : gravedad;
    }

    // Alguien se hace cargo: ya no está sin atender
    public void atender() {
        if (estado != EstadoIncidencia.ABIERTA) {
            throw new IllegalStateException("Solo se atiende una incidencia ABIERTA (estado actual: " + estado + ")");
        }
        this.estado = EstadoIncidencia.EN_ATENCION;
    }

    // Se cierra con lo que se hizo para solucionarla; puede resolverse sin pasar por EN_ATENCION
    public void resolver(String resolucion) {
        if (!estaAbierta()) {
            throw new IllegalStateException("Solo se resuelve una incidencia abierta (estado actual: " + estado + ")");
        }
        if (resolucion == null || resolucion.isBlank()) {
            throw new IllegalArgumentException("Indique cómo se resolvió la incidencia");
        }
        this.estado = EstadoIncidencia.RESUELTA;
        this.resolucion = resolucion.trim();
        this.resueltaEn = LocalDateTime.now();
    }

    public void anular(String motivo, Long usuarioId) {
        if (!estaAbierta()) {
            throw new IllegalStateException("Solo se anula una incidencia abierta (estado actual: " + estado + ")");
        }
        this.anulacion = Anulacion.registrar(motivo, usuarioId);
        this.estado = EstadoIncidencia.ANULADA;
    }

    public boolean estaAbierta() {
        return estado == EstadoIncidencia.ABIERTA || estado == EstadoIncidencia.EN_ATENCION;
    }

    public Long getId() { return id; }
    public Long getParcelaId() { return parcelaId; }
    public Long getCampanaId() { return campanaId; }
    public Long getLaborId() { return laborId; }
    public String getDescripcion() { return descripcion; }
    public Long getUsuarioId() { return usuarioId; }
    public LocalDateTime getFecha() { return fecha; }
    public EstadoIncidencia getEstado() { return estado; }
    public String getResolucion() { return resolucion; }
    public LocalDateTime getResueltaEn() { return resueltaEn; }
    public Anulacion getAnulacion() { return anulacion; }
    public TipoIncidencia getTipo() { return tipo; }
    public GravedadIncidencia getGravedad() { return gravedad; }
}
