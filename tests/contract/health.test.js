import request from 'supertest';
import app from '../../src/app.js';

describe('Health & Readiness Endpoints', () => {
  describe('GET /health - Liveness Probe', () => {
    it('should return 200 with UP status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'UP'
      });
    });

    it('should always be available', async () => {
      // Multiple rapid requests should all succeed
      const promises = [
        request(app).get('/health'),
        request(app).get('/health'),
        request(app).get('/health')
      ];

      const responses = await Promise.all(promises);
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('UP');
      });
    });
  });

  describe('GET /ready - Readiness Probe', () => {
    it('should return 200 with ready status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ready'
      });
    });

    it('should indicate service is ready to accept traffic', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
    });
  });

  describe('Kubernetes Probe Integration', () => {
    it('health endpoint compatible with K8s livenessProbe', async () => {
      // K8s expects HTTP 200 for liveness
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBeDefined();
    });

    it('ready endpoint compatible with K8s readinessProbe', async () => {
      // K8s expects HTTP 200 for readiness
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBeDefined();
    });
  });

  describe('404 for Unknown Endpoints', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND');
      expect(response.body.error).toBeDefined();
    });
  });
});
