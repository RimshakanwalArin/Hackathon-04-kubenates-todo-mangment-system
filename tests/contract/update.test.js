import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('PUT /api/v1/todos/:id - Update Todo', () => {
  let todoId;

  beforeEach(() => {
    TodoStore.clear();
    const todo = TodoStore.create('Test todo');
    todoId = todo.id;
  });

  it('should update todo and return 200 with updated todo', async () => {
    const response = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .send({ completed: true })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      id: todoId,
      title: 'Test todo',
      completed: true
    });
  });

  it('should return 404 when todo ID does not exist', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';
    const response = await request(app)
      .put(`/api/v1/todos/${fakeId}`)
      .send({ completed: true })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('should toggle completed status from false to true and back', async () => {
    // Toggle to true
    let response = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .send({ completed: true })
      .expect(200);

    expect(response.body.completed).toBe(true);

    // Toggle back to false
    response = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .send({ completed: false })
      .expect(200);

    expect(response.body.completed).toBe(false);
  });

  it('should return 400 with invalid UUID format', async () => {
    const response = await request(app)
      .put('/api/v1/todos/not-a-uuid')
      .send({ completed: true })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe('INVALID_UUID');
  });

  it('should return 400 when completed is not a boolean', async () => {
    const response = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .send({ completed: 'yes' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe('INVALID_TYPE');
  });

  it('should return 400 when completed is missing', async () => {
    const response = await request(app)
      .put(`/api/v1/todos/${todoId}`)
      .send({})
      .expect(400);

    expect(response.body.code).toBe('INVALID_TYPE');
  });
});
