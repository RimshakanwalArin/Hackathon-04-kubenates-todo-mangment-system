import TodoStore from '../../src/models/TodoStore.js';

describe('TodoStore - Unit Tests', () => {
  beforeEach(() => {
    TodoStore.clear();
  });

  describe('create()', () => {
    it('should create a todo and return it with id, title, completed=false', () => {
      const todo = TodoStore.create('Buy milk');

      expect(todo).toEqual({
        id: expect.any(String),
        title: 'Buy milk',
        completed: false
      });
    });

    it('should generate unique UUIDs for each todo', () => {
      const todo1 = TodoStore.create('Todo 1');
      const todo2 = TodoStore.create('Todo 2');

      expect(todo1.id).not.toBe(todo2.id);
      expect(new Set([todo1.id, todo2.id]).size).toBe(2);
    });

    it('should trim whitespace from title', () => {
      const todo = TodoStore.create('  Buy milk  ');
      expect(todo.title).toBe('Buy milk');
    });
  });

  describe('getAll()', () => {
    it('should return empty array when no todos exist', () => {
      const todos = TodoStore.getAll();
      expect(Array.isArray(todos)).toBe(true);
      expect(todos).toHaveLength(0);
    });

    it('should return all created todos', () => {
      TodoStore.create('Todo 1');
      TodoStore.create('Todo 2');
      TodoStore.create('Todo 3');

      const todos = TodoStore.getAll();
      expect(todos).toHaveLength(3);
      expect(todos.map(t => t.title)).toEqual(['Todo 1', 'Todo 2', 'Todo 3']);
    });

    it('should return todos with correct properties', () => {
      TodoStore.create('Buy milk');
      const todos = TodoStore.getAll();

      const todo = todos[0];
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('title');
      expect(todo).toHaveProperty('completed');
      expect(Object.keys(todo)).toHaveLength(3);
    });

    it('should not return internal references', () => {
      TodoStore.create('Todo 1');
      const todos1 = TodoStore.getAll();
      todos1[0].title = 'Modified'; // Try to modify returned array

      const todos2 = TodoStore.getAll();
      expect(todos2[0].title).toBe('Todo 1'); // Should not be modified
    });
  });

  describe('getById()', () => {
    it('should return todo when it exists', () => {
      const created = TodoStore.create('Buy milk');
      const retrieved = TodoStore.getById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null when todo does not exist', () => {
      const result = TodoStore.getById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should return correct todo from multiple todos', () => {
      const todo1 = TodoStore.create('Todo 1');
      const todo2 = TodoStore.create('Todo 2');
      const todo3 = TodoStore.create('Todo 3');

      const retrieved = TodoStore.getById(todo2.id);
      expect(retrieved.title).toBe('Todo 2');
      expect(retrieved.id).toBe(todo2.id);
    });
  });

  describe('update()', () => {
    it('should update todo completed status', () => {
      const created = TodoStore.create('Buy milk');
      expect(created.completed).toBe(false);

      const updated = TodoStore.update(created.id, { completed: true });
      expect(updated.completed).toBe(true);
      expect(updated.title).toBe('Buy milk'); // Title unchanged
    });

    it('should toggle completed status', () => {
      const todo = TodoStore.create('Task');

      const updated1 = TodoStore.update(todo.id, { completed: true });
      expect(updated1.completed).toBe(true);

      const updated2 = TodoStore.update(todo.id, { completed: false });
      expect(updated2.completed).toBe(false);
    });

    it('should persist changes across getAll()', () => {
      const todo = TodoStore.create('Task');
      TodoStore.update(todo.id, { completed: true });

      const allTodos = TodoStore.getAll();
      const found = allTodos.find(t => t.id === todo.id);
      expect(found.completed).toBe(true);
    });

    it('should persist changes across getById()', () => {
      const todo = TodoStore.create('Task');
      TodoStore.update(todo.id, { completed: true });

      const retrieved = TodoStore.getById(todo.id);
      expect(retrieved.completed).toBe(true);
    });

    it('should return null when todo does not exist', () => {
      const result = TodoStore.update('nonexistent-id', { completed: true });
      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should remove todo from store', () => {
      const todo = TodoStore.create('Buy milk');
      expect(TodoStore.count()).toBe(1);

      TodoStore.delete(todo.id);
      expect(TodoStore.count()).toBe(0);
    });

    it('should make deleted todo inaccessible via getById()', () => {
      const todo = TodoStore.create('Buy milk');
      TodoStore.delete(todo.id);

      const retrieved = TodoStore.getById(todo.id);
      expect(retrieved).toBeNull();
    });

    it('should not affect other todos', () => {
      const todo1 = TodoStore.create('Todo 1');
      const todo2 = TodoStore.create('Todo 2');

      TodoStore.delete(todo1.id);

      const remaining = TodoStore.getAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(todo2.id);
    });

    it('should silently handle deletion of non-existent todo', () => {
      expect(() => {
        TodoStore.delete('nonexistent-id');
      }).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('should remove all todos', () => {
      TodoStore.create('Todo 1');
      TodoStore.create('Todo 2');
      TodoStore.create('Todo 3');

      expect(TodoStore.count()).toBe(3);
      TodoStore.clear();
      expect(TodoStore.count()).toBe(0);
    });

    it('should return empty array after clear()', () => {
      TodoStore.create('Todo');
      TodoStore.clear();

      const todos = TodoStore.getAll();
      expect(todos).toHaveLength(0);
    });
  });

  describe('count()', () => {
    it('should return 0 for empty store', () => {
      expect(TodoStore.count()).toBe(0);
    });

    it('should return correct count of todos', () => {
      TodoStore.create('Todo 1');
      expect(TodoStore.count()).toBe(1);

      TodoStore.create('Todo 2');
      expect(TodoStore.count()).toBe(2);

      TodoStore.create('Todo 3');
      expect(TodoStore.count()).toBe(3);
    });

    it('should update count after delete', () => {
      const todo1 = TodoStore.create('Todo 1');
      const todo2 = TodoStore.create('Todo 2');

      expect(TodoStore.count()).toBe(2);
      TodoStore.delete(todo1.id);
      expect(TodoStore.count()).toBe(1);
    });
  });

  describe('Data integrity', () => {
    it('should not allow modification of returned todo object to affect store', () => {
      const created = TodoStore.create('Original');
      const retrieved = TodoStore.getById(created.id);

      retrieved.title = 'Modified';

      const fetched = TodoStore.getById(created.id);
      expect(fetched.title).toBe('Original');
    });

    it('should maintain todo properties immutability', () => {
      const todo = TodoStore.create('Task');
      expect(todo.completed).toBe(false);

      // Update should not mutate the original object
      const updated = TodoStore.update(todo.id, { completed: true });
      expect(updated.completed).toBe(true);
      expect(todo.completed).toBe(false);
    });
  });
});
