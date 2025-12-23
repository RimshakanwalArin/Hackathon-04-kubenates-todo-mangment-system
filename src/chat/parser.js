/**
 * Chat intent parser
 * Recognizes natural language intents and maps them to API actions
 * Phase I: Keyword-based matching (95% accuracy target)
 */

const INTENT_KEYWORDS = {
  CREATE_TODO: ['add', 'create', 'new', 'make', 'insert'],
  LIST_TODOS: ['list', 'show', 'get all', 'display', 'all', 'todos', 'my', 'see'],
  UPDATE_TODO: ['mark', 'done', 'complete', 'finish', 'check', 'update'],
  DELETE_TODO: ['delete', 'remove', 'clear', 'destroy', 'eliminate']
};

/**
 * Parse user message and extract intent
 * @param {string} message - User message from chatbot
 * @returns {Object} {intent, status, metadata}
 */
export function parseIntent(message) {
  if (!message || typeof message !== 'string') {
    return {
      intent: 'UNKNOWN',
      status: 'FAILED',
      error: 'Message must be a non-empty string'
    };
  }

  const lowerMessage = message.toLowerCase().trim();

  // Check for matching keywords
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          intent,
          status: 'SUCCESS',
          message: lowerMessage
        };
      }
    }
  }

  // No keywords matched
  return {
    intent: 'UNKNOWN',
    status: 'FAILED',
    error: 'Could not parse intent from message'
  };
}

/**
 * Extract todo parameters from message
 * @param {string} message - User message
 * @param {string} intent - Recognized intent
 * @returns {Object} Extracted parameters
 */
export function extractParameters(message, intent) {
  const params = {};

  // For CREATE_TODO, extract title (everything after keywords)
  if (intent === 'CREATE_TODO') {
    const titleMatch = message.match(/(?:add|create|new|make|insert)\s+(?:todo\s+)?(.+)/i);
    if (titleMatch && titleMatch[1]) {
      params.title = titleMatch[1].trim();
    }
  }

  // For UPDATE_TODO, extract ID if present
  if (intent === 'UPDATE_TODO') {
    const idMatch = message.match(/#(\d+)|(?:id\s+)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (idMatch) {
      params.id = idMatch[1] || idMatch[2];
    }
  }

  // For DELETE_TODO, extract ID if present
  if (intent === 'DELETE_TODO') {
    const idMatch = message.match(/#(\d+)|(?:id\s+)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (idMatch) {
      params.id = idMatch[1] || idMatch[2];
    }
  }

  return params;
}

export default {
  parseIntent,
  extractParameters
};
