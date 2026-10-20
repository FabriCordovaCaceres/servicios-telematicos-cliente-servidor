import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { onTaskEvent } from "../events/task.events";
import { getTasks } from "../services/task.service";

const ORIGEN = "cliente-servidor";
const INTERVALO_LATIDO_MS = 15_000;

// Envía un mensaje JSON a un socket si todavía está abierto
function enviar(socket: WebSocket, mensaje: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(mensaje));
  }
}

// Sprint 2 (RQ4): sincronización en tiempo real con WebSocket (RFC 6455).
// Los clientes se conectan a ws://<servidor>:3000/ws
export function iniciarWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Latido (ping/pong): detecta clientes que se desconectaron sin avisar
  const vivos = new WeakSet<WebSocket>();

  wss.on("connection", (socket) => {
    vivos.add(socket);

    socket.on("pong", () => {
      vivos.add(socket);
    });

    socket.on("error", (error) => {
      console.error(`Error en un cliente WebSocket: ${error.message}`);
    });

    socket.on("close", () => {
      console.log(`Cliente WebSocket desconectado. Conectados: ${wss.clients.size}`);
    });

    // Al conectarse, el cliente recibe el estado actual completo
    enviar(socket, {
      tipo: "snapshot",
      tareas: getTasks(),
      origen: ORIGEN,
      enviadoEn: Date.now(),
    });

    console.log(`Cliente WebSocket conectado. Conectados: ${wss.clients.size}`);
  });

  // Cada cambio en las tareas se reenvía a TODOS los clientes conectados
  onTaskEvent((evento) => {
    const mensaje = JSON.stringify({
      ...evento,
      origen: ORIGEN,
      enviadoEn: Date.now(),
    });

    for (const socket of wss.clients) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(mensaje);
      }
    }
  });

  const latido = setInterval(() => {
    for (const socket of wss.clients) {
      if (!vivos.has(socket)) {
        socket.terminate();
        continue;
      }
      vivos.delete(socket);
      socket.ping();
    }
  }, INTERVALO_LATIDO_MS);

  wss.on("close", () => {
    clearInterval(latido);
  });

  return wss;
}
