import express from "express";
import taskRoutes from "./routes/task.routes";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    nombre: "Prototipo Cliente-Servidor",
    estado: "activo",
  });
});

app.use("/tasks", taskRoutes);

app.listen(PORT, () => {
  console.log(
    `Cliente-Servidor iniciado correctamente en http://localhost:${PORT}`,
  );
});
