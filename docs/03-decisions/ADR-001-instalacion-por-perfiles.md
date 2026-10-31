# ADR-001: Instalación limpia por perfiles de Flyway

## Contexto
Las migraciones V2, V3 y V7 cargaban datos de ejemplo y el administrador `agro123`, así que toda instalación nacía con ellos. El Banco pide migraciones versionadas (RNF-05) y datos de demostración reproducibles (RNF-14): hacen falta las dos cosas.

## Decisión
Demo y producción comparten `db/migration` y difieren en `db/demo` y `db/produccion`. El perfil `produccion` carga solo los 5 roles y exige `AGROCONTROL_JWT_SECRET` y un primer administrador por variables de entorno. Sin perfil, todo sigue igual: `./iniciar.sh` levanta la demo.

## Alternativas consideradas
- **Borrar los datos con una migración de limpieza:** rompe la demo y no sirve para una base nueva.
- **Cargar la demo con un script aparte:** deja de ser reproducible con solo arrancar, y cambia los checksums de V2, V3 y V7.
- **Flyway `callbacks`:** agrega un mecanismo más para el mismo resultado.

## Consecuencias
- Los checksums de V1 a V7 no cambian, y `MigracionesTest` lo comprueba.
- Una base creada con un perfil no abre con el otro: producción requiere base vacía.
- Al mover migraciones hay que borrar `backend/target`, o Flyway ve dos veces la misma versión.
