
/* global console, fetch, setTimeout, clearTimeout, process */
import WebSocket from "ws";
import assert from "node:assert/strict";

const HTTP = "http://localhost:3000/tasks";
const WS = "ws://localhost:3000/ws";

const clientes = [];
let idTarea = null;

function esperarMensaje(socket, tipo, id = null) {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => {
      limpiar();
      reject(new Error(`Tiempo agotado: ${tipo}`));
    }, 5000);

    function limpiar() {
      clearTimeout(temporizador);
      socket.off("message", recibir);
      socket.off("error", error);
      socket.off("close", cerrado);
    }

    function recibir(datos) {
      let mensaje;

      try {
        mensaje = JSON.parse(datos.toString());
      } catch {
        return;
      }

      if (
        mensaje.tipo === tipo &&
        (id === null ||
          mensaje.tarea?.id === id ||
          mensaje.id === id)
      ) {
        limpiar();
        resolve(mensaje);
      }
    }

    function error(err) {
      limpiar();
      reject(err);
    }

    function cerrado() {
      limpiar();
      reject(new Error("WebSocket cerrado inesperadamente"));
    }

    socket.on("message", recibir);
    socket.once("error", error);
    socket.once("close", cerrado);
  });
}

async function conectarCliente(numero) {
  const socket = new WebSocket(WS);
  clientes.push(socket);

  const snapshot = await esperarMensaje(socket, "snapshot");

  assert.ok(Array.isArray(snapshot.tareas));
  console.log(`OK: Cliente ${numero} conectado y snapshot recibido`);

  return socket;
}

async function ejecutar() {
  try {
    const cliente1 = await conectarCliente(1);
    const cliente2 = await conectarCliente(2);

    // CREAR
    const titulo = `Prueba WebSocket T4.1 ${Date.now()}`;

    const creado1 = esperarMensaje(cliente1, "tarea:creada");
    const creado2 = esperarMensaje(cliente2, "tarea:creada");

    const respuestaCrear = await fetch(HTTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descripcion: "Prueba automatizada",
        updatedBy: "t4.1-websocket",
      }),
    });

    assert.equal(respuestaCrear.status, 201);
    const tarea = await respuestaCrear.json();
    idTarea = tarea.id;

    const eventosCrear = await Promise.all([creado1, creado2]);
    for (const evento of eventosCrear) {
      assert.equal(evento.tarea.id, idTarea);
      assert.equal(evento.tarea.titulo, titulo);
    }

    console.log("OK: Ambos clientes recibieron tarea:creada");

    // ACTUALIZAR
    const actualizado1 = esperarMensaje(
      cliente1, "tarea:actualizada", idTarea
    );
    const actualizado2 = esperarMensaje(
      cliente2, "tarea:actualizada", idTarea
    );

    const respuestaActualizar = await fetch(`${HTTP}/${idTarea}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado: "en_progreso",
        updatedBy: "t4.1-websocket",
      }),
    });

    assert.equal(respuestaActualizar.status, 200);

    const eventosActualizar = await Promise.all([
      actualizado1, actualizado2,
    ]);

    for (const evento of eventosActualizar) {
      assert.equal(evento.tarea.estado, "en_progreso");
      assert.equal(evento.tarea.version, 2);
    }

    console.log("OK: Ambos clientes recibieron tarea:actualizada");

    // ELIMINAR
    const eliminado1 = esperarMensaje(
      cliente1, "tarea:eliminada", idTarea
    );
    const eliminado2 = esperarMensaje(
      cliente2, "tarea:eliminada", idTarea
    );

    const respuestaEliminar = await fetch(`${HTTP}/${idTarea}`, {
      method: "DELETE",
    });

    assert.equal(respuestaEliminar.status, 204);

    const eventosEliminar = await Promise.all([
      eliminado1, eliminado2,
    ]);

    for (const evento of eventosEliminar) {
      assert.equal(evento.id, idTarea);
      assert.equal(evento.version, 3);
    }

    const consulta = await fetch(`${HTTP}/${idTarea}`);
    assert.equal(consulta.status, 404);
    idTarea = null;

    console.log("OK: Ambos clientes recibieron tarea:eliminada");
    console.log("OK: La tarea ya no existe (HTTP 404)");
    console.log("\nRESULTADO: PRUEBAS WEBSOCKET APROBADAS");
  } finally {
    if (idTarea) {
      await fetch(`${HTTP}/${idTarea}`, {
        method: "DELETE",
      }).catch(() => {});
    }

    for (const cliente of clientes) {
      cliente.close();
    }
  }
}

ejecutar().catch((error) => {
  console.error("PRUEBA FALLIDA:", error.message);
  process.exitCode = 1;
});
