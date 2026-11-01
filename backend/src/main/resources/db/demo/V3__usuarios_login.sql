-- V3__usuarios_login.sql — Contraseñas reales (BCrypt) para los usuarios semilla y un usuario por rol.
-- Contraseña de demo para todos: agro123
UPDATE agrocontrol.usuario
SET password_hash = '$2a$10$P3ijac.D07dJ4XCYFSxHD.59BYTxM1ILLxiS06BRPFzhJOqScD7/i'
WHERE password_hash LIKE 'hash-demo-%';

INSERT INTO agrocontrol.usuario (nombre, email, password_hash, id_rol, activo) VALUES
    ('Rosa Méndez', 'supervisor@agrocontrol.com', '$2a$10$P3ijac.D07dJ4XCYFSxHD.59BYTxM1ILLxiS06BRPFzhJOqScD7/i',
     (SELECT id_rol FROM agrocontrol.rol WHERE nombre = 'SUPERVISOR'), true);
