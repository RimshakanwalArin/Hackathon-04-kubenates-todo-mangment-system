import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory Todo storage (Phase I)
 * Stores todos in a Map with UUID as key
 * Note: Data is lost on restart (stateless design per specification)
 */
class TodoStore {
  constructor() {
    this.todos = new Map();
  }

  /**
   * Create a new todo
   * @param {string} title - Todo title (1-500 chars)
   * @returns {Object} Created todo {id, title, completed}
   * @throws {Error} If title is invalid
   */
  create(title) {
    if (!title || typeof title !== 'string') {
      throw new Error('INVALID_TITLE: Title is required');
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 500) {
      throw new Error('INVALID_TITLE: Title must be 1-500 characters');
    }

    const todo = {
      id: uuidv4(),
      title: trimmedTitle,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.todos.set(todo.id, todo);
    return {
      id: todo.id,
      title: todo.title,
      completed: todo.completed
    };
  }

  /**
   * Get all todos
   * @returns {Array} Array of all todos
   */
  getAll() {
    return Array.from(this.todos.values()).map(todo => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed
    }));
  }

  /**
   * Get a todo by ID
   * @param {string} id - Todo ID (UUID)
   * @returns {Object|null} Todo or null if not found
   */
  getById(id) {
    const todo = this.todos.get(id);
    if (!todo) {
      return null;
    }
    return {
      id: todo.id,
      title: todo.title,
      completed: todo.completed
    };
  }

  /**
   * Update a todo
   * @param {string} id - Todo ID (UUID)
   * @param {Object} updates - Fields to update {completed, title}
   * @returns {Object} Updated todo or null if not found
   * @throws {Error} If update is invalid
   */
  update(id, updates) {
    const todo = this.todos.get(id);
    if (!todo) {
      return null;
    }

    // Only allow updating completed status in Phase I
    if (updates.completed !== undefined) {
      if (typeof updates.completed !== 'boolean') {
        throw new Error('INVALID_TYPE: completed must be boolean');
      }
      todo.completed = updates.completed;
    }

    return {
      id: todo.id,
      title: todo.title,
      completed: todo.completed
    };
  }

  /**
   * Delete a todo
   * @param {string} id - Todo ID (UUID)
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    const existed = this.todos.has(id);
    this.todos.delete(id);
    return existed;
  }

  /**
   * Clear all todos (useful for testing)
   */
  clear() {
    this.todos.clear();
  }

  /**
   * Get count of todos
   * @returns {number} Number of todos
   */
  count() {
    return this.todos.size;
  }
}

export default new TodoStore();
