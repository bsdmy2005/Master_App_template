"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { EffortConfig, PlanningData, UseCase } from "@/types/planning-types"
import {
  defaultEffortConfig,
  loadEffortConfig,
  saveEffortConfig,
  calculateManDays
} from "./effort-formula"

interface EffortConfigContextType {
  config: EffortConfig
  setConfig: (config: EffortConfig) => void
  saveConfig: (config: EffortConfig) => void
  recalculateAllUseCases: (data: PlanningData) => PlanningData
  calculateEffort: (complexity: UseCase["complexity"], gap: UseCase["gap"]) => number
}

const EffortConfigContext = createContext<EffortConfigContextType | null>(null)

export function EffortConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EffortConfig>(defaultEffortConfig)

  // Load saved config on mount
  useEffect(() => {
    const loaded = loadEffortConfig()
    setConfig(loaded)
  }, [])

  // Save config and update state
  const saveConfig = useCallback((newConfig: EffortConfig) => {
    saveEffortConfig(newConfig)
    setConfig(newConfig)
  }, [])

  // Calculate effort using current config
  const calculateEffort = useCallback(
    (complexity: UseCase["complexity"], gap: UseCase["gap"]) => {
      return calculateManDays(complexity, gap, config)
    },
    [config]
  )

  // Recalculate all use cases with current config
  const recalculateAllUseCases = useCallback(
    (data: PlanningData): PlanningData => {
      const updatedUseCases = data.useCases.map((useCase) => ({
        ...useCase,
        manDays: calculateManDays(useCase.complexity, useCase.gap, config),
        updatedAt: new Date().toISOString()
      }))

      return {
        ...data,
        useCases: updatedUseCases
      }
    },
    [config]
  )

  return (
    <EffortConfigContext.Provider
      value={{
        config,
        setConfig,
        saveConfig,
        recalculateAllUseCases,
        calculateEffort
      }}
    >
      {children}
    </EffortConfigContext.Provider>
  )
}

export function useEffortConfig() {
  const context = useContext(EffortConfigContext)
  if (!context) {
    throw new Error("useEffortConfig must be used within an EffortConfigProvider")
  }
  return context
}
