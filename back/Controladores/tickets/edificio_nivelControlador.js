import Edificio from "../../Modelos/tickets/edificio.js";
import Nivel    from "../../Modelos/tickets/nivel.js";

export const getEdificios = async (req, res) => {
  try {
    const edificios = await Edificio.findAll({ order: [["nombre", "ASC"]] });
    res.json(edificios);
  } catch (err) {
    console.error("Error al obtener edificios:", err);
    res.status(500).json({ error: "Error al obtener edificios." });
  }
};

export const getNiveles = async (req, res) => {
  try {
    const where = req.query.edificioId ? { id_edificio: req.query.edificioId } : {};
    const niveles = await Nivel.findAll({
      where,
      order: [["nombre", "ASC"]],
    });
    res.json(niveles);
  } catch (err) {
    console.error("Error al obtener niveles:", err);
    res.status(500).json({ error: "Error al obtener niveles." });
  }
};