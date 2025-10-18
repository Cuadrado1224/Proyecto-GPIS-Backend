import { Favorite, Product, User } from "../models/index.js";

// ===============================================
// Obtener todos los favoritos
// ===============================================
export const getAllFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.findAll({ 
      where: { userId },
      include: [
        {
          model: Product,
          include: [{ model: User, attributes: ['id', 'name', 'lastname'] }]
        }
      ]
    });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: "Error fetching favorites", error: error.message });
  }
};

// ===============================================
// Agregar producto a favoritos
// ===============================================
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId requerido" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const existingFavorite = await Favorite.findOne({ 
      where: { userId, productId } 
    });
    if (existingFavorite) {
      return res.status(400).json({ message: "Producto ya está en favoritos" });
    }

    const favorite = await Favorite.create({ userId, productId });
    res.status(201).json({ message: "Producto agregado a favoritos", favorite });
  } catch (error) {
    res.status(500).json({ message: "Error adding favorite", error: error.message });
  }
};

// ===============================================
// Eliminar producto de favoritos
// ===============================================
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "productId requerido" });
    }

    const favorite = await Favorite.findOne({ 
      where: { userId, productId } 
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorito no encontrado" });
    }

    await favorite.destroy();
    res.json({ message: "Producto eliminado de favoritos" });
  } catch (error) {
    res.status(500).json({ message: "Error removing favorite", error: error.message });
  }
};