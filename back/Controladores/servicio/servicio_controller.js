import { Op } from "sequelize";
import CatalogoServicio from "../../Modelos/servicio/servicio.js";

// ⚠️ AJUSTA ESTA RUTA SI TU MODELO DE USUARIO ESTÁ EN OTRA PARTE
import Usuario from "../../Modelos/usuario/usuario.js";

const normalize = (s = "") => s.trim().replace(/\s+/g, " ");

const includeAuditoria = [
  { model: Usuario, as: "creadoPor", attributes: ["id", "nombre", "email"] },
  { model: Usuario, as: "actualizadoPor", attributes: ["id", "nombre", "email"] },
];

export const getAllCatalogoServicios = async (req, res) => {
  try {
    const { incluirInactivos } = req.query;
    const where = incluirInactivos === "true" ? {} : { activo: true };

    const data = await CatalogoServicio.findAll({
      where,
      include: includeAuditoria,
      order: [["servicio", "ASC"]],
    });

    return res.json(data);
  } catch (error) {
    console.error("getAllCatalogoServicios:", error);
    return res.status(500).json({ message: "Error al obtener catálogo de servicios." });
  }
};

export const getCatalogoServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await CatalogoServicio.findByPk(id, { include: includeAuditoria });

    if (!item) return res.status(404).json({ message: "Servicio no encontrado." });

    return res.json(item);
  } catch (error) {
    console.error("getCatalogoServicio:", error);
    return res.status(500).json({ message: "Error al obtener el servicio." });
  }
};

export const createCatalogoServicio = async (req, res) => {
  try {
    let { servicio } = req.body;
    servicio = normalize(servicio);

    if (!servicio) {
      return res.status(400).json({ message: "El campo 'servicio' es obligatorio." });
    }

    // Evitar duplicados (usando collation MySQL normalmente case-insensitive)
    const exists = await CatalogoServicio.findOne({
      where: { servicio: { [Op.like]: servicio } },
    });

    if (exists) return res.status(409).json({ message: "Ese servicio ya existe en el catálogo." });

    const userId = req.user?.id ?? null;

    const nuevo = await CatalogoServicio.create({
      servicio,
      createdByUserId: userId,
      updatedByUserId: userId,
    });

    const creado = await CatalogoServicio.findByPk(nuevo.id, { include: includeAuditoria });
    return res.status(201).json(creado);
  } catch (error) {
    console.error("createCatalogoServicio:", error);
    return res.status(500).json({ message: "Error al crear el servicio." });
  }
};

export const updateCatalogoServicio = async (req, res) => {
  try {
    const { id } = req.params;
    let { servicio, activo } = req.body;

    const item = await CatalogoServicio.findByPk(id);
    if (!item) return res.status(404).json({ message: "Servicio no encontrado." });

    if (servicio !== undefined) {
      servicio = normalize(servicio);
      if (!servicio) return res.status(400).json({ message: "El campo 'servicio' no puede ir vacío." });

      const dup = await CatalogoServicio.findOne({
        where: {
          servicio: { [Op.like]: servicio },
          id: { [Op.ne]: id },
        },
      });

      if (dup) return res.status(409).json({ message: "Ya existe otro servicio con ese nombre." });

      item.servicio = servicio;
    }

    if (activo !== undefined) item.activo = Boolean(activo);

    item.updatedByUserId = req.user?.id ?? null;
    await item.save();

    const actualizado = await CatalogoServicio.findByPk(id, { include: includeAuditoria });
    return res.json(actualizado);
  } catch (error) {
    console.error("updateCatalogoServicio:", error);
    return res.status(500).json({ message: "Error al actualizar el servicio." });
  }
};

export const toggleCatalogoServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await CatalogoServicio.findByPk(id);
    if (!item) return res.status(404).json({ message: "Servicio no encontrado." });

    item.activo = !item.activo;
    item.updatedByUserId = req.user?.id ?? null;
    await item.save();

    const actualizado = await CatalogoServicio.findByPk(id, { include: includeAuditoria });
    return res.json(actualizado);
  } catch (error) {
    console.error("toggleCatalogoServicio:", error);
    return res.status(500).json({ message: "Error al cambiar estado del servicio." });
  }
};

// Soft delete => desactiva
export const deleteCatalogoServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await CatalogoServicio.findByPk(id);
    if (!item) return res.status(404).json({ message: "Servicio no encontrado." });

    item.activo = false;
    item.updatedByUserId = req.user?.id ?? null;
    await item.save();

    return res.json({ message: "Servicio desactivado correctamente." });
  } catch (error) {
    console.error("deleteCatalogoServicio:", error);
    return res.status(500).json({ message: "Error al desactivar el servicio." });
  }
};