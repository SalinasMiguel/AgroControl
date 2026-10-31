-- Esquema COMPLETO que usa la aplicación (resultado de aplicar las migraciones Flyway V1 a V10).
-- Generado con: pg_dump --schema-only --no-owner --no-privileges -n agrocontrol
-- Solo referencia: el backend no lo ejecuta. Si cambia una migración, regenerarlo.

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: agrocontrol; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA agrocontrol;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asignacion_labor; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.asignacion_labor (
    id_asignacion integer NOT NULL,
    id_labor integer NOT NULL,
    id_usuario integer NOT NULL,
    asignado_en timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: asignacion_labor_id_asignacion_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.asignacion_labor_id_asignacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asignacion_labor_id_asignacion_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.asignacion_labor_id_asignacion_seq OWNED BY agrocontrol.asignacion_labor.id_asignacion;


--
-- Name: auditoria; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.auditoria (
    id_auditoria integer NOT NULL,
    id_usuario integer,
    entidad character varying(60) NOT NULL,
    id_entidad integer NOT NULL,
    accion character varying(30) NOT NULL,
    detalle text,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: auditoria_id_auditoria_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.auditoria_id_auditoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_id_auditoria_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.auditoria_id_auditoria_seq OWNED BY agrocontrol.auditoria.id_auditoria;


--
-- Name: bitacora_campo; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.bitacora_campo (
    id_bitacora integer NOT NULL,
    id_labor integer NOT NULL,
    id_usuario integer NOT NULL,
    observacion text NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bitacora_campo_id_bitacora_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.bitacora_campo_id_bitacora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bitacora_campo_id_bitacora_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.bitacora_campo_id_bitacora_seq OWNED BY agrocontrol.bitacora_campo.id_bitacora;


--
-- Name: campana; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.campana (
    id_campana integer NOT NULL,
    id_parcela integer NOT NULL,
    id_cultivo integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    estado character varying(20) DEFAULT 'PLANIFICADA'::character varying NOT NULL,
    motivo_cierre character varying(200),
    CONSTRAINT campana_check CHECK (((fecha_fin IS NULL) OR (fecha_fin >= fecha_inicio))),
    CONSTRAINT campana_estado_check CHECK (((estado)::text = ANY ((ARRAY['PLANIFICADA'::character varying, 'EN_CURSO'::character varying, 'FINALIZADA'::character varying, 'CANCELADA'::character varying, 'PERDIDA'::character varying])::text[])))
);


--
-- Name: campana_id_campana_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.campana_id_campana_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campana_id_campana_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.campana_id_campana_seq OWNED BY agrocontrol.campana.id_campana;


--
-- Name: consumo_labor; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.consumo_labor (
    id_consumo integer NOT NULL,
    id_labor integer NOT NULL,
    id_insumo integer NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    anulado boolean DEFAULT false NOT NULL,
    motivo_anulacion character varying(200),
    anulado_por integer,
    anulado_en timestamp without time zone,
    CONSTRAINT consumo_labor_anulado_check CHECK (((NOT anulado) OR ((motivo_anulacion IS NOT NULL) AND (anulado_por IS NOT NULL) AND (anulado_en IS NOT NULL)))),
    CONSTRAINT consumo_labor_cantidad_check CHECK ((cantidad > (0)::numeric))
);


--
-- Name: consumo_labor_id_consumo_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.consumo_labor_id_consumo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consumo_labor_id_consumo_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.consumo_labor_id_consumo_seq OWNED BY agrocontrol.consumo_labor.id_consumo;


--
-- Name: cosecha; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.cosecha (
    id_cosecha integer NOT NULL,
    id_campana integer NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    unidad_medida character varying(20) NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    id_usuario integer NOT NULL,
    anulado boolean DEFAULT false NOT NULL,
    motivo_anulacion character varying(200),
    anulado_por integer,
    anulado_en timestamp without time zone,
    CONSTRAINT cosecha_anulado_check CHECK (((NOT anulado) OR ((motivo_anulacion IS NOT NULL) AND (anulado_por IS NOT NULL) AND (anulado_en IS NOT NULL)))),
    CONSTRAINT cosecha_cantidad_check CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT cosecha_unidad_check CHECK (((unidad_medida)::text = ANY ((ARRAY['t'::character varying, 'kg'::character varying, 'qq'::character varying])::text[])))
);


--
-- Name: cosecha_id_cosecha_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.cosecha_id_cosecha_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cosecha_id_cosecha_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.cosecha_id_cosecha_seq OWNED BY agrocontrol.cosecha.id_cosecha;


--
-- Name: cultivo; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.cultivo (
    id_cultivo integer NOT NULL,
    nombre character varying(80) NOT NULL,
    ciclo_dias integer,
    CONSTRAINT cultivo_ciclo_dias_check CHECK ((ciclo_dias > 0))
);


--
-- Name: cultivo_id_cultivo_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.cultivo_id_cultivo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cultivo_id_cultivo_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.cultivo_id_cultivo_seq OWNED BY agrocontrol.cultivo.id_cultivo;


--
-- Name: incidencia; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.incidencia (
    id_incidencia integer NOT NULL,
    id_parcela integer,
    id_campana integer,
    id_labor integer,
    descripcion text NOT NULL,
    id_usuario integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    estado character varying(20) DEFAULT 'ABIERTA'::character varying NOT NULL,
    resolucion text,
    resuelta_en timestamp without time zone,
    motivo_anulacion character varying(200),
    anulado_por integer,
    anulado_en timestamp without time zone,
    CONSTRAINT incidencia_anulada_check CHECK ((((estado)::text <> 'ANULADA'::text) OR ((motivo_anulacion IS NOT NULL) AND (anulado_por IS NOT NULL) AND (anulado_en IS NOT NULL)))),
    CONSTRAINT incidencia_estado_check CHECK (((estado)::text = ANY ((ARRAY['ABIERTA'::character varying, 'EN_ATENCION'::character varying, 'RESUELTA'::character varying, 'ANULADA'::character varying])::text[]))),
    CONSTRAINT incidencia_resuelta_check CHECK ((((estado)::text <> 'RESUELTA'::text) OR ((resolucion IS NOT NULL) AND (resuelta_en IS NOT NULL))))
);


--
-- Name: incidencia_id_incidencia_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.incidencia_id_incidencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incidencia_id_incidencia_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.incidencia_id_incidencia_seq OWNED BY agrocontrol.incidencia.id_incidencia;


--
-- Name: insumo; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.insumo (
    id_insumo integer NOT NULL,
    nombre character varying(100) NOT NULL,
    unidad_medida character varying(20) NOT NULL,
    stock_actual numeric(12,2) DEFAULT 0 NOT NULL,
    categoria character varying(20) DEFAULT 'OTRO'::character varying NOT NULL,
    stock_minimo numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT insumo_categoria_check CHECK (((categoria)::text = ANY ((ARRAY['SEMILLA'::character varying, 'FERTILIZANTE'::character varying, 'AGROQUIMICO'::character varying, 'COMBUSTIBLE'::character varying, 'LUBRICANTE'::character varying, 'REPUESTO'::character varying, 'OTRO'::character varying])::text[]))),
    CONSTRAINT insumo_stock_actual_check CHECK ((stock_actual >= (0)::numeric)),
    CONSTRAINT insumo_stock_minimo_check CHECK ((stock_minimo >= (0)::numeric))
);


--
-- Name: insumo_id_insumo_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.insumo_id_insumo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insumo_id_insumo_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.insumo_id_insumo_seq OWNED BY agrocontrol.insumo.id_insumo;


--
-- Name: labor; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.labor (
    id_labor integer NOT NULL,
    id_campana integer NOT NULL,
    id_parcela integer NOT NULL,
    tipo character varying(60) NOT NULL,
    fecha_plan date NOT NULL,
    fecha_ejecucion date,
    estado character varying(20) DEFAULT 'PLANIFICADA'::character varying NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    motivo_cancelacion character varying(200),
    CONSTRAINT labor_estado_check CHECK (((estado)::text = ANY ((ARRAY['PLANIFICADA'::character varying, 'ASIGNADA'::character varying, 'EN_CURSO'::character varying, 'EJECUTADA'::character varying, 'CANCELADA'::character varying])::text[])))
);


--
-- Name: labor_id_labor_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.labor_id_labor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: labor_id_labor_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.labor_id_labor_seq OWNED BY agrocontrol.labor.id_labor;


--
-- Name: movimiento_insumo; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.movimiento_insumo (
    id_movimiento integer NOT NULL,
    id_insumo integer NOT NULL,
    tipo character varying(10) NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    motivo character varying(150),
    id_usuario integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    anulado boolean DEFAULT false NOT NULL,
    motivo_anulacion character varying(200),
    anulado_por integer,
    anulado_en timestamp without time zone,
    origen character varying(10) DEFAULT 'MANUAL'::character varying NOT NULL,
    id_consumo integer,
    id_movimiento_anulado integer,
    CONSTRAINT movimiento_insumo_anulado_check CHECK (((NOT anulado) OR ((motivo_anulacion IS NOT NULL) AND (anulado_por IS NOT NULL) AND (anulado_en IS NOT NULL)))),
    CONSTRAINT movimiento_insumo_cantidad_check CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT movimiento_insumo_origen_check CHECK (((origen)::text = ANY ((ARRAY['MANUAL'::character varying, 'CONSUMO'::character varying, 'ANULACION'::character varying, 'AJUSTE'::character varying])::text[]))),
    CONSTRAINT movimiento_insumo_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('ENTRADA'::character varying)::text, ('SALIDA'::character varying)::text])))
);


