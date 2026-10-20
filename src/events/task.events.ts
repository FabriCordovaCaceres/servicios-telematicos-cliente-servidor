import { EventEmitter } from "node:events";
import type { Task } from "../models/task";

// Eventos que genera el servicio de tareas cada vez que cambia algo.
// Los módulos de tiempo real (WebSocket) se suscriben a estos eventos,
// así el CRUD no necesita saber nada de WebSocket.
export type TaskEvent =
  | { tipo: "tarea:creada"; tarea: Task }
  | { tipo: "tarea:actualizada"; tarea: Task }
  | {
      tipo: "tarea:eliminada";
      id: string;
      version: number;
      updatedAt: number;
      updatedBy: string;
    };

const emisor = new EventEmitter();

export function emitTaskEvent(evento: TaskEvent): void {
  emisor.emit("evento", evento);
}

export function onTaskEvent(listener: (evento: TaskEvent) => void): void {
  emisor.on("evento", listener);
}
