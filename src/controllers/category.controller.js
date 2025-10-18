import { Category } from "../models/index.js";

import sequelize from "../config/database.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error("Error en getAllCategories:", error);
    res.status(500).json({ 
      message: "Error al buscar categorías", 
      error: error.message 
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Categoría no encontrada" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar categorías", error: error.message });
  }
};

export const getMainCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: {parentCategoryId: null}, 
    include: [{ model: Category, as: "subcategories", attributes: ['id', 'name', 'description']}] });

    res.json(categories);
  } catch (error) {
    res.status(500).json({message: "Error al recuperar categorías principales", error: error.message });
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const {  parentId } = req.params;

    const subcategories = await Category.findAll({ where: { parentCategoryId: parentId },
    include: [{ model: Category, as: "subcategories", attributes: ['id', 'name'] }] });

    res.json(subcategories);
  } catch (error) {
    res.status(500).json({message: "Error al recuperar subcategorías", error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try{
     const { name, description, parentCategoryId } = req.body;

     if (!name || !description) {
       return res.status(400).json({message: "Nombre y descripción son requeridos"});
     }

     // Validar que el nombre no exista
     const categoryNameExists = await Category.findOne({where: {name}});
     if(categoryNameExists) {
       return res.status(400).json({message: "Categoría ya existe"});
     }

     // Validar categoría padre si se especifica
     if(parentCategoryId){
       const parentCategory = await Category.findByPk(parentCategoryId);
       if(!parentCategory) {
         return res.status(400).json({message: "Categoría padre no válida"});
       }
     }

     // Crear la categoría
     const category = await Category.create({
       name,
       description,
       parentCategoryId: parentCategoryId || null
     });

     res.status(201).json({
       message: "Categoría creada de forma exitosa", 
       category
     });

  } catch(error) {
    console.error("Error en createCategory:", error);
    res.status(500).json({ 
      message: "Error al crear categoría", 
      error: error.message 
    });
  }
};

export const updateCategory = async (req, res) => {  
  try {
    const { name, description, parentCategoryId } = req.body;
    const categoryId = req.params.id;

    const category = await Category.findByPk(categoryId);

    if(!category) return res.status(404).json({message: "Categoría no encontrada"});

    if(parentCategoryId){
      const parentExists = await Category.findByPk(parentCategoryId);
      if(!parentExists) return res.status(404).json({message: "Categoría padre no encontrada"});
      
      if(parseInt(parentCategoryId) === parseInt(categoryId)) {
        return res.status(400).json({message: "Una categoría no puede ser su propia categoría padre"});
      }
    }

    await category.update({ 
      name: name || category.name, 
      description: description || category.description,
      parentCategoryId: parentCategoryId !== undefined ? parentCategoryId : category.parentCategoryId
    });
    
    res.json({ message: "Categoría actualizada", category });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la categoria", error: error.message });
  }
};
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findByPk(categoryId);

    if(!category) return res.status(404).json({message: "Categoría no encontrada"});

    const subcategories = await Category.findAll({where: {parentCategoryId: categoryId}});
    if(subcategories.length > 0) {
      return res.status(400).json({ 
        message: "No se puede eliminar una categoría con subcategorías", 
        subcategoriesCount: subcategories.length
      });
    }
      
    // Comentamos esta validación por ahora ya que Product no está importado
    // const products = await Product.findAll({ where: {categoryId} });
    // if(products.length > 0) return res.status(400).json({message: "No se puede eliminar una categoría con productos", productsCount: products.length});

    await category.destroy();
    res.json({ message: "Categoría eliminada", category });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar categoría", error: error.message});
  }
};
