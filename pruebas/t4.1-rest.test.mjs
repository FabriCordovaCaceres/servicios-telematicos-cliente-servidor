

/* global fetch, console */

import test from "node:test";
import assert from "node:assert/strict";

const BASE = "http://localhost:3000/tasks";
const ID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

async function solicitar(ruta, metodo = "GET", datos) {
  const opciones = { method: metodo };

  if (datos !== undefined) {
    opciones.headers = {
      "Content-Type": "application/json",
    };
    opciones.body = JSON.stringify(datos);
  }

  return fetch(`${BASE}${ruta}`, opciones);
}

test("T4.1 - Pruebas funcionales REST Cliente-Servidor", async () => {
  let id = null;

  try {
    // PF-CS-01: Listar tareas
    let respuesta = await solicitar("");
    assert.equal(respuesta.status, 200);
    assert.ok(Array.isArray(await respuesta.json()));
    console.log("OK PF-CS-01: Listar tareas");

    // PF-CS-02: Rechazar titulo vacio
    respuesta = await solicitar("", "POST", { titulo: "" });
    assert.equal(respuesta.status, 400);
    console.log("OK PF-CS-02: Titulo vacio rechazado");

    // PF-CS-03: Rechazar titulo numerico
    respuesta = await solicitar("", "POST", { titulo: 123 });
    assert.equal(respuesta.status, 400);
    console.log("OK PF-CS-03: Titulo numerico rechazado");

    // PF-CS-04: Crear tarea valida
    respuesta = await solicitar("", "POST", {
      titulo: `Prueba REST T4.1 ${Date.now()}`,
      descripcion: "Prueba funcional automatizada",
      updatedBy: "t4.1-rest",
    });

    assert.equal(respuesta.status, 201);
    const tarea = await respuesta.json();

    assert.ok(tarea.id);
    assert.equal(tarea.estado, "pendiente");
    assert.equal(tarea.version, 1);
    id = tarea.id;
    console.log("OK PF-CS-04: Crear tarea");

    // PF-CS-05: Consultar tarea creada
    respuesta = await solicitar(`/${id}`);
    assert.equal(respuesta.status, 200);

    const consultada = await respuesta.json();
    assert.equal(consultada.id, id);
    console.log("OK PF-CS-05: Consultar tarea");

    // PF-CS-06: Rechazar estado invalido
    respuesta = await solicitar(`/${id}`, "PUT", {
      estado: "cancelada",
    });
    assert.equal(respuesta.status, 400);
    console.log("OK PF-CS-06: Estado invalido rechazado");

    // PF-CS-07: Actualizar tarea
    respuesta = await solicitar(`/${id}`, "PUT", {
      titulo: "Tarea actualizada T4.1",
      estado: "en_progreso",
      updatedBy: "t4.1-rest",
    });

    assert.equal(respuesta.status, 200);
    const actualizada = await respuesta.json();

    assert.equal(actualizada.estado, "en_progreso");
    assert.equal(actualizada.version, 2);
    assert.equal(actualizada.titulo, "Tarea actualizada T4.1");
    console.log("OK PF-CS-07: Actualizar tarea");

    // PF-CS-08: Consultar ID inexistente
    respuesta = await solicitar(`/${ID_INEXISTENTE}`);
    assert.equal(respuesta.status, 404);
    console.log("OK PF-CS-08: Consulta inexistente");

    // PF-CS-09: Eliminar ID inexistente
    respuesta = await solicitar(`/${ID_INEXISTENTE}`, "DELETE");
    assert.equal(respuesta.status, 404);
    console.log("OK PF-CS-09: Eliminacion inexistente");

    // PF-CS-10: Eliminar tarea creada
    respuesta = await solicitar(`/${id}`, "DELETE");
    assert.equal(respuesta.status, 204);
    console.log("OK PF-CS-10: Eliminar tarea");

    // PF-CS-11: Comprobar eliminacion
    respuesta = await solicitar(`/${id}`);
    assert.equal(respuesta.status, 404);

    respuesta = await solicitar("");
    assert.equal(respuesta.status, 200);
    const tareas = await respuesta.json();
    assert.ok(!tareas.some((t) => t.id === id));

    id = null;
    console.log("OK PF-CS-11: Eliminacion confirmada");

    console.log("\nRESULTADO: 11 COMPROBACIONES REST APROBADAS");
  } finally {
    // Limpiar solamente la tarea creada por esta prueba
    if (id) {
      await solicitar(`/${id}`, "DELETE").catch(() => {});
    }
  }
});
