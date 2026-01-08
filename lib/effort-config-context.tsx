"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { EffortConfig, PlanningData, UseCase } from "@/types/planning-types"
import { defaultEffortConfig, calculateManDays } from "@/lib/effort-formula"

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

  // Load saved config from database on mount
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const { getEffortConfigAction } = await import("@/actions/db/effort-config-actions")
        const result = await getEffortConfigAction()
        if (!cancelled && result.isSuccess && result.data) {
          setConfig(result.data)
        }
      } catch (error) {
        console.error("Failed to load effort config from database, using defaults:", error)
        // Fallback: keep defaultEffortConfig
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  // Save config to database and update state
  const saveConfig = useCallback((newConfig: EffortConfig) => {
    const persist = async () => {
      try {
        const { saveEffortConfigAction } = await import("@/actions/db/effort-config-actions")
        const result = await saveEffortConfigAction(newConfig)
        if (result.isSuccess) {
          setConfig(newConfig)
        } else {
          console.error("Failed to save effort config:", result.message)
        }
      } catch (error) {
        console.error("Error saving effort config to database:", error)
      }
    }

    setConfig(newConfig)
    void persist()
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
