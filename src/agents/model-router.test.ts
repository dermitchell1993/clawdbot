import { describe, it, expect } from "vitest";
import {
  assessComplexity,
  routeModel,
  metricsFromPrompt,
  type TaskMetrics,
  type RouterConfig,
} from "./model-router.js";

describe("assessComplexity", () => {
  it("should classify simple tasks", () => {
    const metrics: TaskMetrics = {
      promptLength: 500,
      toolCallCount: 1,
      contextTokens: 1000,
      requiresStructuredOutput: false,
      requiresMultiStep: false,
      requiresLongContext: false,
    };
    expect(assessComplexity(metrics)).toBe("simple");
  });

  it("should classify moderate tasks", () => {
    const metrics: TaskMetrics = {
      promptLength: 3000,
      toolCallCount: 5,
      contextTokens: 8000,
      requiresStructuredOutput: false,
      requiresMultiStep: false,
      requiresLongContext: false,
    };
    expect(assessComplexity(metrics)).toBe("moderate");
  });

  it("should classify complex tasks", () => {
    const metrics: TaskMetrics = {
      promptLength: 6000,
      toolCallCount: 12,
      contextTokens: 25000,
      requiresStructuredOutput: true,
      requiresMultiStep: true,
      requiresLongContext: true,
    };
    expect(assessComplexity(metrics)).toBe("complex");
  });

  it("should classify very-complex tasks", () => {
    const metrics: TaskMetrics = {
      promptLength: 12000,
      toolCallCount: 25,
      contextTokens: 60000,
      requiresStructuredOutput: true,
      requiresMultiStep: true,
      requiresLongContext: true,
    };
    expect(assessComplexity(metrics)).toBe("very-complex");
  });

  it("should handle edge cases with structured output requirements", () => {
    const metrics: TaskMetrics = {
      promptLength: 1000,
      toolCallCount: 2,
      contextTokens: 3000,
      requiresStructuredOutput: true,
      requiresMultiStep: false,
      requiresLongContext: false,
    };
    expect(assessComplexity(metrics)).toBe("moderate");
  });
});

describe("routeModel", () => {
  it("should route simple tasks to local model", () => {
    const metrics: TaskMetrics = {
      promptLength: 500,
      toolCallCount: 1,
      contextTokens: 1000,
      requiresStructuredOutput: false,
      requiresMultiStep: false,
      requiresLongContext: false,
    };

    const result = routeModel(metrics);
    expect(result.model.provider).toBe("ollama");
    expect(result.model.model).toBe("mistral-nemo:12b-instruct-2407-q5_K_M");
    expect(result.complexity).toBe("simple");
  });

  it("should route moderate tasks to cloud model", () => {
    const metrics: TaskMetrics = {
      promptLength: 3000,
      toolCallCount: 5,
      contextTokens: 8000,
      requiresStructuredOutput: false,
      requiresMultiStep: false,
      requiresLongContext: false,
    };

    const result = routeModel(metrics);
    expect(result.model.provider).toBe("xai");
    expect(result.model.model).toBe("grok-2-mini");
    expect(result.complexity).toBe("moderate");
  });

  it("should route complex tasks to cloud model by default", () => {
    const metrics: TaskMetrics = {
      promptLength: 6000,
      toolCallCount: 12,
      contextTokens: 25000,
      requiresStructuredOutput: true,
      requiresMultiStep: true,
      requiresLongContext: true,
    };

    const result = routeModel(metrics);
    expect(result.model.provider).toBe("xai");
    expect(result.model.model).toBe("grok-2-mini");
    expect(result.complexity).toBe("complex");
  });

  it("should route very-complex tasks to premium model", () => {
    const metrics: TaskMetrics = {
      promptLength: 12000,
      toolCallCount: 25,
      contextTokens: 60000,
      requiresStructuredOutput: true,
      requiresMultiStep: true,
      requiresLongContext: true,
    };

    const result = routeModel(metrics);
    expect(result.model.provider).toBe("anthropic");
    expect(result.model.model).toBe("claude-opus-4");
    expect(result.complexity).toBe("very-complex");
  });

  it("should respect custom thresholds", () => {
    const metrics: TaskMetrics = {
      promptLength: 3000,
      toolCallCount: 5,
      contextTokens: 8000,
      requiresStructuredOutput: false,
      requiresMultiStep: false,
      requiresLongContext: false,
    };

    const customConfig: Partial<RouterConfig> = {
      thresholds: {
        cloudEscalation: "complex", // higher threshold
        premiumEscalation: "very-complex",
      },
    };

    const result = routeModel(metrics, customConfig);
    // Should use local model since moderate < complex
    expect(result.model.provider).toBe("ollama");
    expect(result.complexity).toBe("moderate");
  });

  it("should allow custom model overrides", () => {
    const metrics: TaskMetrics = {
      promptLength: 500,
      toolCallCount: 1,
      contextTokens: 1000,
      requiresStructuredOutput: false,
      requiresMultiStep: false,
      requiresLongContext: false,
    };

    const customConfig: Partial<RouterConfig> = {
      localModel: { provider: "ollama", model: "qwen2.5:14b" },
    };

    const result = routeModel(metrics, customConfig);
    expect(result.model.provider).toBe("ollama");
    expect(result.model.model).toBe("qwen2.5:14b");
  });
});

describe("metricsFromPrompt", () => {
  it("should extract metrics from a simple prompt", () => {
    const prompt = "What is the capital of France?";
    const metrics = metricsFromPrompt({ prompt });

    expect(metrics.promptLength).toBe(prompt.length);
    expect(metrics.toolCallCount).toBe(0);
    expect(metrics.requiresStructuredOutput).toBe(false);
    expect(metrics.requiresMultiStep).toBe(false);
  });

  it("should accept explicit tool call count", () => {
    const prompt = "Search the web and summarize the results";
    const metrics = metricsFromPrompt({
      prompt,
      toolCallCount: 3,
      requiresMultiStep: true,
    });

    expect(metrics.toolCallCount).toBe(3);
    expect(metrics.requiresMultiStep).toBe(true);
  });

  it("should estimate context tokens from prompt length", () => {
    const prompt = "x".repeat(4000); // ~1000 tokens
    const metrics = metricsFromPrompt({ prompt });

    expect(metrics.contextTokens).toBeGreaterThan(900);
    expect(metrics.contextTokens).toBeLessThan(1100);
  });

  it("should accept explicit context tokens", () => {
    const prompt = "Short prompt";
    const metrics = metricsFromPrompt({
      prompt,
      contextTokens: 50000,
    });

    expect(metrics.contextTokens).toBe(50000);
    expect(metrics.requiresLongContext).toBe(true);
  });
});
