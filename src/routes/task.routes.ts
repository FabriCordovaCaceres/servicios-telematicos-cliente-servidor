import { Router, type Request, type Response } from "express";
import type { TaskStatus } from "../models/task";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../services/task.service";

const router = Router();

const estadosValidos: TaskStatus[] = [
  "pendiente",
  "en_progreso",
  "finalizada",
];

// Listar todas las tareas
router.get("/", (_req: Request, res: Response) => {
  return res.json(getTasks());
});

// Obtener una tarea por ID
router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({
      mensaje: "ID de tarea inválido",
    });
  }

  const task = getTaskById(id);

  if (!task) {
    return res.status(404).json({
      mensaje: "Tarea no encontrada",
    });
  }

  return res.json(task);
});

// Crear una tarea
router.post("/", (req: Request, res: Response) => {
  const {
    titulo,
    descripcion = "",
    updatedBy = "cliente-servidor",
  } = req.body;

  if (!titulo || typeof titulo !== "string") {
    return res.status(400).json({
      mensaje: "El título es obligatorio",
    });
  }

  const task = createTask(
    titulo,
    descripcion,
    updatedBy,
  );

  return res.status(201).json(task);
});

// Editar una tarea
router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({
      mensaje: "ID de tarea inválido",
    });
  }

  const {
    titulo,
    descripcion,
    estado,
    updatedBy = "cliente-servidor",
  } = req.body;

  if (
    estado !== undefined &&
    !estadosValidos.includes(estado)
  ) {
    return res.status(400).json({
      mensaje: "Estado inválido",
    });
  }

  const task = updateTask(id, {
    titulo,
    descripcion,
    estado,
    updatedBy,
  });

  if (!task) {
    return res.status(404).json({
      mensaje: "Tarea no encontrada",
    });
  }

  return res.json(task);
});

// Eliminar una tarea
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({
      mensaje: "ID de tarea inválido",
    });
  }

  const deleted = deleteTask(id);

  if (!deleted) {
    return res.status(404).json({
      mensaje: "Tarea no encontrada",
    });
  }

  return res.status(204).send();
});

export default router;
