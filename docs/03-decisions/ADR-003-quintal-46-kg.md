# ADR-003: El quintal son 46 kg

## Contexto
RN-07 exige cantidades y unidades explícitas. El formulario admitía `qq`, pero la web lo ignoraba, el backend lo excluía del rendimiento y el móvil lo tomaba como toneladas.

## Decisión
`UnidadCosecha` admite solo `t`, `kg` y `qq`, con `qq` = 46 kg (0,046 t), y el backend entrega las toneladas ya calculadas. Web y móvil no convierten.

## Alternativas consideradas
- **Quintal métrico de 100 kg:** no es el que se usa en el campo boliviano.
- **Guardar todo en toneladas:** se perdería la cantidad y la unidad con que se registró.
- **Unidades libres por cultivo:** fuera del alcance.

## Consecuencias
- V10 normaliza las unidades existentes y agrega un CHECK. Si encuentra una unidad desconocida, falla: no hay forma segura de convertirla.
- Es un supuesto del equipo: si el cliente usa otro quintal, cambia una sola constante.
