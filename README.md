# AgroControl 
Sistema de gestion de lotes agricola, campañas labores insumos y cosechas 
## 1. Problema
Reemplazar el registro manual y disperso de la operación agrícola por un sistema digital que dé trazabilidad completa — quién hizo qué, cuándo, con qué insumos, y con qué resultado — a nivel de parcela y campaña, sin tomar decisiones agronómicas por el usuario.
## 2. Objetivo del MVP 
Desarrollar un sistema web/móvil para planificar campañas, registrar labores e insumos, controlar responsables y capturar cosechas, ofreciendo una bitácora completa por parcela. 
## 3. Actores principales
- Administrador
- Jefe de campo 
- Operario 
- Almacenero 
- Supervisor
 ## 4. Alcance inicial 
- Predios y parcelas 
- Cultivos
- Campañas 
- Labores
- Asignaciones 
- Insumos 
- Movimientos de insumos
- Bitacora de campo 
- Cosecha
- Incidentes 
- Dashboard 
## 5. Fuera de alcance
 - Sensores IoT
- Cámaras y lectura automática de placas 
- Barreras físicas
- Pasarela bancaria real 
- Facturación fiscal
- GPS en tiempo real 
- IA para autorizar reservas o calcular precios
 ## 6. Stack objetivo del semestre 
- Backend: Java 21 + Spring Boot
- Base de datos: PostgreSQL + Flyway 
- Web: React + TypeScript 
- Móvil: React Native + TypeScript 
- Pruebas API: Postman
- Contenedores: Docker / Docker Compose 
- Versionado: Git + GitHub 
- CI: GitHub Actions - IA: Spring AI, únicamente como capacidad complementaria
 ## 7. Estado actual 
Clase 01: comprensión del problema, alcance, lenguaje inicial del dominio y backlog v0.1. Todavía no existe código de aplicación.
 ## 8. Documentación 
- `docs/01-vision/vision-v0.1.md` 
- `docs/01-vision/glossary-v0.1.md` 
- `docs/02-requirements/backlog-v0.1.md` 
- `docs/03-decisions/` 
## 9. Regla de trabajo
 Cada cambio importante debe ser comprensible, trazable y defendible. El repositorio es la fuente de verdad del proyecto
