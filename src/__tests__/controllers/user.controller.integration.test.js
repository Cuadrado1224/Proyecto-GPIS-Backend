
import request from 'supertest';
import app from '../../app.js';
import { sequelize, User, Role, UserRole } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt.js';

describe('User Controller - Integration Tests', () => {
  // Setup: crear DB y datos antes de los tests
  beforeAll(async () => {
    
    await sequelize.sync({ force: true });

    // Seed: crear roles iniciales
    await Role.bulkCreate([
      { id: 1, roleName: 'student', description: 'Estudiante' },
      { id: 2, roleName: 'seller', description: 'Vendedor' },
      { id: 3, roleName: 'admin', description: 'Administrador' },
    ]);
  });

  // Cleanup: limpiar usuarios entre tests
  beforeEach(async () => {
    await UserRole.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  // Cerrar conexión después de todos los tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /users/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const newUser = {
        dni: '1234567890',
        email: 'nuevo@test.com',
        name: 'Nuevo',
        lastname: 'Usuario',
        password: 'password123',
        phone: '0987654321',
        roleId: 1,
      };

      const res = await request(app)
        .post('/users/register')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Usuario registrado');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('nuevo@test.com');
      expect(res.body.user).not.toHaveProperty('passwordHash'); // no debe exponer password

      // Verificar que se creó en la DB
      const userInDb = await User.findOne({ where: { email: 'nuevo@test.com' } });
      expect(userInDb).not.toBeNull();
      expect(userInDb.name).toBe('Nuevo');
    });

    it('debería rechazar registro con email duplicado', async () => {
      // Crear usuario previo
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        dni: '1111111111',
        email: 'existente@test.com',
        name: 'Existente',
        lastname: 'Usuario',
        passwordHash,
        phone: '0999999999',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });

      // Intentar registrar con mismo email
      const duplicateUser = {
        dni: '2222222222',
        email: 'existente@test.com', // mismo email
        name: 'Duplicado',
        lastname: 'Usuario',
        password: 'password456',
        phone: '0988888888',
        roleId: 1,
      };

      const res = await request(app)
        .post('/users/register')
        .send(duplicateUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email ya registrado');
    });

    it('debería rechazar registro con DNI duplicado', async () => {
      // Crear usuario previo
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        dni: '1234567890',
        email: 'usuario1@test.com',
        name: 'Usuario',
        lastname: 'Uno',
        passwordHash,
        phone: '0999999999',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });

      // Intentar registrar con mismo DNI
      const duplicateDniUser = {
        dni: '1234567890', // mismo DNI
        email: 'usuario2@test.com',
        name: 'Usuario',
        lastname: 'Dos',
        password: 'password456',
        phone: '0988888888',
        roleId: 1,
      };

      const res = await request(app)
        .post('/users/register')
        .send(duplicateDniUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('DNI ya registrado');
    });

    it('debería rechazar registro con rol inválido', async () => {
      const userInvalidRole = {
        dni: '9999999999',
        email: 'invalido@test.com',
        name: 'Invalido',
        lastname: 'Rol',
        password: 'password123',
        phone: '0987654321',
        roleId: 999, // rol inexistente
      };

      const res = await request(app)
        .post('/users/register')
        .send(userInvalidRole);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Rol no válido');
    });
  });

  describe('POST /users/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await User.create({
        dni: '1234567890',
        email: 'login@test.com',
        name: 'Login',
        lastname: 'Test',
        passwordHash,
        phone: '0987654321',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });

      await UserRole.create({ userId: user.id, roleId: 1 });
    });

    it('debería hacer login exitoso con credenciales correctas', async () => {
      const credentials = {
        email: 'login@test.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/users/login')
        .send(credentials);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('debería rechazar login con email inexistente', async () => {
      const credentials = {
        email: 'noexiste@test.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/users/login')
        .send(credentials);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Usuario no encontrado');
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      const credentials = {
        email: 'login@test.com',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/users/login')
        .send(credentials);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Contraseña incorrecta');
    });
  });

  describe('GET /users/ (con autenticación)', () => {
    let authToken;

    beforeEach(async () => {
      // Crear usuario administrador
      const passwordHash = await bcrypt.hash('admin123', 10);
      const adminUser = await User.create({
        dni: '0000000000',
        email: 'admin@test.com',
        name: 'Admin',
        lastname: 'User',
        passwordHash,
        phone: '0900000000',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });

      await UserRole.create({ userId: adminUser.id, roleId: 3 });

      // Generar token
      authToken = generateToken({
        id: adminUser.id,
        email: adminUser.email,
        roles: ['admin'],
      });

      // Crear usuarios de prueba
      const user1Hash = await bcrypt.hash('password', 10);
      const user1 = await User.create({
        dni: '1111111111',
        email: 'user1@test.com',
        name: 'User',
        lastname: 'One',
        passwordHash: user1Hash,
        phone: '0911111111',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });
      await UserRole.create({ userId: user1.id, roleId: 1 });

      const user2Hash = await bcrypt.hash('password2', 10);
      const user2 = await User.create({
        dni: '2222222222',
        email: 'user2@test.com',
        name: 'User',
        lastname: 'Two',
        passwordHash: user2Hash,
        phone: '0922222222',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });
      await UserRole.create({ userId: user2.id, roleId: 2 });
    });

    it('debería retornar todos los usuarios con token válido', async () => {
      const res = await request(app)
        .get('/users/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // admin + 2 users
    });

    it('debería rechazar petición sin token', async () => {
      const res = await request(app).get('/users/');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token requerido');
    });

    it('debería rechazar petición con token inválido', async () => {
      const res = await request(app)
        .get('/users/')
        .set('Authorization', 'Bearer tokeninvalido123');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token inválido');
    });
  });

  describe('GET /users/:id (con autenticación)', () => {
    let authToken;
    let testUserId;

    beforeEach(async () => {
      // Crear usuario de prueba
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await User.create({
        dni: '1234567890',
        email: 'getbyid@test.com',
        name: 'GetById',
        lastname: 'Test',
        passwordHash,
        phone: '0987654321',
        avatarUrl: '/uploads/common/user-common.png',
        rating: 0,
      });

      testUserId = user.id;
      await UserRole.create({ userId: user.id, roleId: 1 });

      // Generar token
      authToken = generateToken({
        id: user.id,
        email: user.email,
        roles: ['student'],
      });
    });

    it('debería retornar un usuario específico por ID', async () => {
      const res = await request(app)
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testUserId);
      expect(res.body.email).toBe('getbyid@test.com');
      expect(res.body.name).toBe('GetById');
    });

    it('debería retornar 404 para usuario inexistente', async () => {
      const res = await request(app)
        .get('/users/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Usuario no encontrado');
    });
  });
});
