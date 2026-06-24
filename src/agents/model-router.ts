/**
 * Model Router: Intelligent model selection with automatic escalation
 *
 * Strategy:
 * 1. Default to local Mistral Nemo (fast, private, free)
 * 2. Auto-escalate to Grok-2 for complex tasks
 * 3. Reserve Claude Opus/Sonnet for the hardest 5%
 *
 * Routing is based on:
 * - Task complexity score (prompt length, tool count, context size)
 * - Confidence thresholds (tunable per deployment)
 * - Telemetry feedback (success rates per model)
 */

import type { MoltbotConfig } from "../config/config.js";
import type { ModelRef } from "./model-selection.js";
import { parseModelRef } from "./model-selection.js";

export type TaskComplexity = "simple" | "moderate" | "complex" | "very-complex";

export interface TaskMetrics {
  promptLength: number;
  toolCallCount: number;
  contextTokens: number;
  requiresStructuredOutput: boolean;
  requiresMultiStep: boolean;
  requiresLongContext: boolean;
}

export interface RouterConfig {
  /** Local model for simple tasks (default: mistral-nemo) */
  localModel: ModelRef;
  /** Cloud model for moderate-complex tasks (default: grok-2-mini) */
  cloudModel: ModelRef;
  /** Premium model for very-complex tasks (default: claude-opus) */
  premiumModel: ModelRef;

  /** Complexity thresholds (tunable) */
  thresholds: {
    /** Escalate to cloud if complexity >= this */
    cloudEscalation: TaskComplexity;
    /** Escalate to premium if complexity >= this */
    premiumEscalation: TaskComplexity;
  };

  /** Enable telemetry tracking */
  telemetryEnabled: boolean;
}

export interface RouterTelemetry {
  taskId: string;
  selectedModel: ModelRef;
  complexity: TaskComplexity;
  metrics: TaskMetrics;
  success: boolean;
  duration: number;
  timestamp: number;
}

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  localModel: { provider: "ollama", model: "mistral-nemo:12b-instruct-2407-q5_K_M" },
  cloudModel: { provider: "xai", model: "grok-2-mini" },
  premiumModel: { provider: "anthropic", model: "claude-opus-4" },
  thresholds: {
    cloudEscalation: "moderate",
    premiumEscalation: "very-complex",
  },
  telemetryEnabled: true,
};

/**
 * Calculate task complexity score from metrics
 */
export function assessComplexity(metrics: TaskMetrics): TaskComplexity {
  let score = 0;

  // Prompt length scoring
  if (metrics.promptLength > 10000) score += 3;
  else if (metrics.promptLength > 5000) score += 2;
  else if (metrics.promptLength > 2000) score += 1;

  // Tool call complexity
  if (metrics.toolCallCount > 20) score += 3;
  else if (metrics.toolCallCount > 10) score += 2;
  else if (metrics.toolCallCount > 3) score += 1;

  // Context size
  if (metrics.contextTokens > 50000) score += 2;
  else if (metrics.contextTokens > 20000) score += 1;

  // Special requirements
  if (metrics.requiresStructuredOutput) score += 1;
  if (metrics.requiresMultiStep) score += 2;
  if (metrics.requiresLongContext) score += 2;

  // Map score to complexity level
  if (score >= 9) return "very-complex";
  if (score >= 5) return "complex";
  if (score >= 2) return "moderate";
  return "simple";
}

/**
 * Select the optimal model based on task complexity and config
 */
