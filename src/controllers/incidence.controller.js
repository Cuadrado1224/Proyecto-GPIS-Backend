import { Incidence, Product, ProductPhoto, User, Appeal, Notification } from "../models/index.js";

export const getAllIncidences = async (req, res) => {
  try {
    const incidences = await Incidence.findAll({
      include: [
        {
          model: Product,
          include: [{ model: ProductPhoto }]
        },
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email']
        },
        {
          model: Appeal,
          attributes: ['id', 'dateAppeals', 'description', 'incidenceId']
        }
      ]
    });
    res.json(incidences);
  } catch (error) {
    console.error("Error en getAllIncidences:", error);
    res.status(500).json({ message: "Error al obtener incidencias", error: error.message });
  }
};

export const getIncidenceById = async (req, res) => {
  try {
    const incidence = await Incidence.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          include: [{ model: ProductPhoto }]
        },
        {
          model: User,
          attributes: ['id', 'name', 'lastname', 'email']
        },
        {
          model: Appeal,
          attributes: ['id', 'dateAppeals', 'description', 'incidenceId']
        }
      ]
    });
    if (!incidence) return res.status(404).json({ message: "Incidencia no encontrada" });
    res.json(incidence);
  } catch (error) {
    console.error("Error en getIncidenceById:", error);
    res.status(500).json({ message: "Error al obtener la incidencia", error: error.message });
  }
};

export const getIncidencesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const incidences = await Incidence.findAll({ where: { userId } });
    res.json(incidences);
  } catch (error) {
    console.error("Error en getIncidencesByUser:", error);
    res.status(500).json({ message: "Error al obtener incidencias del usuario", error: error.message });
  }
};

export const createIncidence = async (req, res) => {
  try {
    const { description, userId, productId, status } = req.body;

    console.log('=== CREANDO INCIDENCIA ===');
    console.log('Datos recibidos:', { description, userId, productId, status });

    if (!description || !userId || !productId) {
      console.error('Faltan campos requeridos');
      return res.status(400).json({ message: "description, userId y productId son requeridos" });
    }

    const incidence = await Incidence.create({
      dateIncidence: new Date(),
      description,
      userId, // ahora representa moderador/administrador asignado
      productId,
      status: status || "pending",
    });

    console.log('✅ Incidencia creada exitosamente:', incidence.toJSON());

    res.status(201).json({ message: "Incidencia creada", incidence });
  } catch (error) {
    console.error("❌ Error en createIncidence:", error);
    res.status(500).json({ message: "Error al crear incidencia", error: error.message });
  }
};

export const updateIncidence = async (req, res) => {
  try {
    const incidenceId = req.params.id;
    const { description, status, productId, userId, resolution, resolutionNotes } = req.body;

    const incidence = await Incidence.findByPk(incidenceId, {
      include: [{ model: Product }]
    });
    if (!incidence) return res.status(404).json({ message: "Incidencia no encontrada" });

    // Preparar datos de actualización
    const updateData = {
      description: description !== undefined ? description : incidence.description,
      status: status !== undefined ? status : incidence.status,
      productId: productId !== undefined ? productId : incidence.productId,
      userId: userId !== undefined ? userId : incidence.userId,
    };

    // Si se está resolviendo la incidencia
    if (status === 'resolved' && resolution) {
      updateData.resolution = resolution;
      updateData.resolutionNotes = resolutionNotes || null;
      updateData.resolvedAt = new Date();

      // Crear notificación para el vendedor
      if (incidence.Product) {
        const sellerId = incidence.Product.sellerId;
        const productName = incidence.Product.title;
        
        let notificationTitle = '';
        let notificationMessage = '';
        
        switch (resolution) {
          case 'approved':
            notificationTitle = 'Producto Aprobado';
            notificationMessage = `Tu producto "${productName}" ha sido aprobado.`;
            break;
          case 'rejected':
            notificationTitle = 'Producto Rechazado';
            notificationMessage = `Tu producto "${productName}" ha sido rechazado.`;
            break;
          case 'suspended':
            notificationTitle = 'Producto Suspendido';
            notificationMessage = `Tu producto "${productName}" ha sido suspendido.`;
            break;
        }

        if (resolutionNotes) {
          notificationMessage += ` Observaciones: ${resolutionNotes}`;
        }

        await Notification.create({
          userId: sellerId,
          typeId: 2, // Alerta (notificación de moderación)
          title: notificationTitle,
          message: notificationMessage,
          read: false
        });
      }
    }

    await incidence.update(updateData);

    res.json({ message: "Incidencia actualizada", incidence });
  } catch (error) {
    console.error("Error en updateIncidence:", error);
    res.status(500).json({ message: "Error al actualizar incidencia", error: error.message });
  }
};

export const deleteIncidence = async (req, res) => {
  try {
    const incidenceId = req.params.id;
    const incidence = await Incidence.findByPk(incidenceId);
    if (!incidence) return res.status(404).json({ message: "Incidencia no encontrada" });

    await incidence.destroy();
    res.json({ message: "Incidencia eliminada", incidence });
  } catch (error) {
    console.error("Error en deleteIncidence:", error);
    res.status(500).json({ message: "Error al eliminar incidencia", error: error.message });
  }
};