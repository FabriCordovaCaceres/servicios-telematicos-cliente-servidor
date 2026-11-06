# T4.6 - Seguridad y tolerancia a fallos: Cliente-Servidor

Requisito: RQ14

## Objetivo
Comprobar validacion de entradas, puertos, TLS verificado y recuperacion tras interrupciones controladas.

## Alcance y limitaciones
- Entorno virtualizado (direcciones por variables de entorno). No son una auditoria de seguridad externa.
- Los procesos se detuvieron y reiniciaron manualmente; no se ha demostrado alta disponibilidad automatica.
- Una conexion TLS local no verificada no demuestra ausencia de HTTPS en un despliegue con proxy inverso.
- Los resultados HALLAZGO y OBSERVADO documentan limitaciones y no se ocultan.

## Seguridad
Evidencia: evidencias/vm-seguridad-cs-c5e5ca20.json

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
| Cliente-Servidor: PUT titulo solo espacios | OK | 400 |
| Cliente-Servidor: PUT estado invalido | OK | 400 |
| Cliente-Servidor: eliminar tarea temporal | OK | 204 |
| Cliente-Servidor: titulo solo espacios | OK | 400 |
| Puerto 3000 en 192.168.56.11 | OK | ABIERTO |
| TLS verificado 3000 | OBSERVADO | ERR_SSL_WRONG_VERSION_NUMBER |

## Tolerancia a fallos
Evidencia: evidencias/vm-fallos-cs-5520158e.json

| Prueba | Estado | Resultado observado |
|---|---|---|
| Cliente-Servidor 3000 antes del fallo | OK | 200 |
| Cliente-Servidor 3000 detenido | OK | sin conexion |
| Cliente-Servidor 3000 reiniciado | OK | 200 |
| Disponibilidad durante el fallo | OBSERVADO | servicio no disponible |

## Conclusion
Los resultados muestran el comportamiento observado en el entorno virtualizado (direcciones por variables de entorno). Las debilidades detectadas deben documentarse como mejoras pendientes y no como controles implementados.
