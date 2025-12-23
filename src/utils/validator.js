import { validate as uuidValidate } from 'uuid';
import { AppError } from './error-handler.js';

/**
 * Validate todo title
 * @param {string} title - Title to validate
 * @returns {string} Trimmed title
 * @throws {AppError} If validation fails
 */
export function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    throw new AppError('Title is required and must be a string', 'INVALID_TITLE', 400);
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    throw new AppError('Title must not be empty', 'INVALID_TITLE', 400);
  }

  if (trimmed.length > 500) {
    throw new AppError('Title must not exceed 500 characters', 'INVALID_TITLE', 400);
  }

  return trimmed;
}

/**
 * Validate UUID
 * @param {string} id - UUID to validate
 * @returns {string} Validated UUID
 * @throws {AppError} If validation fails
 */
export function validateUUID(id) {
  if (!id || typeof id !== 'string') {
    throw new AppError('ID must be a valid UUID string', 'INVALID_UUID', 400);
  }

  if (!uuidValidate(id)) {
    throw new AppError('ID must be a valid UUID', 'INVALID_UUID', 400);
  }

  return id;
}

/**
 * Validate completed boolean
 * @param {any} value - Value to validate
 * @returns {boolean} Validated boolean
 * @throws {AppError} If validation fails
 */
export function validateBoolean(value) {
  if (typeof value !== 'boolean') {
    throw new AppError('Value must be a boolean', 'INVALID_TYPE', 400);
  }

  return value;
}

export default {
  validateTitle,
  validateUUID,
  validateBoolean
};
