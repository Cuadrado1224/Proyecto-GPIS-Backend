import { Product, Category, User, ProductPhoto} from "../models/index.js";
import path from "path";
import fs from "fs";
import multer from "multer";

// =======================================================
// Configuración de Multer para fotos de productos
// =======================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tmpPath = path.join("uploads", "products", "tmp");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }
    cb(null, tmpPath);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Formato no permitido"), false);
}

export const uploadProductPhotos = multer({ storage, fileFilter });

// =======================================================
// Obtener todos los productos
// =======================================================
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: ProductPhoto }]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al recuperar productos", error: error.message });
  }
};

// =======================================================
// Obtener mis productos (por token)
// =======================================================
export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await Product.findAll({
      where: { sellerId: userId },
      include: [{ model: ProductPhoto }]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al recuperar mis productos", error: error.message });
  }
};

// =======================================================
// Obtener producto por ID
// =======================================================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductPhoto }]
    });
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al recuperar producto", error: error.message });
  }
};

// =======================================================
// Crear producto con fotos
// =======================================================
export const createProduct = async (req, res) => {
  try {
    const { title, description, price, categoryId, status = "active",location,locationCoords } = req.body;
    const sellerId = req.user.id; // del token

    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) return res.status(404).json({ message: "Categoría no encontrada" });

    const sellerExists = await User.findByPk(sellerId);
    if (!sellerExists) return res.status(404).json({ message: "Vendedor no encontrado" });

    // Crear producto
    const product = await Product.create({
      sellerId,
      title,
      description,
      price,
      categoryId,
      status,
      location,
      locationCoords: JSON.parse(locationCoords)
    });

    // Manejo de fotos
    if (req.files && req.files.length > 0) {
      const productFolder = path.join("uploads", "products", String(product.id));
      if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
      }

      const photoRecords = [];
      req.files.forEach((file, index) => {
        const finalPath = path.join(productFolder, file.filename);
        fs.renameSync(file.path, finalPath);

        photoRecords.push({
          productId: product.id,
          url: "/" + finalPath.replace(/\\/g, "/"),
          position: index + 1
        });
      });

      await ProductPhoto.bulkCreate(photoRecords);
    }

    res.status(201).json({ message: "Producto creado con éxito", product });
  } catch (error) {
    res.status(500).json({ message: "Error al crear producto", error: error.message });
  }
};

// =======================================================
// Actualizar producto
// =======================================================
export const updateProduct = async (req, res) => {
  try {
    const { title, description, price, categoryId, status,location,locationCoords } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const isAdmin = req.user?.roles?.includes("Administrador");
    if (!isAdmin && product.sellerId !== userId) {
      return res.status(403).json({ message: "No autorizado" });
    }

    if (categoryId) {
      const categoryExists = await Category.findByPk(categoryId);
      if (!categoryExists) return res.status(400).json({ message: "Categoría no válida" });
    }

    // Actualizar datos básicos
    await product.update({
      title: title || product.title,
      description: description || product.description,
      price: price || product.price,
      categoryId: categoryId || product.categoryId,
      status: status || product.status,
      location: location || product.location,
      locationCoords: locationCoords ? JSON.parse(locationCoords) : product.locationCoords
    });

    // =========================================
    // Manejo de fotos (si se enviaron nuevas)
    // =========================================
    if (req.files && req.files.length > 0) {
      const productFolder = path.join("uploads", "products", String(product.id));
      if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
      }

      // 1. Eliminar fotos antiguas de la DB
      await ProductPhoto.destroy({ where: { productId } });

      // 2. Eliminar fotos antiguas del disco
      if (fs.existsSync(productFolder)) {
        fs.rmSync(productFolder, { recursive: true, force: true });
        fs.mkdirSync(productFolder, { recursive: true }); // recrear vacío
      }

      // 3. Guardar las nuevas fotos
      const photoRecords = [];
      req.files.forEach((file, index) => {
        const finalPath = path.join(productFolder, file.filename);
        fs.renameSync(file.path, finalPath);

        photoRecords.push({
          productId: product.id,
          url: "/" + finalPath.replace(/\\/g, "/"),
          position: index + 1
        });
      });

      await ProductPhoto.bulkCreate(photoRecords);
    }

    res.json({ message: "Producto actualizado con éxito", product });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar producto", error: error.message });
  }
};


// =======================================================
// Actualizar estado de producto
// =======================================================
export const updateProductStatus = async (req, res) => {
  try {
    const status = req.body.status;
    const productId = req.params.id;
    const validStatuses = ["active", "sold", "inactive", "reserved"];

    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Status no válido" });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const userId = req.user.id;
    const isAdmin = req.user?.roles?.includes("Administrador");
    if (!isAdmin && product.sellerId !== userId) {
      return res.status(403).json({ message: "No autorizado" });
    }

    await product.update({ status });
    res.json({ message: "Status actualizado", newStatus: status, product });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el status", error: error.message });
  }
};

// =======================================================
// Eliminar producto + fotos
// =======================================================
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);

    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const userId = req.user.id;
    const isAdmin = req.user?.roles?.includes("Administrador");
    if (!isAdmin && product.sellerId !== userId) {
      return res.status(403).json({ message: "No autorizado" });
    }

    await ProductPhoto.destroy({ where: { productId } });

    const folder = path.join("uploads", "products", String(productId));
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    }

    await product.destroy();
    res.json({ message: "Producto eliminado", product });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto", error: error.message });
  }
};
