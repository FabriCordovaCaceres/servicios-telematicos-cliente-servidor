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
