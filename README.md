# Prototipo Cliente-Servidor

Prototipo de arquitectura Cliente-Servidor para el sistema colaborativo de gestión de tareas del proyecto de Servicios Telemáticos.

Actualmente permite crear, consultar, editar, cambiar de estado y eliminar tareas mediante una API REST.

## Requisitos

Para ejecutar el proyecto localmente se necesita:

- Git
- Node.js 26.x
- npm 12.x

Para ejecutar el proyecto mediante contenedores:

- Docker
- Docker Compose

En Windows se recomienda utilizar Git, Node.js y Docker Desktop.

## Entorno probado

El proyecto fue probado con:

- Node.js 26.10.0
- npm 12.1.0
- TypeScript 5.9.x
- Express 5.2.1
- ESLint 10.12.x
- tsx 4.23.x
- Docker 29.9.0
- Docker Compose 5.6.0

El Dockerfile utiliza la imagen:

```text
node:26-alpine
```

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/FabriCordovaCaceres/servicios-telematicos-cliente-servidor.git
```

Entrar al proyecto:

```bash
cd servicios-telematicos-cliente-servidor
```

Instalar las dependencias:

```bash
npm ci
```

## Verificación

Ejecutar ESLint:

```bash
npm run lint
```

Compilar TypeScript:

```bash
npm run build
```

## Ejecución en desarrollo

```bash
npm run dev
```

El servidor se iniciará en:

```text
http://localhost:3000
```

## Ejecución compilada

```bash
npm run build
npm start
```

## API REST

Puerto utilizado:

```text
3000
```

Endpoints disponibles:

```text
GET    /tasks       Listar tareas
GET    /tasks/:id   Obtener una tarea por ID
POST   /tasks       Crear una tarea
PUT    /tasks/:id   Editar una tarea o cambiar su estado
DELETE /tasks/:id   Eliminar una tarea
```

Estados permitidos:

```text
pendiente
en_progreso
finalizada
```

## Ejemplo de creación de una tarea

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "titulo":"Tarea de prueba",
    "descripcion":"Prueba del CRUD",
    "updatedBy":"usuario-1"
  }'
```

Para listar las tareas:

```bash
curl http://localhost:3000/tasks
```

## Docker

Construir la imagen:

```bash
docker build -t tele-cliente-servidor .
```

Ejecutar el contenedor:

```bash
docker run --rm \
  -p 3000:3000 \
  --name tele-cs \
  tele-cliente-servidor
```

Comprobar el funcionamiento:

```bash
curl http://localhost:3000/
curl http://localhost:3000/tasks
```

## Almacenamiento

En esta etapa las tareas se almacenan en memoria.

Por lo tanto, al detener y volver a iniciar la aplicación las tareas creadas desaparecen.

Esta decisión permite mantener el prototipo simple para las pruebas y la comparación entre las tres arquitecturas.



## Virtualizacion

 **Guía completa paso a paso:** [docs/VIRTUALIZACION.md](docs/VIRTUALIZACION.md)
(creación de las VMs en VirtualBox, red Host-Only, IP fija, SSH, instalación de Docker, despliegue y pruebas).

### Topología

| VM | IP | Servicios |
|---|---|---|
| VM1 `vm1-cs-p2p` | 192.168.56.11 | **Cliente-Servidor :3000** + P2P nodo-1 :4001 |
| VM2 `vm2-p2p-micro` | 192.168.56.12 | P2P nodo-2 :4002 + Microservicio de tareas :5001 |

### Desplegar este prototipo en VM1

Dentro de VM1 (por SSH: `ssh grupo10@192.168.56.11`):

```bash
mkdir -p ~/proyecto && cd ~/proyecto
git clone https://github.com/FabriCordovaCaceres/servicios-telematicos-cliente-servidor.git
cd ~/proyecto/servicios-telematicos-cliente-servidor
docker build -t tele-cliente-servidor .
docker run -d --name tele-cs --restart unless-stopped -p 3000:3000 tele-cliente-servidor
```

Comprobar desde VM2 (a través de la red):

```bash
curl http://192.168.56.11:3000/
curl http://192.168.56.11:3000/tasks
```

### Actualizar tras un cambio en GitHub

```bash
cd ~/proyecto/servicios-telematicos-cliente-servidor
git pull
docker build -t tele-cliente-servidor .
docker rm -f tele-cs
docker run -d --name tele-cs --restart unless-stopped -p 3000:3000 tele-cliente-servidor
```

---

## Sprint 2 — Sincronización en tiempo real (RQ4)

El servidor ahora tiene un canal **WebSocket** en `ws://<servidor>:3000/ws`.
Cada vez que se crea, modifica o elimina una tarea por la API REST, el
servidor avisa a **todos** los clientes conectados.

### Mensajes que envía el servidor

| Mensaje (`tipo`) | Cuándo | Contenido |
|---|---|---|
| `snapshot` | Al conectarse | `tareas`: lista completa actual |
| `tarea:creada` | POST `/tasks` | `tarea` |
| `tarea:actualizada` | PUT `/tasks/:id` | `tarea` (con `version` aumentada) |
| `tarea:eliminada` | DELETE `/tasks/:id` | `id`, `version`, `updatedAt`, `updatedBy` |

Todos incluyen `origen` y `enviadoEn` (milisegundos, para medir latencia).

### Probarlo

- Navegador: abrir `http://<servidor>:3000/demo/` en dos dispositivos distintos.
- Consola (por ejemplo desde VM2): `npm run escuchar -- ws://192.168.56.11:3000/ws`
  o, con Docker, `docker exec -it tele-cs node dist/tools/escuchar.js ws://localhost:3000/ws`.
- Crear una tarea: `curl -X POST http://192.168.56.11:3000/tasks -H "Content-Type: application/json" -d '{"titulo":"Tarea en vivo","updatedBy":"vm2"}'`

### Nuevos archivos

`src/events/task.events.ts`, `src/realtime/websocket.ts`, `src/tools/escuchar.ts`,
`public/index.html`. Se modificaron `src/services/task.service.ts`, `src/index.ts`
y el `Dockerfile` (ahora copia `public/`). Nueva dependencia: `ws`.
