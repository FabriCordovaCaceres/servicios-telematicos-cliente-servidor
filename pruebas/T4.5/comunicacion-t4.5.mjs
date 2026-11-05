/* T4.5 / RQ14 - Cliente-Servidor: interrupcion, duplicacion y reconexion WebSocket.
   Requiere Node.js 22+ (WebSocket global). No modifica codigo del servidor. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BASE = process.env.CS_URL ?? 'http://localhost:3000';
const WS_URL = new URL('/ws', BASE.replace(/^http/, 'ws')).toString();
const ID = randomUUID().slice(0, 8);
const resultados = [];
const creadas = [];
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function anotar(prueba, resultado, detalle) {
  resultados.push({ prueba, resultado, detalle });
  console.log(`[${resultado}] ${prueba}: ${detalle}`);
}
function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}
async function pedir(metodo, ruta, cuerpo) {
  const respuesta = await fetch(BASE + ruta, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(7000),
  });
  const texto = await respuesta.text();
  let datos = null;
  if (texto) { try { datos = JSON.parse(texto); } catch { datos = texto; } }
  return { codigo: respuesta.status, datos };
}
async function hasta(condicion, maxMs = 5000) {
  const fin = Date.now() + maxMs;
  while (Date.now() < fin) {
    if (await condicion()) return true;
    await esperar(75);
  }
  return false;
}
function conectar() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const mensajes = [];
    const temporizador = setTimeout(() => reject(new Error(`Sin conexion WebSocket: ${WS_URL}`)), 6000);
    ws.addEventListener('message', (evento) => {
      try { mensajes.push(JSON.parse(String(evento.data))); } catch { /* mensaje no JSON */ }
    });
    ws.addEventListener('open', () => { clearTimeout(temporizador); resolve({ ws, mensajes }); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(temporizador); reject(new Error(`Error WebSocket: ${WS_URL}`)); }, { once: true });
  });
}
async function cerrar(conexion) {
  if (!conexion) return;
  const { ws } = conexion;
  if (ws.readyState === WebSocket.OPEN) ws.close();
  await hasta(() => ws.readyState === WebSocket.CLOSED, 1800);
}
function guardar() {
  const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), 'resultados');
  fs.mkdirSync(carpeta, { recursive: true });
  const archivo = path.join(carpeta, `cs-${ID}.json`);
  fs.writeFileSync(archivo, JSON.stringify({ requisito: 'RQ14', tarea: 'T4.5', arquitectura: 'cs', fecha: new Date().toISOString(), ejecucion: ID, resultados }, null, 2));
  console.log(`\nEvidencia: ${archivo}`);
}
async function main() {
  exigir(typeof WebSocket === 'function', 'Se requiere Node.js 22+ para WebSocket global.');
  console.log(`\nT4.5 Cliente-Servidor | ${BASE} | ejecucion ${ID}`);
  let conexion;
  try {
    const salud = await pedir('GET', '/tasks');
    exigir(salud.codigo === 200, 'El servidor 3000 no responde correctamente.');
    conexion = await conectar();
    exigir(await hasta(() => conexion.mensajes.some((m) => m.tipo === 'snapshot')), 'No llego el snapshot inicial.');
    anotar('Conexion inicial', 'OK', 'WebSocket conectado y snapshot recibido.');

    await cerrar(conexion);
    conexion = undefined;
    const tituloPerdida = `T4.5-CS-PERDIDA-${ID}`;
    const perdida = await pedir('POST', '/tasks', { titulo: tituloPerdida, descripcion: 'Creada mientras el cliente WS estaba desconectado' });
    exigir(perdida.codigo === 201 && perdida.datos?.id, 'No se pudo crear tarea durante la desconexion.');
    creadas.push(perdida.datos.id);
    anotar('Interrupcion de notificaciones', 'OBSERVADO', 'Se creo una tarea sin ningun cliente de prueba WebSocket conectado; no es perdida fisica de paquetes.');

    conexion = await conectar();
    exigir(await hasta(() => conexion.mensajes.some((m) => m.tipo === 'snapshot' && m.tareas?.some((t) => t.id === perdida.datos.id))), 'El snapshot tras reconectar no incluye la tarea creada.');
    anotar('Reconexion', 'RECUPERADO', 'Al reconectar manualmente se recibe snapshot con la tarea creada durante la desconexion.');

    const tituloDuplicado = `T4.5-CS-DUPLICADO-${ID}`;
    const d1 = await pedir('POST', '/tasks', { titulo: tituloDuplicado, descripcion: 'Duplicacion intencional' });
    const d2 = await pedir('POST', '/tasks', { titulo: tituloDuplicado, descripcion: 'Duplicacion intencional' });
    if (d1.datos?.id) creadas.push(d1.datos.id);
    if (d2.datos?.id) creadas.push(d2.datos.id);
    exigir(d1.codigo === 201 && d2.codigo === 201 && d1.datos?.id !== d2.datos?.id, 'Resultado inesperado al repetir el POST; revisar respuestas.');
    const recibidos = await hasta(() => conexion.mensajes.filter((m) => m.tipo === 'tarea:creada' && m.tarea?.titulo === tituloDuplicado).length >= 2);
    exigir(recibidos, 'No llegaron los dos eventos WebSocket de las solicitudes duplicadas.');
    anotar('Solicitudes duplicadas', 'NO_MITIGADO', 'Dos POST con igual contenido crean dos ID distintos y generan dos eventos; no existe clave de idempotencia.');
  } finally {
    await cerrar(conexion);
    for (const id of creadas) {
      try { const r = await pedir('DELETE', `/tasks/${id}`); console.log(`Limpieza ${id}: HTTP ${r.codigo}`); }
      catch (error) { console.warn(`No se pudo limpiar ${id}: ${error.message}`); }
    }
    guardar();
  }
}
main().catch((error) => { anotar('Ejecucion', 'ERROR', error.message); guardar(); process.exitCode = 1; });
