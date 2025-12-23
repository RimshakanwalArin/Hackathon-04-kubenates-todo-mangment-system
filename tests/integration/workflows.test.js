import request from 'supertest';
import app from '../../src/app.js';
import TodoStore from '../../src/models/TodoStore.js';

describe('Integration Tests - Multi-step Workflows', () => {
  beforeEach(() => {
    TodoStore.clear();
  });

  describe('Complete Todo Lifecycle', () => {
    it('should create, list, mark complete, and delete a todo', async () => {
      // Step 1: Create a todo
      const createResponse = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Integration test task' })
        .expect(201);

      const todoId = createResponse.body.id;
      expect(createResponse.body.title).toBe('Integration test task');
      expect(createResponse.body.completed).toBe(false);

      // Step 2: List todos and verify it's there
      const listResponse = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(todoId);

      // Step 3: Mark as complete
      const updateResponse = await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send({ completed: true })
        .expect(200);

      expect(updateResponse.body.completed).toBe(true);

      // Step 4: Verify updated state in list
      const listAgain = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(listAgain.body[0].completed).toBe(true);

      // Step 5: Delete the todo
      await request(app)
        .delete(`/api/v1/todos/${todoId}`)
        .expect(204);

      // Step 6: Verify deletion
      const finalList = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(finalList.body).toHaveLength(0);
    });
  });

  describe('Chat-driven Todo Management', () => {
    it('should create todo via chat and manage via REST', async () => {
      // Step 1: Create via chat
      const chatResponse = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'add Buy groceries' })
        .expect(200);

      expect(chatResponse.body.intent).toBe('CREATE_TODO');
      expect(chatResponse.body.status).toBe('SUCCESS');
      const todoId = chatResponse.body.result.id;

      // Step 2: Verify via REST GET
      const getResponse = await request(app)
        .get(`/api/v1/todos`)
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].id).toBe(todoId);

      // Step 3: Update via REST
      await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send({ completed: true })
        .expect(200);

      // Step 4: List via chat
      const listChatResponse = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'list todos' })
        .expect(200);

      expect(listChatResponse.body.intent).toBe('LIST_TODOS');
      expect(listChatResponse.body.result).toHaveLength(1);
      expect(listChatResponse.body.result[0].completed).toBe(true);

      // Step 5: Delete via chat
      const deleteChatResponse = await request(app)
        .post('/api/v1/chat')
        .send({ message: `delete ${todoId}` })
        .expect(200);

      expect(deleteChatResponse.body.intent).toBe('DELETE_TODO');
      expect(deleteChatResponse.body.status).toBe('SUCCESS');

      // Step 6: Verify empty list
      const emptyList = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(emptyList.body).toHaveLength(0);
    });

    it('should create multiple todos and list them all', async () => {
      // Create todos via REST
      const todo1 = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'First task' })
        .expect(201);

      const todo2 = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Second task' })
        .expect(201);

      // Mark one as complete
      await request(app)
        .put(`/api/v1/todos/${todo1.body.id}`)
        .send({ completed: true })
        .expect(200);

      // List via chat
      const listChat = await request(app)
        .post('/api/v1/chat')
        .send({ message: 'show my todos' })
        .expect(200);

      expect(listChat.body.result).toHaveLength(2);
      const completed = listChat.body.result.find(t => t.completed);
      const pending = listChat.body.result.find(t => !t.completed);

      expect(completed.title).toBe('First task');
      expect(pending.title).toBe('Second task');
    });
  });

  describe('Error Handling Across Workflow', () => {
    it('should handle error in middle of workflow', async () => {
      // Step 1: Create valid todo
      const createResponse = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Valid task' })
        .expect(201);

      const todoId = createResponse.body.id;

      // Step 2: Try invalid update
      await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send({ completed: 'not-boolean' })
        .expect(400);

      // Step 3: Verify todo still exists and is unchanged
      const getResponse = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].completed).toBe(false);

      // Step 4: Continue with valid operation
      const validUpdate = await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send({ completed: true })
        .expect(200);

      expect(validUpdate.body.completed).toBe(true);
    });

    it('should fail gracefully when updating non-existent todo', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      // Attempt update
      await request(app)
        .put(`/api/v1/todos/${fakeId}`)
        .send({ completed: true })
        .expect(404);

      // Verify store is still empty
      const listResponse = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(listResponse.body).toHaveLength(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent creates correctly', async () => {
      // Create 3 todos concurrently
      const promises = [
        request(app)
          .post('/api/v1/todos')
          .send({ title: 'Task 1' }),
        request(app)
          .post('/api/v1/todos')
          .send({ title: 'Task 2' }),
        request(app)
          .post('/api/v1/todos')
          .send({ title: 'Task 3' })
      ];

      const responses = await Promise.all(promises);

      // Verify all succeeded
      responses.forEach(res => {
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
      });

      // Verify all are unique
      const ids = responses.map(r => r.body.id);
      expect(new Set(ids).size).toBe(3);

      // Verify all are in store
      const listResponse = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(listResponse.body).toHaveLength(3);
    });

    it('should handle concurrent updates correctly', async () => {
      // Create 2 todos
      const todo1 = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Task 1' })
        .expect(201);

      const todo2 = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Task 2' })
        .expect(201);

      // Update both concurrently
      const updatePromises = [
        request(app)
          .put(`/api/v1/todos/${todo1.body.id}`)
          .send({ completed: true }),
        request(app)
          .put(`/api/v1/todos/${todo2.body.id}`)
          .send({ completed: true })
      ];

      const updateResponses = await Promise.all(updatePromises);

      // Verify both updated
      updateResponses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
      });

      // Verify final state
      const listResponse = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(listResponse.body.every(t => t.completed)).toBe(true);
    });
  });

  describe('Health and Readiness Checks', () => {
    it('should pass health checks during normal operations', async () => {
      // Create some todos
      await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Task' })
        .expect(201);

      // Health check should still pass
      await request(app)
        .get('/health')
        .expect(200);

      // Readiness check should still pass
      await request(app)
        .get('/ready')
        .expect(200);

      // Operations should still work
      const listResponse = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
    });

    it('should maintain health checks during errors', async () => {
      // Trigger an error
      await request(app)
        .put('/api/v1/todos/invalid-uuid')
        .send({ completed: true })
        .expect(400);

      // Health checks should still work
      await request(app)
        .get('/health')
        .expect(200);

      await request(app)
        .get('/ready')
        .expect(200);
    });
  });

  describe('Stateless Behavior', () => {
    it('should maintain state across multiple requests', async () => {
      // Create todo
      const createRes = await request(app)
        .post('/api/v1/todos')
        .send({ title: 'Persistent task' })
        .expect(201);

      const todoId = createRes.body.id;

      // Multiple GET requests should return same data
      const list1 = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      const list2 = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(list1.body[0]).toEqual(list2.body[0]);
    });
  });
});
