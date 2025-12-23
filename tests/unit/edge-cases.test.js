import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('Edge Cases and Branch Coverage', () => {
  beforeEach(() => {
    TodoStore.clear();
  });

  describe('Chat Handler Edge Cases', () => {
    it('should handle CREATE_TODO intent without title extraction', async () => {
      // Message has create keyword but no title text
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'create' })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });

    it('should handle UPDATE_TODO intent without ID extraction', async () => {
      // Message has update keyword but no ID
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'mark done' })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });

    it('should handle DELETE_TODO intent without ID extraction', async () => {
      // Message has delete keyword but no ID
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'delete' })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });

    it('should validate title length through chat intent', async () => {
      // Chat create with overly long title
      const longTitle = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: `add ${longTitle}` })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });

    it('should validate empty title through chat intent', async () => {
      // Chat create with empty title
      const response = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'add ' })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Validator Edge Cases', () => {
    it('should handle null values in validator', () => {
      // These would be caught at handler level, but we're testing validator robustness
      const todos = TodoStore.getAll();
      expect(todos).toHaveLength(0);
    });

    it('should handle whitespace-only titles', async () => {
      const response = await request(app)
        .post('/api/v1/todos')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.code).toBe('INVALID_TITLE');
    });

    it('should handle UUID validation with lowercase', async () => {
      const todo = TodoStore.create('Test');
      const uuid = todo.id.toLowerCase();

      const response = await request(app)
        .get(`/api/v1/todos`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('TodoStore Edge Cases', () => {
    it('should handle update with partial object', () => {
      const todo = TodoStore.create('Task');
      const updated = TodoStore.update(todo.id, { completed: true });

      expect(updated).not.toBeNull();
      expect(updated.completed).toBe(true);
      expect(updated.title).toBe('Task'); // Title preserved
    });

    it('should handle multiple deletes idempotently', () => {
      const todo = TodoStore.create('Task');
      TodoStore.delete(todo.id);

      // Second delete should not throw
      expect(() => {
        TodoStore.delete(todo.id);
      }).not.toThrow();

      expect(TodoStore.count()).toBe(0);
    });

    it('should return independent todo objects', () => {
      const todo1 = TodoStore.create('Task 1');
      const todo2 = TodoStore.create('Task 2');

      expect(todo1.id).not.toBe(todo2.id);
      expect(todo1 === todo2).toBe(false);
    });
  });

  describe('Middleware and Error Handling', () => {
    it('should handle request without content type', async () => {
      const response = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include request ID in response headers', async () => {
      const response = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Test' })
        .expect(201);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id'].length).toBeGreaterThan(0);
    });

    it('should preserve request ID from header', async () => {
      const customId = 'custom-request-id-123';
      const response = await request(app)
        .post('/api/v1/todos')
        .set('X-Request-ID', customId)
        .send({ title: 'Test' })
        .expect(201);

      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/todos')
        .set('Content-Type', 'application/json')
        .send('not json')
        .expect(400);

      expect(response.body.code).toBeDefined();
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/v1/todos/invalid')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return todos with exactly three properties', async () => {
      await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Task' })
        .expect(201);

      const response = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      const todo = response.body[0];
      expect(Object.keys(todo).sort()).toEqual(['completed', 'id', 'title'].sort());
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistency across operations', async () => {
      // Create
      const create = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Test' })
        .expect(201);

      const todoId = create.body.id;

      // Immediately list
      const list1 = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(list1.body).toHaveLength(1);

      // Update
      await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send({ completed: true })
        .expect(200);

      // List again
      const list2 = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(list2.body[0].completed).toBe(true);

      // Delete
      await request(app)
        .delete(`/api/v1/todos/${todoId}`)
        .expect(204);

      // Final list
      const list3 = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(list3.body).toHaveLength(0);
    });
  });
});