--
-- Name: movimiento_insumo_id_movimiento_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.movimiento_insumo_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_insumo_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.movimiento_insumo_id_movimiento_seq OWNED BY agrocontrol.movimiento_insumo.id_movimiento;


--
-- Name: parcela; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.parcela (
    id_parcela integer NOT NULL,
    id_predio integer NOT NULL,
    codigo character varying(30) NOT NULL,
    area_ha numeric(10,2),
    estado character varying(20) DEFAULT 'DISPONIBLE'::character varying NOT NULL,
    CONSTRAINT parcela_area_ha_check CHECK ((area_ha > (0)::numeric)),
    CONSTRAINT parcela_estado_check CHECK (((estado)::text = ANY ((ARRAY['DISPONIBLE'::character varying, 'EN_PRODUCCION'::character varying, 'EN_DESCANSO'::character varying])::text[])))
);


--
-- Name: parcela_id_parcela_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.parcela_id_parcela_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parcela_id_parcela_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.parcela_id_parcela_seq OWNED BY agrocontrol.parcela.id_parcela;


--
-- Name: predio; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.predio (
    id_predio integer NOT NULL,
    nombre character varying(100) NOT NULL,
    ubicacion character varying(200),
    area_ha numeric(10,2),
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT predio_area_ha_check CHECK ((area_ha > (0)::numeric))
);


