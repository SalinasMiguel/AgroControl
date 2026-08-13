# Glosario v0.1 — AgroControl
## Sistema de Gestión de Lotes Agrícolas, Campañas, Labores, Insumos y Cosecha
## 1. Conceptos del Negocio Agrícola

| Término | Definición / Explicación |
| :--- | :--- |
| **Predio** | El terreno o finca completa en su totalidad propiedad del cliente o administrada por este. |
| **Parcela (Lote)** | Cada una de las subdivisiones específicas dentro de un predio donde se realiza la siembra y trabajo agrícola. |
| **Cultivo** | La especie vegetal o fruto que se siembra y produce en la parcela (ej. maíz, soya, tomate). |
| **Campaña** | El ciclo productivo completo de un cultivo en una parcela, delimitado por un período de tiempo desde la siembra hasta la cosecha. |
| **Labor** | Cada actividad o tarea operativa individual ejecutada en el campo (ej. arado, riego, fumigación, fertilización). |
| **Insumo** | Materiales y productos consumibles requeridos para la producción agrícola (ej. semillas, fertilizantes, plaguicidas, combustible). |
| **Cosecha** | Recolección final del producto agrícola, con registro explícito de volúmenes, cantidades y unidades de medida. |


## 2. Actores del Sistema (Roles)

| Rol | Definición y Responsabilidades Principales |
| :--- | :--- |
| **Administrador** | Encargado de la configuración general del sistema: gestión de predios, usuarios, permisos y catálogos base. |
| **Jefe de Campo** | Responsable de la planificación estratégica: define campañas, programa labores de campo y coordina la ejecución. |
| **Operario** | Usuario móvil en campo: consulta las labores asignadas a su persona y reporta el cumplimiento y observaciones. |
| **Almacenero** | Custodio del inventario: registra las entradas, salidas y despachos de insumos para las labores programadas. |
| **Supervisor** | Evaluador de gestión: monitorea el avance de campañas, consulta indicadores (KPIs) y analiza la trazabilidad. |


## 3. Módulos y Funcionalidades del Sistema

* **Bitácora de Campo:** Diario o registro histórico consolidado por parcela donde se detallan todas las actividades, insumos y eventos ocurridos.
* **Incidencia:** Registro de eventos no previstos o anomalías detectadas en el campo (ej. plagas, condiciones climáticas adversas, fallas de equipos).
* **Movimiento de Insumos:** Control de inventario que registra ingresos y egresos de materiales, asegurando la existencia de stock disponible antes de su uso.
* **Dashboard (Panel de Control):** Interfaz gráfica ejecutiva con métricas e indicadores operativos (KPIs) en tiempo real para la toma de decisiones.
* **Asignación de Labores:** Proceso de vincular a un operario específico con una labor programada en una parcela determinada.


## 4. Reglas de Negocio y Términos Técnicos

| Término / Regla | Explicación |
| :--- | :--- |
| **Trazabilidad Operativa** | Capacidad de rastrear e inspeccionar la historia completa del tratamiento y producción de un lote de cultivo paso a paso. |
| **MVP (Producto Mínimo Viable)** | Conjunto funcional obligatorio de módulos y componentes necesarios para la primera entrega operativa del sistema. |
| **KPIs (Indicadores Clave de Desempeño)** | Métricas cuantitativas utilizadas para medir la eficiencia y avance operativo (ej. % de labores completadas, rendimiento por cosecha). |
| **Auditoría** | Mecanismo de registro que almacena los cambios críticos realizados en el sistema (quién modificó qué y cuándo). |
| **No Asesoría Agronómica (IA)** | Regla de negocio estricta (RN-10) que prohíbe que el sistema o módulos de IA prescriban dosis químicas o tratamientos agrícolas. |
| **Validación de Stock** | Regla de negocio (RN-04) que impide registrar consumo de insumos si este supera la disponibilidad en almacén. |
