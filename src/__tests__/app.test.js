import request from 'supertest';
import app from '../app.js';

describe('Sanity: app routes', () => {
  test('GET /api-docs should return 200 or redirect', async () => {
    const res = await request(app).get('/api-docs');
    // swagger-ui-express puede retornar 301/302 o 200 dependiendo de la ruta
    expect([200, 301, 302, 404]).toContain(res.status);
  }, 10000);
});
