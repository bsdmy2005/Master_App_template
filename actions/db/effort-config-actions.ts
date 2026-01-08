"use server"

import { db } from "@/db/db"
import { effortConfigTable } from "@/db/schema"
import type { EffortConfig } from "@/types/planning-types"
import { ActionState } from "@/types"
import {
  defaultComplexityWeights,
  defaultEffortConfig,
  defaultFormulaConfig,
  defaultGapWeights
} from "@/lib/effort-formula"
import { eq } from "drizzle-orm"

const CONFIG_ID = "default"

function mapRowToEffortConfig(row: {
  complexityWeights: unknown
  gapWeights: unknown
  formulaParams: unknown
}): EffortConfig {
  const complexityWeights = {
    ...defaultComplexityWeights,
    ...(row.complexityWeights as any)
  }

  const gapWeights = {
    ...defaultGapWeights,
    ...(row.gapWeights as any)
  }

  const formulaParams = {
    low: { ...defaultFormulaConfig.low, ...(row.formulaParams as any)?.low },
    medium: { ...defaultFormulaConfig.medium, ...(row.formulaParams as any)?.medium },
    high: { ...defaultFormulaConfig.high, ...(row.formulaParams as any)?.high }
  }

  return {
    complexityWeights,
    gapWeights,
    formulaParams
  }
}

export async function getEffortConfigAction(): Promise<ActionState<EffortConfig>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }

    const [row] = await db
      .select()
      .from(effortConfigTable)
      .where(eq(effortConfigTable.id, CONFIG_ID))
      .limit(1)

    if (!row) {
      // Seed with default config if no row exists yet
      await db.insert(effortConfigTable).values({
        id: CONFIG_ID,
        complexityWeights: defaultComplexityWeights,
        gapWeights: defaultGapWeights,
        formulaParams: defaultFormulaConfig
      })

      return {
        isSuccess: true,
        message: "Effort config initialized with defaults",
        data: defaultEffortConfig
      }
    }

    const config = mapRowToEffortConfig(row)
    return {
      isSuccess: true,
      message: "Effort config loaded successfully",
      data: config
    }
  } catch (error) {
    console.error("Error loading effort config from database:", error)
    return { isSuccess: false, message: "Failed to load effort config" }
  }
}

export async function saveEffortConfigAction(
  config: EffortConfig
): Promise<ActionState<EffortConfig>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }

    // Upsert behavior: update if exists, else insert
    const payload = {
      id: CONFIG_ID,
      complexityWeights: config.complexityWeights,
      gapWeights: config.gapWeights,
      formulaParams: config.formulaParams
    }

    const [existing] = await db
      .select({ id: effortConfigTable.id })
      .from(effortConfigTable)
      .where(eq(effortConfigTable.id, CONFIG_ID))
      .limit(1)

    if (existing) {
      await db
        .update(effortConfigTable)
        .set({
          complexityWeights: payload.complexityWeights,
          gapWeights: payload.gapWeights,
          formulaParams: payload.formulaParams
        })
        .where(eq(effortConfigTable.id, CONFIG_ID))
    } else {
      await db.insert(effortConfigTable).values(payload)
    }

    return {
      isSuccess: true,
      message: "Effort config saved successfully",
      data: config
    }
  } catch (error) {
    console.error("Error saving effort config to database:", error)
    return { isSuccess: false, message: "Failed to save effort config" }
  }
}


