import ComercioModel from '../models/Comercio.model.js';
import BarrioModel from '../models/Barrio.model.js';
import moment from 'moment-timezone';
// import { requireAuth } from '../middleware/auth.js';

const FORMATO_FECHAS = 'YYYY-MM-DD';

class ComerciosManager {
    static async obtenerComercios(req, res) {
        try {
            const comercios = await ComercioModel.find({}).populate('barrio').lean();
            return res.status(200).json({ comercios });
        } catch (error) {
            return res.status(500).json({ error: 'Error buscando en comercios' });
        }
    }
    static async obtenerUnComercio(req, res) {
        const { id } = req.params;
        try {
            const comercio = await ComercioModel.findById(id).populate('barrio');
            if (!comercio) {
                return res.status(404).json({ error: 'El comercio no existe' });
            }
            return res.status(200).json({ comercio });
        } catch (error) {
            return res.status(500).json({ error: 'Error buscando en comercios' });
        }
    }

    static async agregarComercio(req, res) {
        const { nombre, calle, altura, piso, departamento, barrio, responsable, telefono, whatsapp, inicioContrato, contratoFirmado, deuda, observaciones } = req.body;
        if (!nombre || !calle || !altura || !barrio || !inicioContrato) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        const inicioContratoDate = moment.tz(inicioContrato, FORMATO_FECHAS, true, 'America/Argentina/Buenos_Aires');
        if (!inicioContratoDate.isValid()) {
            return res.status(400).json({ error: 'Formato de fecha inválida' });
        }
        if (inicioContratoDate > Date.now()) {
            return res.status(400).json({ error: 'La fecha de inicio de contrato no puede ser futura' });
        }
        if (telefono) {
            if (!/^[0-9]+$/.test(telefono)) {
                return res.status(400).json({ error: 'El número de telefono solo puede contener dígitos' });
            }
            if (telefono.length !== 10) {
                return res.status(400).json({ error: 'El número de telefono debe tener 10 dígitos' });
            }
        }
        if (whatsapp) {
            if (!/^[0-9]+$/.test(whatsapp)) {
                return res.status(400).json({ error: 'El número de WhatsApp solo puede contener dígitos' });
            }
            if (whatsapp.length !== 10) {
                return res.status(400).json({ error: 'El número de WhatsApp debe tener 10 dígitos' });
            }
        }
        try {
            // validar barrio
            const barrioExistente = await BarrioModel.findById(barrio);
            if (!barrioExistente) return res.status(400).json({ error: 'El barrio no existe' });

            // crear
            const nuevo = new ComercioModel({
                nombre,
                calle,
                altura,
                piso,
                departamento,
                barrio,
                responsable,
                telefono,
                whatsapp,
                inicioContrato: inicioContratoDate.toDate(),
                contratoFirmado,
                deuda,
                observaciones
            });
            await nuevo.save();
            return res.status(201).json({ success: 'Comercio agregado exitosamente', comercio: nuevo });
        } catch (error) {
            return res.status(500).json({ error: 'Error agregando comercio' });
        }
    }
    static async modificarComercio(req, res) {
        const { id } = req.params;
        const { nombre, calle, altura, piso, departamento, barrio, responsable, telefono, whatsapp, inicioContrato, contratoFirmado, deuda, observaciones } = req.body;

        let inicioContratoDate;
        if (typeof inicioContrato !== 'undefined') {
            inicioContratoDate = moment.tz(inicioContrato, FORMATO_FECHAS, true, 'America/Argentina/Buenos_Aires');
            if (!inicioContratoDate.isValid()) {
                return res.status(400).json({ error: 'Formato de fecha inválida' });
            }
        }
        if (telefono) {
            if (!/^[0-9]+$/.test(telefono)) {
                return res.status(400).json({ error: 'El número de telefono solo puede contener dígitos' });
            }
            if (telefono.length !== 10) {
                return res.status(400).json({ error: 'El número de telefono debe tener 10 dígitos' });
            }
        }
        if (whatsapp) {
            if (!/^[0-9]+$/.test(whatsapp)) {
                return res.status(400).json({ error: 'El número de WhatsApp solo puede contener dígitos' });
            }
            if (whatsapp.length !== 10) {
                return res.status(400).json({ error: 'El número de WhatsApp debe tener 10 dígitos' });
            }
        }
        try {
            // 1) Buscar comercio primero
            const comercioExistente = await ComercioModel.findById(id).populate('barrio').lean();
            if (!comercioExistente) return res.status(404).json({ error: 'El comercio no existe' });

            // 2) Validar barrio SOLO si viene en el body
            if (typeof barrio !== 'undefined') {
                const barrioExistente = await BarrioModel.findById(barrio).lean();
                if (!barrioExistente) return res.status(404).json({ error: 'El barrio no existe' });
            }

            // 3) Update
            await ComercioModel.findByIdAndUpdate(
                id,
                {
                    nombre,
                    calle,
                    altura,
                    piso,
                    departamento,
                    barrio,
                    responsable,
                    telefono,
                    whatsapp,
                    inicioContrato: inicioContratoDate ? inicioContratoDate.toDate() : undefined,
                    contratoFirmado,
                    deuda,
                    observaciones
                },
                { new: true, runValidators: true }
            );

            return res.status(200).json({ message: 'Comercio actualizado correctamente' });
        } catch (error) {
            return res.status(500).json({ error: 'Error actualizando comercio' });
        }
    }


    static async eliminarComercio(req, res) {
        const { id } = req.params;
        try {
            const comercioEliminado = await ComercioModel.findByIdAndDelete(id);
            if (!comercioEliminado) {
                return res.status(404).json({ error: 'El comercio no existe' });
            }
            return res.status(200).json({ message: 'Comercio eliminado exitosamente' });
        } catch (error) {
            return res.status(500).json({ error: 'Error eliminando comercio' });
        }
    }
}

export default ComerciosManager;