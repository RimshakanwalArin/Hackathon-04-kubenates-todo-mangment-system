import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('POST /api/v1/todos - Create Todo', () => {
  beforeEach(() => {
    TodoStore.clear();
  });

  it('should create a new todo and return 201 with todo object', async () => {
    const response = await request(app)
      .post('/api/v1/todos')
      .send({ title: 'Buy milk' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      title: 'Buy milk',
      completed: false
    });

    // Verify UUID format
    expect(response.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should return 400 with INVALID_TITLE error when title is empty', async () => {
    const response = await request(app)
      .post('/api/v1/todos')
      .send({ title: '' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('INVALID_TITLE');
  });

  it('should return 400 when title exceeds 500 characters', async () => {
    const longTitle = 'a'.repeat(501);
    const response = await request(app)
      .post('/api/v1/todos')
      .send({ title: longTitle })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe('INVALID_TITLE');
  });

  it('should create todos with unique IDs on concurrent requests', async () => {
    const promises = [
      request(app).post('/api/v1/todos').send({ title: 'Todo 1' }),
      request(app).post('/api/v1/todos').send({ title: 'Todo 2' }),
      request(app).post('/api/v1/todos').send({ title: 'Todo 3' })
    ];

    const responses = await Promise.all(promises);
    const ids = responses.map(r => r.body.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3); // All unique
  });

  it('should return 400 when title is missing', async () => {
    const response = await request(app)
      .post('/api/v1/todos')
      .send({})
      .expect(400);

    expect(response.body.code).toBe('INVALID_TITLE');
  });

  it('should trim whitespace from title', async () => {
    const response = await request(app)
      .post('/api/v1/todos')
      .send({ title: '  Buy milk  ' })
      .expect(201);

    expect(response.body.title).toBe('Buy milk');
  });
});
