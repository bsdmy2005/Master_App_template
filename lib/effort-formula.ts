import type { Complexity, GapLevel, EffortConfig, ComplexityWeights, GapWeights } from "@/types/planning-types"

export interface EffortFormulaConfig {
  low: {
    base: number
    multiplier: number
  }
  medium: {
    base: number
    multiplier: number
  }
  high: {
    base: number
    multiplier: number
  }
}

// Default complexity weights
export const defaultComplexityWeights: ComplexityWeights = {
  low: 1.0,
  medium: 1.5,
  high: 2.0
}

// Default gap weights (5-level system)
export const defaultGapWeights: GapWeights = {
  "sdk-native": 0.5, // No development needed
  "minor-extension": 1.0, // Minimal SDK extension
  "moderate-extension": 1.5, // Moderate SDK extension
  "significant-extension": 2.0, // Significant SDK extension
  "custom-implementation": 2.5 // Full custom development
}

// Default formula configuration
export const defaultFormulaConfig: EffortFormulaConfig = {
  low: {
    base: 10,
    multiplier: 2.0
  },
  medium: {
    base: 15,
    multiplier: 2.0
  },
  high: {
    base: 20,
    multiplier: 2.0
  }
}

// Default effort config combining all defaults
export const defaultEffortConfig: EffortConfig = {
  complexityWeights: defaultComplexityWeights,
  gapWeights: defaultGapWeights,
  formulaParams: defaultFormulaConfig
}

// Gap level labels for display
export const gapLevelLabels: Record<GapLevel, string> = {
  "sdk-native": "SDK Native",
  "minor-extension": "Minor Extension",
  "moderate-extension": "Moderate Extension",
  "significant-extension": "Significant Extension",
  "custom-implementation": "Custom Implementation"
}

// Complexity labels for display
export const complexityLabels: Record<Complexity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
}

// Calculate man-days from complexity and gap using weighted formula
export function calculateManDays(
  complexity: Complexity,
  gap: GapLevel,
  config: EffortConfig = defaultEffortConfig
): number {
  const formula = config.formulaParams[complexity]
  const complexityWeight = config.complexityWeights[complexity]
  const gapWeight = config.gapWeights[gap]

  // Formula: base + (complexity_weight * gap_weight * multiplier)
  return formula.base + complexityWeight * gapWeight * formula.multiplier
}

// Get formula for a specific complexity
export function getFormulaForComplexity(
  complexity: Complexity,
  config: EffortConfig = defaultEffortConfig
): { base: number; multiplier: number } {
  return config.formulaParams[complexity]
}

// Get gap weight for a specific gap level
export function getGapWeight(gap: GapLevel, config: EffortConfig = defaultEffortConfig): number {
  return config.gapWeights[gap]
}

// Get complexity weight
export function getComplexityWeight(complexity: Complexity, config: EffortConfig = defaultEffortConfig): number {
  return config.complexityWeights[complexity]
}

// Note: Effort configuration persistence is now handled via the database
