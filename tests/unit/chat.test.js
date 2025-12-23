import { parseIntent, extractParameters } from '../../src/chat/parser.js';

describe('Chat Parser - Unit Tests', () => {
  describe('parseIntent()', () => {
    describe('CREATE_TODO intent', () => {
      it('should recognize "add" keyword', () => {
        const result = parseIntent('add buy milk');
        expect(result.intent).toBe('CREATE_TODO');
        expect(result.status).toBe('SUCCESS');
      });

      it('should recognize "create" keyword', () => {
        const result = parseIntent('create new task');
        expect(result.intent).toBe('CREATE_TODO');
        expect(result.status).toBe('SUCCESS');
      });

      it('should recognize "new" keyword', () => {
        const result = parseIntent('new shopping list');
        expect(result.intent).toBe('CREATE_TODO');
      });

      it('should recognize "make" keyword', () => {
        const result = parseIntent('make appointment');
        expect(result.intent).toBe('CREATE_TODO');
      });

      it('should recognize "insert" keyword', () => {
        const result = parseIntent('insert task');
        expect(result.intent).toBe('CREATE_TODO');
      });
    });

    describe('LIST_TODOS intent', () => {
      it('should recognize "list" keyword', () => {
        const result = parseIntent('list all todos');
        expect(result.intent).toBe('LIST_TODOS');
        expect(result.status).toBe('SUCCESS');
      });

      it('should recognize "show" keyword', () => {
        const result = parseIntent('show todos');
        expect(result.intent).toBe('LIST_TODOS');
      });

      it('should recognize "get all" phrase', () => {
        const result = parseIntent('get all');
        expect(result.intent).toBe('LIST_TODOS');
      });

      it('should recognize "display" keyword', () => {
        const result = parseIntent('display my todos');
        expect(result.intent).toBe('LIST_TODOS');
      });

      it('should recognize single "todos" keyword', () => {
        const result = parseIntent('todos');
        expect(result.intent).toBe('LIST_TODOS');
      });
    });

    describe('UPDATE_TODO intent', () => {
      it('should recognize "mark" keyword', () => {
        const result = parseIntent('mark done');
        expect(result.intent).toBe('UPDATE_TODO');
        expect(result.status).toBe('SUCCESS');
      });

      it('should recognize "done" keyword', () => {
        const result = parseIntent('done');
        expect(result.intent).toBe('UPDATE_TODO');
      });

      it('should recognize "complete" keyword', () => {
        const result = parseIntent('complete task');
        expect(result.intent).toBe('UPDATE_TODO');
      });

      it('should recognize "finish" keyword', () => {
        const result = parseIntent('finish work');
        expect(result.intent).toBe('UPDATE_TODO');
      });

      it('should recognize "check" keyword', () => {
        const result = parseIntent('check item');
        expect(result.intent).toBe('UPDATE_TODO');
      });

      it('should recognize "update" keyword', () => {
        const result = parseIntent('update todo');
        expect(result.intent).toBe('UPDATE_TODO');
      });
    });

    describe('DELETE_TODO intent', () => {
      it('should recognize "delete" keyword', () => {
        const result = parseIntent('delete this');
        expect(result.intent).toBe('DELETE_TODO');
        expect(result.status).toBe('SUCCESS');
      });

      it('should recognize "remove" keyword', () => {
        const result = parseIntent('remove item');
        expect(result.intent).toBe('DELETE_TODO');
      });

      it('should recognize "clear" keyword', () => {
        const result = parseIntent('clear');
        expect(result.intent).toBe('DELETE_TODO');
      });

      it('should recognize "destroy" keyword', () => {
        const result = parseIntent('destroy');
        expect(result.intent).toBe('DELETE_TODO');
      });

      it('should recognize "eliminate" keyword', () => {
        const result = parseIntent('eliminate task');
        expect(result.intent).toBe('DELETE_TODO');
      });
    });

    describe('Case insensitivity', () => {
      it('should recognize uppercase keywords', () => {
        const result = parseIntent('ADD TASK');
        expect(result.intent).toBe('CREATE_TODO');
        expect(result.status).toBe('SUCCESS');
      });

      it('should recognize mixed case', () => {
        const result = parseIntent('LiSt AlL');
        expect(result.intent).toBe('LIST_TODOS');
      });

      it('should handle keywords with varying whitespace', () => {
        const result = parseIntent('   add   task   ');
        expect(result.intent).toBe('CREATE_TODO');
        expect(result.status).toBe('SUCCESS');
      });
    });

    describe('UNKNOWN intent', () => {
      it('should return UNKNOWN when no keywords match', () => {
        const result = parseIntent('hello world');
        expect(result.intent).toBe('UNKNOWN');
        expect(result.status).toBe('FAILED');
        expect(result.error).toBeDefined();
      });

      it('should return FAILED status for unknown intents', () => {
        const result = parseIntent('foo bar baz');
        expect(result.status).toBe('FAILED');
      });

      it('should provide error message', () => {
        const result = parseIntent('gibberish');
        expect(result.error).toBeDefined();
        expect(result.error.length).toBeGreaterThan(0);
      });

      it('should handle empty string', () => {
        const result = parseIntent('');
        expect(result.intent).toBe('UNKNOWN');
        expect(result.status).toBe('FAILED');
      });

      it('should handle null input', () => {
        const result = parseIntent(null);
        expect(result.intent).toBe('UNKNOWN');
        expect(result.status).toBe('FAILED');
      });

      it('should handle non-string input', () => {
        const result = parseIntent(123);
        expect(result.intent).toBe('UNKNOWN');
        expect(result.status).toBe('FAILED');
      });
    });

    describe('Priority (first matching keyword)', () => {
      it('should return first matching intent', () => {
        const result = parseIntent('add and list'); // Both keywords present
        // Should return the intent from the first keyword found
        expect(['CREATE_TODO', 'LIST_TODOS']).toContain(result.intent);
        expect(result.status).toBe('SUCCESS');
      });
    });
  });

  describe('extractParameters()', () => {
    describe('CREATE_TODO parameters', () => {
      it('should extract title from "add" message', () => {
        const params = extractParameters('add Buy milk', 'CREATE_TODO');
        expect(params.title).toBe('Buy milk');
      });

      it('should extract title from "create" message', () => {
        const params = extractParameters('create new task', 'CREATE_TODO');
        expect(params.title).toBe('new task');
      });

      it('should extract title from "new" message', () => {
        const params = extractParameters('new shopping list', 'CREATE_TODO');
        expect(params.title).toBe('shopping list');
      });

      it('should handle titles with multiple words', () => {
        const params = extractParameters('add Buy milk and bread', 'CREATE_TODO');
        expect(params.title).toBe('Buy milk and bread');
      });

      it('should handle titles with special characters', () => {
        const params = extractParameters('add Task: Important!', 'CREATE_TODO');
        expect(params.title).toBe('Task: Important!');
      });

      it('should trim whitespace from title', () => {
        const params = extractParameters('add   spaced title   ', 'CREATE_TODO');
        expect(params.title).toBe('spaced title');
      });

      it('should return undefined title if not present', () => {
        const params = extractParameters('add', 'CREATE_TODO');
        expect(params.title).toBeUndefined();
      });
    });

    describe('UPDATE_TODO parameters', () => {
      it('should extract UUID from message', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const params = extractParameters(`mark ${uuid} done`, 'UPDATE_TODO');
        expect(params.id).toBe(uuid);
      });

      it('should extract UUID with "id" keyword', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const params = extractParameters(`mark id ${uuid}`, 'UPDATE_TODO');
        expect(params.id).toBe(uuid);
      });

      it('should not return ID if not present', () => {
        const params = extractParameters('mark done', 'UPDATE_TODO');
        expect(params.id).toBeUndefined();
      });

      it('should handle UUID with different cases', () => {
        const uuid = '550E8400-E29B-41D4-A716-446655440000';
        const params = extractParameters(`done ${uuid}`, 'UPDATE_TODO');
        expect(params.id).toBe(uuid);
      });
    });

    describe('DELETE_TODO parameters', () => {
      it('should extract UUID from message', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const params = extractParameters(`delete ${uuid}`, 'DELETE_TODO');
        expect(params.id).toBe(uuid);
      });

      it('should extract UUID with "id" keyword', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const params = extractParameters(`remove id ${uuid}`, 'DELETE_TODO');
        expect(params.id).toBe(uuid);
      });

      it('should not return ID if not present', () => {
        const params = extractParameters('delete', 'DELETE_TODO');
        expect(params.id).toBeUndefined();
      });
    });

    describe('LIST_TODOS parameters', () => {
      it('should return empty params object for LIST_TODOS', () => {
        const params = extractParameters('list all todos', 'LIST_TODOS');
        expect(params).toEqual({});
      });
    });

    describe('UNKNOWN intent parameters', () => {
      it('should return empty params for unknown intent', () => {
        const params = extractParameters('random text', 'UNKNOWN');
        expect(params).toEqual({});
      });
    });
  });

  describe('Integration', () => {
    it('should parse intent and extract parameters together', () => {
      const message = 'add Buy groceries';
      const intentResult = parseIntent(message);
      const params = extractParameters(message, intentResult.intent);

      expect(intentResult.intent).toBe('CREATE_TODO');
      expect(params.title).toBe('Buy groceries');
    });

    it('should handle complex multi-word title extraction', () => {
      const message = 'create Remember to call mom at 5pm';
      const intentResult = parseIntent(message);
      const params = extractParameters(message, intentResult.intent);

      expect(intentResult.intent).toBe('CREATE_TODO');
      expect(params.title).toBe('Remember to call mom at 5pm');
    });
  });
});
