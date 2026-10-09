# Prototipo Cliente-Servidor

Prototipo cliente-servidor del sistema colaborativo de gestión de tareas.

## Tecnologías

- Node.js
- TypeScript
- ESLint

## Instalación

npm install

## Desarrollo

npm run dev

## Compilación

npm run build

## Ejecución

npm start

## Verificación

npm run lint
## API REST

Puerto: 3000

### Endpoints

- GET /tasks - Listar tareas
- GET /tasks/:id - Obtener tarea por ID
- POST /tasks - Crear tarea
- PUT /tasks/:id - Editar tarea o cambiar estado
- DELETE /tasks/:id - Eliminar tarea

### Estados permitidos

- pendiente
- en_progreso
- finalizada
