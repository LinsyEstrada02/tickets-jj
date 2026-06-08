import DepartamentoSolicitante from "../../Modelos/departamento.solicitante/departamento_solicitante.js";
import SubDepartamentoSolicitante from "../../Modelos/departamento.solicitante/sub_departamento_solicitante.js";
import { Op } from "sequelize";

const norm = (v) => String(v ?? "").trim();
const normUpper = (v) => norm(v).toUpperCase();

/* ==========================
   LISTAR
========================== */
export const listarDepartamentos = async (req, res) => {
  try {
    const data = await DepartamentoSolicitante.findAll({
      include: [
        {
          model: SubDepartamentoSolicitante,
          as: "subDepartamentos",
          attributes: ["id", "nombre", "abreviatura", "activo", "departamentoId"],
          separate: true,
          order: [["nombre", "ASC"]],
        },
      ],
      order: [["nombre", "ASC"]],
    });

    return res.json(data);
  } catch (error) {
    console.error("listarDepartamentos:", error);
    return res.status(500).json({ error: "Error al listar departamentos" });
  }
};

/* ==========================
   OBTENER POR ID
========================== */
export const obtenerDepartamento = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const departamento = await DepartamentoSolicitante.findByPk(id, {
      include: [
        {
          model: SubDepartamentoSolicitante,
          as: "subDepartamentos",
          attributes: ["id", "nombre", "abreviatura", "activo", "departamentoId"],
          separate: true,
          order: [["nombre", "ASC"]],
        },
      ],
    });

    if (!departamento) {
      return res.status(404).json({ error: "Departamento no encontrado" });
    }

    return res.json(departamento);
  } catch (error) {
    console.error("obtenerDepartamento:", error);
    return res.status(500).json({ error: "Error al obtener departamento" });
  }
};

/* ==========================
   CREAR
========================== */
export const crearDepartamento = async (req, res) => {
  try {
    const nombre = norm(req.body?.nombre);
    const abreviatura = normUpper(req.body?.abreviatura);

    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!abreviatura) return res.status(400).json({ error: "La abreviatura es obligatoria" });

    const existe = await DepartamentoSolicitante.findOne({
      where: { [Op.or]: [{ nombre }, { abreviatura }] },
    });

    if (existe) {
      return res.status(409).json({
        error: "Ya existe un departamento con ese nombre o abreviatura",
      });
    }

    const now = new Date();

    const nuevo = await DepartamentoSolicitante.create({
      nombre,
      abreviatura,
      activo: req.body.activo ?? true,
      createdAt: now,
      updatedAt: now,
      createdByUserId: req.usuario?.id ?? null,
    });

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("crearDepartamento:", error);
    return res.status(500).json({ error: "Error al crear departamento" });
  }
};

/* ==========================
   ACTUALIZAR
========================== */
export const actualizarDepartamento = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const departamento = await DepartamentoSolicitante.findByPk(id);
    if (!departamento) {
      return res.status(404).json({ error: "Departamento no encontrado" });
    }

    const nombre = norm(req.body?.nombre);
    const abreviatura = normUpper(req.body?.abreviatura);
    const activo = req.body?.activo;

    if (!nombre || !abreviatura) {
      return res.status(400).json({
        error: "Nombre y abreviatura son obligatorios",
      });
    }

    const existe = await DepartamentoSolicitante.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [{ nombre }, { abreviatura }],
      },
    });

    if (existe) {
      return res.status(409).json({
        error: "Ya existe otro departamento con ese nombre o abreviatura",
      });
    }

    departamento.nombre = nombre;
    departamento.abreviatura = abreviatura;

    if (activo !== undefined && activo !== null) {
      departamento.activo =
        typeof activo === "boolean"
          ? activo
          : Boolean(Number(activo));
    }

    departamento.updatedAt = new Date();
    await departamento.save();

    return res.json(departamento);
  } catch (error) {
    console.error("actualizarDepartamento:", error);
    return res.status(500).json({ error: "Error al actualizar departamento" });
  }
};

/* ==========================
   CAMBIAR ESTADO (SOFT DELETE)
========================== */
export const cambiarEstadoDepartamento = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const departamento = await DepartamentoSolicitante.findByPk(id);
    if (!departamento) {
      return res.status(404).json({ error: "Departamento no encontrado" });
    }

    const { activo } = req.body;
    if (activo === undefined || activo === null) {
      return res.status(400).json({ error: "Debe enviar el campo 'activo' (0/1)." });
    }

    departamento.activo =
      typeof activo === "boolean"
        ? activo
        : Boolean(Number(activo));

    departamento.updatedAt = new Date();
    await departamento.save();

    return res.json({
      message: "Estado actualizado",
      activo: departamento.activo,
    });
  } catch (error) {
    console.error("cambiarEstadoDepartamento:", error);
    return res.status(500).json({ error: "Error al cambiar estado" });
  }
};