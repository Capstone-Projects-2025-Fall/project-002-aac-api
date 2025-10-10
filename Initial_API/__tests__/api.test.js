const request = require('supertest');
const app = require('../index'); // Import your Express app

describe('Basic API Tests', () => {

  //this one should return false
  it('GET /test should return 200 and correct JSON', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      name: 'Test1',
      status: 'test'
    });
  });

  it('POST /test/:id with info should return 200 and message', async () => {
    const res = await request(app)
      .post('/test/123')
      .send({ info: 'hello' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      name: 'Test message with info: hello and ID: 123'
    });
  });

  it('POST /test/:id without info should return 418', async () => {
    const res = await request(app)
      .post('/test/123')
      .send({});
    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({ message: 'No info!' });
  });

});
