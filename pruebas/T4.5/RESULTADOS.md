# T4.5 - Pruebas de comunicacion: Cliente-Servidor

Requisito: RQ14

## Objetivo
Evaluar interrupcion, duplicacion y reconexion WebSocket.

## Resultados
- Conexion inicial: OK. WebSocket conectado y snapshot recibido.
- Interrupcion: OBSERVADO. Se creo una tarea mientras el cliente WebSocket de prueba estaba desconectado.
- Reconexion: RECUPERADO. El snapshot incluyo la tarea creada durante la desconexion.
- Duplicacion: NO MITIGADO. Dos POST iguales crearon tareas diferentes.

## Evidencia
- resultados/cs-8e612504.json

## Conclusion
Se recupera el estado al reconectar, pero no se evita la creacion de tareas duplicadas.
