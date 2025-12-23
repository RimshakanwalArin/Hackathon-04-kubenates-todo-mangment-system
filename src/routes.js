import { Router } from 'express';
import * as todoHandlers from './handlers/todos.js';
import * as chatHandlers from './handlers/chat.js';

const router = Router();

// Todo CRUD endpoints
router.post('/todos', todoHandlers.createTodo);
router.get('/todos', todoHandlers.listTodos);
router.put('/todos/:id', todoHandlers.updateTodo);
router.delete('/todos/:id', todoHandlers.deleteTodo);

// Chat intent endpoint
router.post('/chat', chatHandlers.processChat);

export default router;
