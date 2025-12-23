import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('GET /api/v1/todos - List Todos', () => {
  beforeEach(() => {
    TodoStore.clear();
  });

  it('should return 200 with array of todos', async () => {
    // Create some todos
    TodoStore.create('Todo 1');
    TodoStore.create('Todo 2');
    TodoStore.create('Todo 3');

    const response = await request(app)
      .get('/api/v1/todos')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('completed');
  });

  it('should return 200 with empty array when no todos exist', async () => {
    const response = await request(app)
      .get('/api/v1/todos')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  it('should return todos with mixed completed states', async () => {
    const todo1 = TodoStore.create('Done todo');
    const todo2 = TodoStore.create('Pending todo');

    // Mark first as done
    TodoStore.update(todo1.id, { completed: true });

    const response = await request(app)
      .get('/api/v1/todos')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].completed).toBe(true);
    expect(response.body[1].completed).toBe(false);
  });

  it('should include all required fields in response', async () => {
    TodoStore.create('Test todo');

    const response = await request(app)
      .get('/api/v1/todos')
      .expect(200);

    const todo = response.body[0];
    expect(todo).toHaveProperty('id');
    expect(todo).toHaveProperty('title');
    expect(todo).toHaveProperty('completed');
    expect(Object.keys(todo)).toHaveLength(3);
  });
});
