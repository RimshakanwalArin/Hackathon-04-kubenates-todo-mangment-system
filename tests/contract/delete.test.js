import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('DELETE /api/v1/todos/:id - Delete Todo', () => {
  let todoId;

  beforeEach(() => {
    TodoStore.clear();
    const todo = TodoStore.create('Test todo');
    todoId = todo.id;
  });

  it('should delete todo and return 204 No Content', async () => {
    const response = await request(app)
      .delete(`/api/v1/todos/${todoId}`)
      .expect(204);

    // Verify todo is actually deleted
    const todos = TodoStore.getAll();
    expect(todos).toHaveLength(0);
  });

  it('should return 404 when todo ID does not exist', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';
    const response = await request(app)
      .delete(`/api/v1/todos/${fakeId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('should return 400 with invalid UUID format', async () => {
    const response = await request(app)
      .delete('/api/v1/todos/not-a-uuid')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe('INVALID_UUID');
  });

  it('should delete from list of multiple todos', async () => {
    const todo2 = TodoStore.create('Second todo');
    const todo3 = TodoStore.create('Third todo');

    // Initial count
    expect(TodoStore.getAll()).toHaveLength(3);

    // Delete middle todo
    await request(app)
      .delete(`/api/v1/todos/${todo2.id}`)
      .expect(204);

    // Verify correct todo deleted
    const remaining = TodoStore.getAll();
    expect(remaining).toHaveLength(2);
    expect(remaining.map(t => t.id)).not.toContain(todo2.id);
    expect(remaining.map(t => t.id)).toEqual(expect.arrayContaining([todoId, todo3.id]));
  });

  it('should return 404 when deleting same ID twice', async () => {
    // First delete succeeds
    await request(app)
      .delete(`/api/v1/todos/${todoId}`)
      .expect(204);

    // Second delete fails
    const response = await request(app)
      .delete(`/api/v1/todos/${todoId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });
});
