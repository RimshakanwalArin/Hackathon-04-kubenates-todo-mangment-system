import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('POST /api/v1/chat - Chat Intent Mapping', () => {
  beforeEach(() => {
    TodoStore.clear();
  });

  describe('CREATE_TODO Intent', () => {
    it('should recognize "add" keyword and create todo', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'add Buy groceries' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        intent: 'CREATE_TODO',
        status: 'SUCCESS',
        result: expect.objectContaining({
          title: expect.any(String),
          id: expect.any(String),
          completed: false
        })
      });
    });

    it('should recognize "create" keyword and create todo', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'create new task' })
        .expect(200);

      expect(response.body.intent).toBe('CREATE_TODO');
      expect(response.body.status).toBe('SUCCESS');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.code).toBe('INVALID_TYPE');
    });

    it('should return 400 when message is not a string', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 123 })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.code).toBe('INVALID_TYPE');
    });
  });

  describe('LIST_TODOS Intent', () => {
    it('should recognize "list" keyword and return todos', async () => {
      TodoStore.create('Todo 1');
      TodoStore.create('Todo 2');

      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'list my todos' })
        .expect(200);

      expect(response.body).toEqual({
        intent: 'LIST_TODOS',
        status: 'SUCCESS',
        result: expect.arrayContaining([
          expect.objectContaining({ title: 'Todo 1' }),
          expect.objectContaining({ title: 'Todo 2' })
        ])
      });
    });

    it('should recognize "show" keyword', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'show all todos' })
        .expect(200);

      expect(response.body.intent).toBe('LIST_TODOS');
      expect(response.body.status).toBe('SUCCESS');
      expect(Array.isArray(response.body.result)).toBe(true);
    });

    it('should return empty array when no todos exist', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'list todos' })
        .expect(200);

      expect(response.body.result).toEqual([]);
    });
  });

  describe('UPDATE_TODO Intent', () => {
    it('should recognize "mark" keyword and attempt update', async () => {
      const todo = TodoStore.create('Test todo');

      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: `mark ${todo.id} done` })
        .expect(200);

      expect(response.body).toEqual({
        intent: 'UPDATE_TODO',
        status: 'SUCCESS',
        result: expect.objectContaining({
          id: todo.id,
          completed: true
        })
      });
    });

    it('should recognize "done" keyword', async () => {
      const todo = TodoStore.create('Test todo');

      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: `done ${todo.id}` })
        .expect(200);

      expect(response.body.intent).toBe('UPDATE_TODO');
      expect(response.body.status).toBe('SUCCESS');
    });

    it('should return error when todo ID not found', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'mark 550e8400-e29b-41d4-a716-446655440000 done' })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE_TODO Intent', () => {
    it('should recognize "delete" keyword and attempt deletion', async () => {
      const todo = TodoStore.create('Test todo');

      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: `delete ${todo.id}` })
        .expect(200);

      expect(response.body).toEqual({
        intent: 'DELETE_TODO',
        status: 'SUCCESS',
        result: expect.objectContaining({
          success: true,
          id: todo.id
        })
      });
    });

    it('should recognize "remove" keyword', async () => {
      const todo = TodoStore.create('Test todo');

      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: `remove ${todo.id}` })
        .expect(200);

      expect(response.body.intent).toBe('DELETE_TODO');
      expect(response.body.status).toBe('SUCCESS');
    });

    it('should return error when todo not found', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'delete 550e8400-e29b-41d4-a716-446655440000' })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('UNKNOWN Intent', () => {
    it('should return UNKNOWN intent when no keywords match', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'hello world' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        intent: 'UNKNOWN',
        status: 'FAILED',
        error: expect.any(String)
      });
    });

    it('should provide error message for unknown intents', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'foobar baz qux' })
        .expect(200);

      expect(response.body.intent).toBe('UNKNOWN');
      expect(response.body.error).toBeDefined();
      expect(response.body.error.length).toBeGreaterThan(0);
    });
  });

  describe('Case Insensitivity', () => {
    it('should recognize keywords regardless of case', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'ADD Buy milk' })
        .expect(200);

      expect(response.body.intent).toBe('CREATE_TODO');
      expect(response.body.status).toBe('SUCCESS');
    });

    it('should handle mixed case messages', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'LiSt AlL tOdOs' })
        .expect(200);

      expect(response.body.intent).toBe('LIST_TODOS');
      expect(response.body.status).toBe('SUCCESS');
    });
  });
});
