import logger from '../utils/logger.js';
import TodoStore from '../models/TodoStore.js';
import { parseIntent, extractParameters } from '../chat/parser.js';
import { validateTitle, validateUUID } from '../utils/validator.js';
import { AppError } from '../utils/error-handler.js';

/**
 * POST /api/v1/chat - Process chatbot message and execute intent
 * Body: {message: string}
 * Returns: {intent, status, result/error}
 */
export async function processChat(req, res, next) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      throw new AppError('Message must be a non-empty string', 'INVALID_TYPE', 400);
    }

    // Parse intent
    const intentResult = parseIntent(message);
    const { intent, status } = intentResult;

    logger.info('Chat message received', {
      requestId: req.id,
      message,
      intent,
      status
    });

    // If intent parsing failed, return error
    if (status === 'FAILED') {
      return res.status(200).json({
        intent,
        status,
        error: intentResult.error
      });
    }

    // Extract parameters
    const params = extractParameters(message, intent);

    // Execute intent action
    let result;
    try {
      result = await executeIntent(intent, params);
    } catch (err) {
      logger.error('Intent execution failed', {
        requestId: req.id,
        intent,
        error: err.message
      });

      return res.status(200).json({
        intent,
        status: 'FAILED',
        error: err.message
      });
    }

    logger.info('Intent executed successfully', {
      requestId: req.id,
      intent,
      result
    });

    res.status(200).json({
      intent,
      status: 'SUCCESS',
      result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Execute the recognized intent
 * @param {string} intent - Recognized intent
 * @param {Object} params - Extracted parameters
 * @returns {Object} Action result
 */
async function executeIntent(intent, params) {
  switch (intent) {
    case 'CREATE_TODO':
      if (!params.title) {
        throw new AppError('Title required for creating todo', 'INVALID_TITLE', 400);
      }
      const validatedTitle = validateTitle(params.title);
      return TodoStore.create(validatedTitle);

    case 'LIST_TODOS':
      return TodoStore.getAll();

    case 'UPDATE_TODO':
      if (!params.id) {
        throw new AppError('Todo ID required for updating', 'NOT_FOUND', 404);
      }
      const validatedId = validateUUID(params.id);
      const existingTodo = TodoStore.getById(validatedId);
      if (!existingTodo) {
        throw new AppError(`Todo with id ${validatedId} not found`, 'NOT_FOUND', 404);
      }
      return TodoStore.update(validatedId, { completed: true });

    case 'DELETE_TODO':
      if (!params.id) {
        throw new AppError('Todo ID required for deleting', 'NOT_FOUND', 404);
      }
      const todoId = validateUUID(params.id);
      const todo = TodoStore.getById(todoId);
      if (!todo) {
        throw new AppError(`Todo with id ${todoId} not found`, 'NOT_FOUND', 404);
      }
      TodoStore.delete(todoId);
      return { success: true, id: todoId };

    default:
      throw new AppError(`Unknown intent: ${intent}`, 'UNKNOWN', 400);
  }
}
