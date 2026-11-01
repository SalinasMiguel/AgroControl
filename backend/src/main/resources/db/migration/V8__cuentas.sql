-- V8__cuentas.sql — Sesiones revocables y contraseña pendiente de cambio.
-- token_version se compara con el claim "ver" del JWT: subirla invalida los tokens anteriores.

ALTER TABLE agrocontrol.usuario
    ADD COLUMN token_version integer NOT NULL DEFAULT 0,
    ADD COLUMN debe_cambiar_password boolean NOT NULL DEFAULT false;