export function routeModel(
  metrics: TaskMetrics,
  config: Partial<RouterConfig> = {},
): { model: ModelRef; complexity: TaskComplexity; reasoning: string } {
  const cfg = { ...DEFAULT_ROUTER_CONFIG, ...config };
  const complexity = assessComplexity(metrics);

  let model: ModelRef;
  let reasoning: string;

  const complexityOrder: TaskComplexity[] = ["simple", "moderate", "complex", "very-complex"];
  const cloudThreshold = complexityOrder.indexOf(cfg.thresholds.cloudEscalation);
  const premiumThreshold = complexityOrder.indexOf(cfg.thresholds.premiumEscalation);
  const currentLevel = complexityOrder.indexOf(complexity);

  if (currentLevel >= premiumThreshold) {
    model = cfg.premiumModel;
    reasoning = `Task complexity '${complexity}' exceeds premium threshold; using ${model.provider}/${model.model}`;
  } else if (currentLevel >= cloudThreshold) {
    model = cfg.cloudModel;
    reasoning = `Task complexity '${complexity}' exceeds cloud threshold; using ${model.provider}/${model.model}`;
  } else {
    model = cfg.localModel;
    reasoning = `Task complexity '${complexity}' is within local model capabilities; using ${model.provider}/${model.model}`;
  }

  return { model, complexity, reasoning };
}

/**
 * Load router configuration from Moltbot config
 */
export function loadRouterConfig(cfg: MoltbotConfig): RouterConfig {
  const routerCfg = cfg.agents?.defaults?.modelRouter;
  if (!routerCfg) return DEFAULT_ROUTER_CONFIG;

  const localModel = routerCfg.localModel
    ? parseModelRef(routerCfg.localModel, "ollama")
    : DEFAULT_ROUTER_CONFIG.localModel;

  const cloudModel = routerCfg.cloudModel
    ? parseModelRef(routerCfg.cloudModel, "xai")
    : DEFAULT_ROUTER_CONFIG.cloudModel;

  const premiumModel = routerCfg.premiumModel
    ? parseModelRef(routerCfg.premiumModel, "anthropic")
    : DEFAULT_ROUTER_CONFIG.premiumModel;

  return {
    localModel: localModel ?? DEFAULT_ROUTER_CONFIG.localModel,
    cloudModel: cloudModel ?? DEFAULT_ROUTER_CONFIG.cloudModel,
    premiumModel: premiumModel ?? DEFAULT_ROUTER_CONFIG.premiumModel,
    thresholds: {
      cloudEscalation:
        routerCfg.thresholds?.cloudEscalation ?? DEFAULT_ROUTER_CONFIG.thresholds.cloudEscalation,
      premiumEscalation:
        routerCfg.thresholds?.premiumEscalation ??
        DEFAULT_ROUTER_CONFIG.thresholds.premiumEscalation,
    },
    telemetryEnabled: routerCfg.telemetryEnabled ?? DEFAULT_ROUTER_CONFIG.telemetryEnabled,
  };
}

/**
 * Record telemetry for a routed task
 */
export function recordTelemetry(telemetry: RouterTelemetry, config: RouterConfig): void {
  if (!config.telemetryEnabled) return;

  // In production, this would write to a telemetry store
  // For now, we'll just log to debug
  console.debug("[ModelRouter] Telemetry:", {
    taskId: telemetry.taskId,
    model: `${telemetry.selectedModel.provider}/${telemetry.selectedModel.model}`,
    complexity: telemetry.complexity,
    success: telemetry.success,
    duration: `${telemetry.duration}ms`,
  });
}

/**
 * Create task metrics from an agent prompt
 */
export function metricsFromPrompt(params: {
  prompt: string;
  toolCallCount?: number;
  contextTokens?: number;
  requiresStructuredOutput?: boolean;
  requiresMultiStep?: boolean;
}): TaskMetrics {
  return {
    promptLength: params.prompt.length,
    toolCallCount: params.toolCallCount ?? 0,
    contextTokens: params.contextTokens ?? Math.floor(params.prompt.length / 4), // rough estimate
    requiresStructuredOutput: params.requiresStructuredOutput ?? false,
    requiresMultiStep: params.requiresMultiStep ?? false,
    requiresLongContext: (params.contextTokens ?? 0) > 20000,
  };
}
