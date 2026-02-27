import {
  BUDGET_MODEL,
  DEFAULT_MODEL,
  PREMIUM_MODEL,
  estimateCost,
  getModelConfig,
  getModelForTask,
} from '@/lib/config/aiModels';

describe('aiModels config', () => {
  describe('getModelForTask', () => {
    it('returns budget model for simple tasks', () => {
      expect(getModelForTask('voice-transcription')).toBe(BUDGET_MODEL);
      expect(getModelForTask('simple-extraction')).toBe(BUDGET_MODEL);
    });

    it('returns default model for standard tasks', () => {
      expect(getModelForTask('race-strategy')).toBe(DEFAULT_MODEL);
      expect(getModelForTask('session-planning')).toBe(DEFAULT_MODEL);
    });

    it('returns premium model for complex tasks', () => {
      expect(getModelForTask('multi-step-reasoning')).toBe(PREMIUM_MODEL);
      expect(getModelForTask('code-generation')).toBe(PREMIUM_MODEL);
    });

    it('falls back to default model for unknown tasks', () => {
      expect(getModelForTask('unknown-task-type')).toBe(DEFAULT_MODEL);
    });
  });

  describe('getModelConfig', () => {
    it('returns config for known model id', () => {
      const config = getModelConfig(DEFAULT_MODEL);
      expect(config).toBeDefined();
      expect(config?.id).toBe(DEFAULT_MODEL);
    });

    it('returns undefined for unknown model id', () => {
      const unknown = getModelConfig('claude-3-5-sonnet-20241022');
      expect(unknown).toBeUndefined();
    });
  });

  describe('estimateCost', () => {
    it('returns zero when config is missing', () => {
      const cost = estimateCost('claude-3-5-sonnet-20241022', 5000, 2000);
      expect(cost).toBe(0);
    });

    it('calculates positive cost for known models', () => {
      const cost = estimateCost(DEFAULT_MODEL, 1000, 1000);
      expect(cost).toBeGreaterThan(0);
    });
  });
});
