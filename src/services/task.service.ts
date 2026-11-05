import { randomUUID } from "node:crypto";
import type { Task, TaskStatus } from "../models/task";
import { emitTaskEvent } from "../events/task.events";

const ORIGEN = "cliente-servidor";

const tasks: Task[] = [];

export function getTasks(): Task[] {
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

export function createTask(
  titulo: string,
  descripcion: string,
  updatedBy: string,
): Task {
  const now = Date.now();

  const task: Task = {
    id: randomUUID(),
    titulo,
    descripcion,
    estado: "pendiente",
    createdAt: now,
    updatedAt: now,
    version: 1,
    updatedBy,
  };

  tasks.push(task);

  // Sprint 2: avisa a los clientes conectados por WebSocket
  emitTaskEvent({ tipo: "tarea:creada", tarea: task });

  return task;
}

export function updateTask(
  id: string,
  data: {
    titulo?: string;
    descripcion?: string;
    estado?: TaskStatus;
    updatedBy: string;
  },
): Task | undefined {
  const task = getTaskById(id);

  if (!task) {
    return undefined;
  }

  if (data.titulo !== undefined) {
    task.titulo = data.titulo;
  }

  if (data.descripcion !== undefined) {
    task.descripcion = data.descripcion;
  }

  if (data.estado !== undefined) {
    task.estado = data.estado;
  }

  task.updatedAt = Date.now();
  task.updatedBy = data.updatedBy;
  task.version += 1;

  // Sprint 2: avisa a los clientes conectados por WebSocket
  emitTaskEvent({ tipo: "tarea:actualizada", tarea: task });

  return task;
}


export function deleteTask(id: string): boolean {
  // Buscar la tarea por su identificador
  const task = tasks.find((t) => t.id === id);

  // Si la tarea no existe, devolver false
  if (!task) {
    return false;
  }

  // Obtener su posición y eliminarla del arreglo
  const index = tasks.indexOf(task);
  tasks.splice(index, 1);

  // Notificar la eliminación a los clientes WebSocket
  emitTaskEvent({
    tipo: "tarea:eliminada",
    id,
    version: task.version + 1,
    updatedAt: Date.now(),
    updatedBy: ORIGEN,
  });

  return true;
}