--
-- Name: predio_id_predio_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.predio_id_predio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: predio_id_predio_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.predio_id_predio_seq OWNED BY agrocontrol.predio.id_predio;


--
-- Name: rol; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.rol (
    id_rol integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion character varying(200)
);


--
-- Name: rol_id_rol_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.rol_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rol_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.rol_id_rol_seq OWNED BY agrocontrol.rol.id_rol;


--
-- Name: usuario; Type: TABLE; Schema: agrocontrol; Owner: -
--

CREATE TABLE agrocontrol.usuario (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    id_rol integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    token_version integer DEFAULT 0 NOT NULL,
    debe_cambiar_password boolean DEFAULT false NOT NULL
);


--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: agrocontrol; Owner: -
--

CREATE SEQUENCE agrocontrol.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: agrocontrol; Owner: -
--

ALTER SEQUENCE agrocontrol.usuario_id_usuario_seq OWNED BY agrocontrol.usuario.id_usuario;


--
-- Name: asignacion_labor id_asignacion; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.asignacion_labor ALTER COLUMN id_asignacion SET DEFAULT nextval('agrocontrol.asignacion_labor_id_asignacion_seq'::regclass);


--
-- Name: auditoria id_auditoria; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.auditoria ALTER COLUMN id_auditoria SET DEFAULT nextval('agrocontrol.auditoria_id_auditoria_seq'::regclass);


