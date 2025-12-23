import logger from '../utils/logger.js';
import TodoStore from '../models/TodoStore.js';
import { validateTitle, validateUUID, validateBoolean } from '../utils/validator.js';
import { AppError } from '../utils/error-handler.js';

/**
 * POST /api/v1/todos - Create a new todo
 * Body: {title: string}
 * Returns: {id, title, completed} with 201 status
 */
export async function createTodo(req, res, next) {
  try {
    const { title } = req.body;

    // Validate title
    const validatedTitle = validateTitle(title);

    // Create todo in store
    const todo = TodoStore.create(validatedTitle);

    // Log
    logger.info('Todo created', {
      requestId: req.id,
      todoId: todo.id,
      title: validatedTitle
    });

    // Return 201 Created
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/todos - List all todos
 * Returns: array of todos with 200 status
 */
export async function listTodos(req, res, next) {
  try {
    const todos = TodoStore.getAll();

    logger.info('Todos listed', {
      requestId: req.id,
      count: todos.length
    });

    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/todos/:id - Update todo completion status
 * Body: {completed: boolean}
 * Returns: updated todo with 200 status, or error with 404
 */
export async function updateTodo(req, res, next) {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    // Validate ID
    const validatedId = validateUUID(id);

    // Validate completed field
    const validatedCompleted = validateBoolean(completed);

    // Get existing todo
    const existingTodo = TodoStore.getById(validatedId);
    if (!existingTodo) {
      throw new AppError(`Todo with id ${validatedId} not found`, 'NOT_FOUND', 404);
    }

    // Update todo
    const updatedTodo = TodoStore.update(validatedId, { completed: validatedCompleted });

    logger.info('Todo updated', {
      requestId: req.id,
      todoId: validatedId,
      previousCompleted: existingTodo.completed,
      newCompleted: validatedCompleted
    });

    res.status(200).json(updatedTodo);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/todos/:id - Delete a todo
 * Returns: 204 No Content on success, or 404 error
 */
export async function deleteTodo(req, res, next) {
  try {
    const { id } = req.params;

    // Validate ID
    const validatedId = validateUUID(id);

    // Check if todo exists
    const existingTodo = TodoStore.getById(validatedId);
    if (!existingTodo) {
      throw new AppError(`Todo with id ${validatedId} not found`, 'NOT_FOUND', 404);
    }

    // Delete todo
    TodoStore.delete(validatedId);

    logger.info('Todo deleted', {
      requestId: req.id,
      todoId: validatedId
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
