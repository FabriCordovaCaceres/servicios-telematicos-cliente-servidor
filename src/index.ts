import path from "node:path";
import express from "express";
import taskRoutes from "./routes/task.routes";
import { iniciarWebSocket } from "./realtime/websocket";
import { cors } from "./http/cors";

const app = express();
const PORT = 3000;

app.use(cors);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    nombre: "Prototipo Cliente-Servidor",
    estado: "activo",
  });
});

// Página de demostración del tiempo real: http://<servidor>:3000/demo/
app.use("/demo", express.static(path.join(__dirname, "..", "public")));

app.use("/tasks", taskRoutes);

const server = app.listen(PORT, () => {
  console.log(
    `Cliente-Servidor iniciado correctamente en http://localhost:${PORT}`,
  );
});

// Sprint 2: canal WebSocket en ws://localhost:3000/ws
iniciarWebSocket(server);