--
-- Name: bitacora_campo id_bitacora; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.bitacora_campo ALTER COLUMN id_bitacora SET DEFAULT nextval('agrocontrol.bitacora_campo_id_bitacora_seq'::regclass);


--
-- Name: campana id_campana; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.campana ALTER COLUMN id_campana SET DEFAULT nextval('agrocontrol.campana_id_campana_seq'::regclass);


--
-- Name: consumo_labor id_consumo; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.consumo_labor ALTER COLUMN id_consumo SET DEFAULT nextval('agrocontrol.consumo_labor_id_consumo_seq'::regclass);


--
-- Name: cosecha id_cosecha; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cosecha ALTER COLUMN id_cosecha SET DEFAULT nextval('agrocontrol.cosecha_id_cosecha_seq'::regclass);


--
-- Name: cultivo id_cultivo; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cultivo ALTER COLUMN id_cultivo SET DEFAULT nextval('agrocontrol.cultivo_id_cultivo_seq'::regclass);


--
-- Name: incidencia id_incidencia; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia ALTER COLUMN id_incidencia SET DEFAULT nextval('agrocontrol.incidencia_id_incidencia_seq'::regclass);


--
-- Name: insumo id_insumo; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.insumo ALTER COLUMN id_insumo SET DEFAULT nextval('agrocontrol.insumo_id_insumo_seq'::regclass);


--
-- Name: labor id_labor; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.labor ALTER COLUMN id_labor SET DEFAULT nextval('agrocontrol.labor_id_labor_seq'::regclass);


--
-- Name: movimiento_insumo id_movimiento; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo ALTER COLUMN id_movimiento SET DEFAULT nextval('agrocontrol.movimiento_insumo_id_movimiento_seq'::regclass);


--
-- Name: parcela id_parcela; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.parcela ALTER COLUMN id_parcela SET DEFAULT nextval('agrocontrol.parcela_id_parcela_seq'::regclass);


--
-- Name: predio id_predio; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.predio ALTER COLUMN id_predio SET DEFAULT nextval('agrocontrol.predio_id_predio_seq'::regclass);


--
-- Name: rol id_rol; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.rol ALTER COLUMN id_rol SET DEFAULT nextval('agrocontrol.rol_id_rol_seq'::regclass);


--
-- Name: usuario id_usuario; Type: DEFAULT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('agrocontrol.usuario_id_usuario_seq'::regclass);


--
-- Name: asignacion_labor asignacion_labor_id_labor_id_usuario_key; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.asignacion_labor
    ADD CONSTRAINT asignacion_labor_id_labor_id_usuario_key UNIQUE (id_labor, id_usuario);


--
-- Name: asignacion_labor asignacion_labor_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.asignacion_labor
    ADD CONSTRAINT asignacion_labor_pkey PRIMARY KEY (id_asignacion);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id_auditoria);


--
-- Name: bitacora_campo bitacora_campo_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.bitacora_campo
    ADD CONSTRAINT bitacora_campo_pkey PRIMARY KEY (id_bitacora);


--
-- Name: campana campana_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.campana
    ADD CONSTRAINT campana_pkey PRIMARY KEY (id_campana);


--
-- Name: consumo_labor consumo_labor_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.consumo_labor
    ADD CONSTRAINT consumo_labor_pkey PRIMARY KEY (id_consumo);


--
-- Name: cosecha cosecha_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cosecha
    ADD CONSTRAINT cosecha_pkey PRIMARY KEY (id_cosecha);


--
-- Name: cultivo cultivo_nombre_key; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cultivo
    ADD CONSTRAINT cultivo_nombre_key UNIQUE (nombre);


--
-- Name: cultivo cultivo_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cultivo
    ADD CONSTRAINT cultivo_pkey PRIMARY KEY (id_cultivo);


