/**
 * HELPERS para Tests
 * Funciones reutilizables para setup/teardown y datos de prueba
 */

import { sequelize, User, Role, UserRole } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt.js';

/**
 * Inichatcializa la base de datos de pruebas
 * Sincroniza modelos y crea roles por defecto
 */
export async function setupTestDatabase() {
  await sequelize.sync({ force: true });

  // Crear roles por defecto
  await Role.bulkCreate([
    { id: 1, roleName: 'student', description: 'Estudiante' },
    { id: 2, roleName: 'seller', description: 'Vendedor' },
    { id: 3, roleName: 'admin', description: 'Administrador' },
  ]);
}

/**
 * Limpia todas las tablas de la BD de pruebas
 */
export async function cleanupDatabase() {
  await UserRole.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  // No eliminamos roles porque son seed data
}

/**
 * Cierra la conexión a la base de datos
 */
export async function closeDatabase() {
  await sequelize.close();
}

/**
 * Crea un usuario de prueba con los datos proporcionados
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export async function createTestUser(userData = {}) {
  const defaultData = {
    dni: '1234567890',
    email: 'test@test.com',
    name: 'Test',
    lastname: 'User',
    password: 'password123',
    phone: '0987654321',
    roleId: 1,
    avatarUrl: '/uploads/common/user-common.png',
    rating: 0,
  };

  const data = { ...defaultData, ...userData };
  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    dni: data.dni,
    email: data.email,
    name: data.name,
    lastname: data.lastname,
    passwordHash,
    phone: data.phone,
    avatarUrl: data.avatarUrl,
    rating: data.rating,
  });

  if (data.roleId) {
    await UserRole.create({ userId: user.id, roleId: data.roleId });
  }

  return user;
}

/**
 * Genera un token JWT para un usuario de prueba
 * @param {Object} user - Usuario para el que generar token
 * @param {Array<string>} roles - Roles del usuario
 * @returns {string} Token JWT
 */
export function generateTestToken(user, roles = ['student']) {
  return generateToken({
    id: user.id,
    email: user.email,
    roles,
  });
}

/**
 * Crea un usuario admin de prueba y retorna su token
 * @returns {Promise<{user: Object, token: string}>}
 */
export async function createAdminWithToken() {
  const admin = await createTestUser({
    dni: '0000000000',
    email: 'admin@test.com',
    name: 'Admin',
    lastname: 'User',
    password: 'admin123',
    phone: '0900000000',
    roleId: 3,
  });

  const token = generateTestToken(admin, ['admin']);

  return { user: admin, token };
}

/**
 * Mock de req y res para tests unitarios
 */
export function createMockReqRes() {
  const mockReq = {
    params: {},
    body: {},
    query: {},
    user: {},
    headers: {},
    file: null,
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  return { mockReq, mockRes };
}

/**
 * Espera un tiempo determinado (útil para tests asíncronos)
 * @param {number} ms - Milisegundos a esperar
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
