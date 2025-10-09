import BarrioModel from "../models/Barrio.model.js";

class BarriosManager {
    static async obtenerBarrios(req, res) {
        try {
            const barrios = await BarrioModel.find({}).lean();
            return res.status(200).json({ barrios });
        } catch (error) {
            return res.status(500).json({ error: 'Error buscando en barrios' });
        }
    }
    static async obtenerUnBarrio(req, res) {
        const { id } = req.params
        try {
            const barrio = await BarrioModel.findOne({ _id: id });
            if (!barrio) {
                return res.status(404).json({ error: `El barrio no existe` });
            }
            return res.status(200).json({ barrio });
        } catch (error) {
            return res.status(500).json({ error: 'Error buscando en barrios' });
        }
    }
    static async agregarBarrio(req, res) {
        const { nombre, observaciones } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre del barrio es obligatorio' });
        }
        try {
            const barrioExistente = await BarrioModel.findOne({ nombre: nombre });
            if (barrioExistente) {
                return res.status(400).json({ error: 'El barrio ya existe' });
            }
            const nuevoBarrio = new BarrioModel({ nombre, observaciones });
            await nuevoBarrio.save();
            return res.status(201).json({ success: 'Barrio agregado exitosamente', barrio: nuevoBarrio });
        } catch (error) {
            return res.status(500).json({ error: 'Error agregando barrio' });
        }
    }

    static async modificarBarrio(req, res) {
        const { id } = req.params
        const { nombre, observaciones } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre del barrio es obligatorio' });
        }
        try {
            const barrioActualizado = await BarrioModel.findByIdAndUpdate(
                id, 
                { nombre, observaciones }, 
                { new: true, runValidators: true });
            if (!barrioActualizado) {
                return res.status(404).json({ error: `El barrio no existe` });
            }
            return res.status(200).json({ success: 'Barrio actualizado correctamente', barrio: barrioActualizado });
        } catch (error) {
            return res.status(500).json({ error: 'Error modificando barrio' });
        }
    }

    static async eliminarBarrio(req, res) {
        const { id } = req.params;
        try {
            const barrioEliminado = await BarrioModel.findByIdAndDelete({ _id: id });
            if (!barrioEliminado) {
                return res.status(404).json({ error: `El barrio no existe` });
            }
            return res.status(200).json({ message: "Barrio eliminado exitosamente" });
        } catch (error) {
            return res.status(500).json({ error: 'Error eliminando barrio' });
        }
    }
}

export default BarriosManager