--
-- Name: incidencia incidencia_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia
    ADD CONSTRAINT incidencia_pkey PRIMARY KEY (id_incidencia);


--
-- Name: insumo insumo_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.insumo
    ADD CONSTRAINT insumo_pkey PRIMARY KEY (id_insumo);


--
-- Name: labor labor_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.labor
    ADD CONSTRAINT labor_pkey PRIMARY KEY (id_labor);


--
-- Name: movimiento_insumo movimiento_insumo_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo
    ADD CONSTRAINT movimiento_insumo_pkey PRIMARY KEY (id_movimiento);


--
-- Name: parcela parcela_id_predio_codigo_key; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.parcela
    ADD CONSTRAINT parcela_id_predio_codigo_key UNIQUE (id_predio, codigo);


--
-- Name: parcela parcela_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.parcela
    ADD CONSTRAINT parcela_pkey PRIMARY KEY (id_parcela);


--
-- Name: predio predio_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.predio
    ADD CONSTRAINT predio_pkey PRIMARY KEY (id_predio);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id_rol);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- Name: idx_auditoria_entidad; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_auditoria_entidad ON agrocontrol.auditoria USING btree (entidad, id_entidad);


--
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_auditoria_fecha ON agrocontrol.auditoria USING btree (fecha DESC);


--
-- Name: idx_bitacora_labor; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_bitacora_labor ON agrocontrol.bitacora_campo USING btree (id_labor);


--
-- Name: idx_incidencia_estado; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_incidencia_estado ON agrocontrol.incidencia USING btree (estado);


--
-- Name: idx_incidencia_parcela; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_incidencia_parcela ON agrocontrol.incidencia USING btree (id_parcela);


--
-- Name: idx_insumo_categoria; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_insumo_categoria ON agrocontrol.insumo USING btree (categoria);


--
-- Name: idx_labor_campana; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_labor_campana ON agrocontrol.labor USING btree (id_campana);


--
-- Name: idx_labor_estado; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_labor_estado ON agrocontrol.labor USING btree (estado);


--
-- Name: idx_labor_parcela; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_labor_parcela ON agrocontrol.labor USING btree (id_parcela);


--
-- Name: idx_movimiento_insumo; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_movimiento_insumo ON agrocontrol.movimiento_insumo USING btree (id_insumo);


--
-- Name: idx_movimiento_tipo_fecha; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE INDEX idx_movimiento_tipo_fecha ON agrocontrol.movimiento_insumo USING btree (tipo, fecha);


--
-- Name: uq_movimiento_anulado; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE UNIQUE INDEX uq_movimiento_anulado ON agrocontrol.movimiento_insumo USING btree (id_movimiento_anulado) WHERE (id_movimiento_anulado IS NOT NULL);


--
-- Name: uq_movimiento_consumo; Type: INDEX; Schema: agrocontrol; Owner: -
--

CREATE UNIQUE INDEX uq_movimiento_consumo ON agrocontrol.movimiento_insumo USING btree (id_consumo) WHERE ((origen)::text = 'CONSUMO'::text);


--
-- Name: asignacion_labor asignacion_labor_id_labor_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.asignacion_labor
    ADD CONSTRAINT asignacion_labor_id_labor_fkey FOREIGN KEY (id_labor) REFERENCES agrocontrol.labor(id_labor);


--
-- Name: asignacion_labor asignacion_labor_id_usuario_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.asignacion_labor
    ADD CONSTRAINT asignacion_labor_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: auditoria auditoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.auditoria
    ADD CONSTRAINT auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: bitacora_campo bitacora_campo_id_labor_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.bitacora_campo
    ADD CONSTRAINT bitacora_campo_id_labor_fkey FOREIGN KEY (id_labor) REFERENCES agrocontrol.labor(id_labor);


--
-- Name: bitacora_campo bitacora_campo_id_usuario_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.bitacora_campo
    ADD CONSTRAINT bitacora_campo_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: campana campana_id_cultivo_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.campana
    ADD CONSTRAINT campana_id_cultivo_fkey FOREIGN KEY (id_cultivo) REFERENCES agrocontrol.cultivo(id_cultivo);


