# T4.6 - Seguridad y tolerancia a fallos: Cliente-Servidor

Requisito: RQ14

## Objetivo
Comprobar validacion de entradas, puertos locales, TLS verificado y recuperacion tras interrupciones controladas.

## Alcance y limitaciones
- Pruebas locales de desarrollo en localhost. No son una auditoria de seguridad externa.
- Los procesos se detuvieron y reiniciaron manualmente; no se ha demostrado alta disponibilidad automatica.
- Una conexion TLS local no verificada no demuestra ausencia de HTTPS en un despliegue con proxy inverso.
- Los resultados HALLAZGO y OBSERVADO documentan limitaciones y no se ocultan.

## Seguridad
Evidencia: evidencias/seguridad-cs-3074fa65.json

| Prueba | Estado | Resultado observado |
|---|---|---|
| Cliente-Servidor: servicio disponible | OK | 200 |
| Cliente-Servidor: cabeceras HTTP | OBSERVADO | {"x-powered-by":"Express","x-content-type-options":null,"strict-transport-security":null} |
| Cliente-Servidor: ID inexistente | OK | 404 |
| Cliente-Servidor: POST sin titulo | OK | 400 |
| Cliente-Servidor: POST titulo numerico | OK | 400 |
| Cliente-Servidor: POST titulo vacio | OK | 400 |
| Cliente-Servidor: JSON malformado | OK | 400 |
| Cliente-Servidor: crear tarea temporal | OK | 201 |
| Cliente-Servidor: PUT estado invalido | OK | 400 |
| Cliente-Servidor: eliminar tarea temporal | OK | 204 |
| Cliente-Servidor: titulo solo espacios | HALLAZGO | 201 |
| Cliente-Servidor: limpiar titulo en blanco | OK | 204 |
| Puerto local 3000 | OK | ABIERTO |
| TLS verificado 3000 | OBSERVADO | ERR_SSL_PACKET_LENGTH_TOO_LONG |

## Tolerancia a fallos
Evidencia: evidencias/fallos-cs-7e8d4229.json

| Prueba | Estado | Resultado observado |
|---|---|---|
| Cliente-Servidor 3000 antes del fallo | OK | 200 |
| Cliente-Servidor 3000 detenido | OK | sin conexion |
| Cliente-Servidor 3000 reiniciado | OK | 200 |
| Disponibilidad durante el fallo | OBSERVADO | servicio no disponible |

## Conclusion
Los resultados muestran el comportamiento observado en el entorno local. Las debilidades detectadas deben documentarse como mejoras pendientes y no como controles implementados.
