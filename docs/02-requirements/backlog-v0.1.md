# Backlog v0.1 — AgroControl
# #Convencion de prioridad
- P0: impresindible para el flujo critico del MVP.
- P1: importante para completar la operacion.

## RF-01 Gestionar predios y parcelas.
**Prioridad:* P0
Como administrador quiero registrar una parcelas y predios para la gestion de los cultivos.

## RF-02 Bloquear predios y parcelas
**Prioridad:*P1
Como administrador debo bloquear predios y parcelas ya ocupadas para evitar confusiones.

## RF-03 Gestionar cultivos
**Prioridad:* P0
Como adminitrador quiero crear zonas exclusivas para los cultivos

## RF-04 Crear campañas
**Prioridad:* P0
Como jefe de campo debo crear campañas para la planificacion de labores y subdivision de trabajos

## RF-05 Planificar labores
**Prioridad:* P0
Como Jefe de campo debo administrar y asignar el estado planificado, asignado, en ejecución, completado o cancelado de cada labor .

## RF-06 Asignar Operarios
**Prioridad:* P0
Como Administrador debo asignar a los usuarios las tareas en la agenda de campo

## RF-07 Consultar agenda de campo.
**Prioridad:* P1
Como operario debo reportar la labor asignada asignada.

## RF-08 Iniciar/completar labor.
**Prioridad:* P1
Como jefe de campo la cosecha se registra contra una campaña activa/finalizable en una bitacora de campo.

## RF-09 Registrar observación de campo.
**Prioridad:* P1
Como supervisor registro las cantidades y unidades de medida deben estar explícitas durante la labor.

## RF-10 Gestionar insumos.
**Prioridad:* P1
Como almacenero se debe registrar los insumos en el almacen y hacer un informe de su entrada y salida

## RF-11 Validar stock antes de consumo.
**Prioridad:* P1
Como almacenero debo hacer un informe y recuento de stock antes de consumo.

## RF-12 Registro de incidencias 
**Prioridad:* P1 
Como supervisor registro las incidencias y percances vinculadas a parcela/campaña/labor.

## RF-13 Registrar cosecha.
**Prioridad:* P1
Como almacenero debo registrar la cosecha para posteriormente almacenarla en cilos.

## RF-14 Consultar bitácora por parcela.
**Prioridad* P1
Como administrador debo consultar la bitacora por parcela al jefe de campo

## RF-15 Consultar avance por campaña
**Prioridad:* P1
Como Jefe de campo debo consultar los avances de campaña a los operarios y validarlos

## RF-16 Auditar cambios críticos.
**Prioridad:* P0
Como administrador quiero consultar quién hizo cada cambio crítico y cuándo, para revisar lo ocurrido ante problemas graves.

## RF-17 — Consultar dashboard
**Prioridad:* P1
Como supervisor quiero consultar campañas, avance de labores, stock y cosechas para entender
el estado operativo.

---

## Actualización: base confiable (2026-10-31)

Requisitos agregados por el equipo, sin contradecir el alcance del Banco. Las decisiones están en `docs/03-decisions/`.

- **Cuentas:** cambiar contraseña, editar, desactivar y activar usuarios, y restablecer con clave temporal. Siempre queda un administrador activo.
- **Instalación limpia:** perfil `produccion` sin datos de ejemplo (ADR-001).
- **Corrección sin borrar:** editar lo planificado y anular con motivo lo registrado (ADR-002, RN-09).
- **Estados de labor:** planificada, asignada, en ejecución, completada y cancelada (RN-03, ADR-004).
- **Cosecha:** solo en campañas en curso (RN-06), con unidades `t`, `kg` y `qq` (RN-07, ADR-003).
- **Parcela:** su estado lo mueve la campaña.