--
-- Name: campana campana_id_parcela_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.campana
    ADD CONSTRAINT campana_id_parcela_fkey FOREIGN KEY (id_parcela) REFERENCES agrocontrol.parcela(id_parcela);


--
-- Name: consumo_labor consumo_labor_anulado_por_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.consumo_labor
    ADD CONSTRAINT consumo_labor_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: consumo_labor consumo_labor_id_insumo_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.consumo_labor
    ADD CONSTRAINT consumo_labor_id_insumo_fkey FOREIGN KEY (id_insumo) REFERENCES agrocontrol.insumo(id_insumo);


--
-- Name: consumo_labor consumo_labor_id_labor_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.consumo_labor
    ADD CONSTRAINT consumo_labor_id_labor_fkey FOREIGN KEY (id_labor) REFERENCES agrocontrol.labor(id_labor);


--
-- Name: cosecha cosecha_anulado_por_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cosecha
    ADD CONSTRAINT cosecha_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: cosecha cosecha_id_campana_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cosecha
    ADD CONSTRAINT cosecha_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES agrocontrol.campana(id_campana);


--
-- Name: cosecha cosecha_id_usuario_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.cosecha
    ADD CONSTRAINT cosecha_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: incidencia incidencia_anulado_por_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia
    ADD CONSTRAINT incidencia_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: incidencia incidencia_id_campana_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia
    ADD CONSTRAINT incidencia_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES agrocontrol.campana(id_campana);


--
-- Name: incidencia incidencia_id_labor_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia
    ADD CONSTRAINT incidencia_id_labor_fkey FOREIGN KEY (id_labor) REFERENCES agrocontrol.labor(id_labor);


--
-- Name: incidencia incidencia_id_parcela_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia
    ADD CONSTRAINT incidencia_id_parcela_fkey FOREIGN KEY (id_parcela) REFERENCES agrocontrol.parcela(id_parcela);


--
-- Name: incidencia incidencia_id_usuario_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.incidencia
    ADD CONSTRAINT incidencia_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: labor labor_id_campana_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.labor
    ADD CONSTRAINT labor_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES agrocontrol.campana(id_campana);


--
-- Name: labor labor_id_parcela_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.labor
    ADD CONSTRAINT labor_id_parcela_fkey FOREIGN KEY (id_parcela) REFERENCES agrocontrol.parcela(id_parcela);


--
-- Name: movimiento_insumo movimiento_insumo_anulado_por_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo
    ADD CONSTRAINT movimiento_insumo_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: movimiento_insumo movimiento_insumo_id_consumo_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo
    ADD CONSTRAINT movimiento_insumo_id_consumo_fkey FOREIGN KEY (id_consumo) REFERENCES agrocontrol.consumo_labor(id_consumo);


--
-- Name: movimiento_insumo movimiento_insumo_id_insumo_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo
    ADD CONSTRAINT movimiento_insumo_id_insumo_fkey FOREIGN KEY (id_insumo) REFERENCES agrocontrol.insumo(id_insumo);


--
-- Name: movimiento_insumo movimiento_insumo_id_movimiento_anulado_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo
    ADD CONSTRAINT movimiento_insumo_id_movimiento_anulado_fkey FOREIGN KEY (id_movimiento_anulado) REFERENCES agrocontrol.movimiento_insumo(id_movimiento);


--
-- Name: movimiento_insumo movimiento_insumo_id_usuario_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.movimiento_insumo
    ADD CONSTRAINT movimiento_insumo_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES agrocontrol.usuario(id_usuario);


--
-- Name: parcela parcela_id_predio_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.parcela
    ADD CONSTRAINT parcela_id_predio_fkey FOREIGN KEY (id_predio) REFERENCES agrocontrol.predio(id_predio);


--
-- Name: usuario usuario_id_rol_fkey; Type: FK CONSTRAINT; Schema: agrocontrol; Owner: -
--

ALTER TABLE ONLY agrocontrol.usuario
    ADD CONSTRAINT usuario_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES agrocontrol.rol(id_rol);


--
-- PostgreSQL database dump complete
--


