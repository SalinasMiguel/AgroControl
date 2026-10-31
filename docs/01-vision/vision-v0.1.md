# Visión v0.1 — AgroControl
 ## 1. Contexto
 Una empresa administra predios, parcelas, campañas, cultivos, labores de campo, uso de insumos, responsables y cosechas con registros manuales. Necesita trazabilidad operativa por parcela y campaña.
## 2. Problema 
La operación actual puede dejar parcelas marcadas como disponibles cuando ya están en producción, stock que no coincide con lo usado en el campo y labores sin responsable claro. Por ejemplo, el operario y el almacenero pueden registrar una misma parcela para funciones diferentes.
## 3. Objetivo 
Centralizar la operación de predios, parcelas, campañas, labores, insumos y cosechas, y mantener una representación confiable del estado de las parcelas, el stock, los avances y las incidencias. 
## 4. Actores 
### Administrador 
Configura usuarios, roles, predios y parcelas, y consulta la auditoría de cambios críticos. 
### Jefe de campo
 Planifica campañas, programa labores, asigna operarios, registra cosechas y atiende incidencias. 
### Operario
Consulta las labores que tiene asignadas, reporta su ejecución y registra los insumos usados, las observaciones y las incidencias del campo.
### Almacenero
 Registra insumos, entradas y salidas del almacén, y registra cosechas. 
### Supervisor 
Consulta avances, bitácora, cosechas, incidencias e indicadores; registra observaciones e incidencias y las atiende. 
## 5. Alcance del MVP 
1. Gestión de predios, parcelas y campañas. 
2. Gestión de labores, asignación de operarios y consumo de insumos. 
3. Consulta de stock y movimientos de insumos. 
4. Creación y gestión de bitácora. 
5. Registro de siembra y cosecha por campaña. 
6. Seguimiento del avance de campañas y del estado de incidencias. 
7. Estado de cada parcela: disponible, en producción o en descanso. 
8. Historial y dashboard operativo. 
## 6. Exclusiones 
No incluye IoT, facturación fiscal, pasarela de pagos, GPS en tiempo real ni decisiones automáticas de negocio o asesoría agronómica mediante IA. 
## 7. Éxito inicial del proyecto 
El proyecto será exitoso cuando pueda demostrar, con datos persistidos, un flujo coherente desde la planificación de una campaña en una parcela hasta sus labores, movimientos de insumos y cosecha, consumido por web y móvil sobre el mismo backend.
