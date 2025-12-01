import Role from "../models/role.model.js";
import User from "../models/user.model.js";
import UserRole from "../models/userRole.model.js";
import Category from "../models/category.model.js";
import { NotificationType } from "../models/index.js";

export async function seedData() {
  try {
    console.log("🌱 Insertando datos iniciales...");

    // Roles
    await Role.bulkCreate(
      [
        { id: 1, roleName: "Administrador" },
        { id: 2, roleName: "Usuario" },
        { id: 3, roleName: "Moderador" }

      ],
      { ignoreDuplicates: true }
    );

    // Usuario Admin
    let email = "admin@shopybuy.com";
    await User.bulkCreate(
      [
        {
          id: 1,
          dni: "00000000",
          email: email,
          name: "Admin",
          lastname: "Admin",
          passwordHash:
            "$2b$10$b1c0c5afGkn2LcVcnBLLb.jugmRAc.utHMzNA2fJMhOjWU7lLG/F2",
          phone: "000000000",
          avatarUrl:
            "/uploads/common/user-common.png",
          rating: 5,
          ratingCount: 1,
          verified: true,

        },
      ],
      { ignoreDuplicates: true }
    );

    // Relación User-Role
    let user = await User.findOne({ where: { email } });
    let role = await Role.findOne({ where: { roleName: "Administrador" } });
    await UserRole.bulkCreate(
      [{ userId: user.id, roleId: role.id }],
      { ignoreDuplicates: true }
    );

    // Categorías principales y subcategorías
    const categories = [
      {
        name: "Electrónica",
        description: "Tecnología y dispositivos",
        subcategories: [
          { name: "Celulares y accesorios", description: "Smartphones, fundas, cargadores" },
          { name: "Computadoras y laptops", description: "PC, portátiles y accesorios" },
          { name: "Consolas y videojuegos", description: "Consolas, juegos y accesorios" },
          { name: "Audio", description: "Auriculares, parlantes, micrófonos" },
          { name: "Cámaras", description: "Fotografía y video" },
          { name: "Accesorios tecnológicos", description: "Cables, fundas, soportes" }
        ],
      },
      {
        name: "Moda",
        description: "Ropa y accesorios",
        subcategories: [
          { name: "Ropa de hombre", description: "Camisetas, pantalones, chaquetas" },
          { name: "Ropa de mujer", description: "Vestidos, blusas, faldas" },
          { name: "Zapatos", description: "Calzado para todas las edades" },
          { name: "Accesorios de moda", description: "Bolsos, bufandas, gafas, cinturones" },
          { name: "Joyería", description: "Collares, anillos y relojes" },
        ],
      },
      {
        name: "Hogar y muebles",
        description: "Muebles, decoración y más",
        subcategories: [
          { name: "Muebles de sala", description: "Sofás, mesas de centro" },
          { name: "Cocina", description: "Utensilios y electrodomésticos pequeños" },
          { name: "Decoración", description: "Cuadros, lámparas, adornos" },
          { name: "Electrodomésticos", description: "Licuadoras, aspiradoras, microondas" },
          { name: "Jardín", description: "Muebles y herramientas para exteriores" },
        ],
      },
      {
        name: "Deportes",
        description: "Equipos deportivos y fitness",
        subcategories: [
          { name: "Gimnasio", description: "Pesas, máquinas, accesorios fitness" },
          { name: "Ciclismo", description: "Bicicletas y repuestos" },
          { name: "Fútbol", description: "Balones, uniformes, calzado" },
          { name: "Camping", description: "Tiendas, mochilas, linternas" },
          { name: "Natación", description: "Trajes de baño, goggles, toallas" },
        ],
      },
      {
        name: "Vehículos",
        description: "Autos, motos y repuestos",
        subcategories: [
          { name: "Autos", description: "Vehículos nuevos y usados" },
          { name: "Motos", description: "Motocicletas y scooters" },
          { name: "Repuestos", description: "Partes y mantenimiento" },
          { name: "Accesorios para vehículos", description: "Tapetes, luces, GPS" },
          { name: "Llantas", description: "Neumáticos de todo tipo" },
        ],
      },
      {
        name: "Gaming",
        description: "Consolas, videojuegos y accesorios",
        subcategories: [
          { name: "Consolas", description: "PlayStation, Xbox, Nintendo" },
          { name: "Videojuegos", description: "Títulos físicos y digitales" },
          { name: "PC Gaming", description: "Equipos, periféricos y componentes" },
          { name: "Accesorios Gaming", description: "Teclados, sillas, headsets" },
          { name: "Mandos", description: "Controles y gamepads" },
        ],
      },
    ];



    for (const cat of categories) {
      const [category] = await Category.findOrCreate({
        where: { name: cat.name },
        defaults: {
          name: cat.name,
          description: cat.description,
          parentCategoryId: null,
        },
      });

      for (const sub of cat.subcategories) {
        await Category.findOrCreate({
          where: { name: sub.name },
          defaults: {
            name: sub.name,
            description: sub.description,
            parentCategoryId: category.id,
          },
        });
      }
    }

    await NotificationType.bulkCreate(
      [
        { id: 1, typeName: "Mensaje" },
        { id: 2, typeName: "Alerta" },
        { id: 3, typeName: "Recordatorio" },
      ],
      { ignoreDuplicates: true }
    );

    console.log("✅ Datos iniciales insertados correctamente");
  } catch (error) {
    console.error("❌ Error en seedData:", error);
  }
}
