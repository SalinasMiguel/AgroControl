# Visión v0.1 — AgroControl
 ## 1. Contexto
 Una empresa administra parcelas, campañas, cultivos, labores de campo, uso de insumos, responsables y cosechas con registros manuales esta necesita una trazabilidad operativa por lote y campaña cosa que necesita  
## 2. Problema 
La operación actual puede generar espacios marcados como libres cuando están ocupados, reservas incompatibles, ejemplo que el operario y el almacenero registren una misma parcela para diferente función.
## 3. Objetivo 
Centralizar la operación del reserva de labores, parcelas, etc. y mantener una representación confiable de disponibilidad, reservas, ocupación, entradas, salidas, bloqueos e incidencias. 
## 4. Actores 
### Administrador 
Configura datos de usuarios, parcelas, zonas, campañas, labores de campo y parámetros.
### Jefe de campo
 Registra entrada, salida, validación usos y operación diaria. 
### Operario
Registra o consulta vehículos, busca disponibilidad, crea/cancela reservas permitidas y consulta su estancia desde el movil
### Almacenero
 Registra o gestiona movimientos que vuelven temporalmente indisponible un espacio principalmente de la cosecha y herramientas. 
### Supervisor 
Consulta ocupación, incidencias, avances, excepciones e indicadores de uso. 
## 5. Alcance del MVP 
1. Gestión de predios, parcelas y campañas. 
2. Gestión de labores, asignación de insumos. 
3. Consulta de disponibilidad y movimientos de insumos. 
4. Creación y gestión de bitacora. 
5. Registro de entrada(siembra) y salida(cosecha). 
6. Control de estancia activa y estado de incidencias. 
7. Bloqueos de espacio e incidencias. 
8. Historial y dashboard operativo. 
## 6. Exclusiones 
No incluye IoT, cámaras, lectura automática de placas, barreras físicas, pasarela bancaria real, facturación fiscal, GPS en tiempo real ni decisiones automáticas de negocio mediante IA. 
## 7. Éxito inicial del proyecto 
El proyecto será exitoso cuando pueda demostrar, con datos persistidos, un flujo coherente desde la búsqueda de disponibilidad de los predios y parcelas hasta la reserva, siembra, campaña, movimientos de insumos y cosecha, consumido por web y móvil sobre el mismo backend.
