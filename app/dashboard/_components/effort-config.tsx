"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { RefreshCw, Save, Info, Calculator, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import type { EffortConfig, Complexity, GapLevel, PlanningData } from "@/types/planning-types"
import {
  defaultEffortConfig,
  complexityLabels,
  gapLevelLabels,
  calculateManDays
} from "@/lib/effort-formula"
import { useEffortConfig } from "@/lib/effort-config-context"
import { writePlanningDataWithFallback } from "@/lib/storage-db"
import { toast } from "sonner"

const complexityLevels: Complexity[] = ["low", "medium", "high"]
const gapLevels: GapLevel[] = [
  "sdk-native",
  "minor-extension",
  "moderate-extension",
  "significant-extension",
  "custom-implementation"
]

interface EffortConfigProps {
  data: PlanningData
  setData: (data: PlanningData) => void
}

export function EffortConfig({ data, setData }: EffortConfigProps) {
  const { config: contextConfig, saveConfig: saveContextConfig } = useEffortConfig()
  const [config, setConfig] = useState<EffortConfig>(defaultEffortConfig)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [exampleComplexity, setExampleComplexity] = useState<Complexity>("medium")
  const [exampleGap, setExampleGap] = useState<GapLevel>("moderate-extension")

  // Sync with context on mount
  useEffect(() => {
    setConfig(contextConfig)
  }, [contextConfig])

  // Calculate example breakdown
  const exampleCalculation = useMemo(() => {
    const complexityWeight = config.complexityWeights[exampleComplexity]
    const gapWeight = config.gapWeights[exampleGap]
    const { base, multiplier } = config.formulaParams[exampleComplexity]
    const weightProduct = complexityWeight * gapWeight
    const scaledProduct = weightProduct * multiplier
    const total = base + scaledProduct

    return {
      complexityWeight,
      gapWeight,
      base,
      multiplier,
      weightProduct,
      scaledProduct,
      total
    }
  }, [config, exampleComplexity, exampleGap])

  // Generate comparison examples for the selected complexity
  const comparisonExamples = useMemo(() => {
    return gapLevels.map((gap) => {
      const complexityWeight = config.complexityWeights[exampleComplexity]
      const gapWeight = config.gapWeights[gap]
      const { base, multiplier } = config.formulaParams[exampleComplexity]
      const total = base + complexityWeight * gapWeight * multiplier
      return {
        gap,
        gapWeight,
        total,
        isSelected: gap === exampleGap
      }
    })
  }, [config, exampleComplexity, exampleGap])

  const handleComplexityWeightChange = (level: Complexity, value: string) => {
    const numValue = parseFloat(value) || 0
    setConfig((prev) => ({
      ...prev,
      complexityWeights: {
        ...prev.complexityWeights,
        [level]: numValue
      }
    }))
    setHasChanges(true)
  }

  const handleGapWeightChange = (level: GapLevel, value: string) => {
    const numValue = parseFloat(value) || 0
    setConfig((prev) => ({
      ...prev,
      gapWeights: {
        ...prev.gapWeights,
        [level]: numValue
      }
    }))
    setHasChanges(true)
  }

  const handleFormulaParamChange = (
    complexity: Complexity,
    param: "base" | "multiplier",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0
    setConfig((prev) => ({
      ...prev,
      formulaParams: {
        ...prev.formulaParams,
        [complexity]: {
          ...prev.formulaParams[complexity],
          [param]: numValue
        }
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save config to database via context
      saveContextConfig(config)

      // Recalculate all use cases with new config
      const updatedUseCases = data.useCases.map((useCase) => ({
        ...useCase,
        manDays: calculateManDays(useCase.complexity, useCase.gap, config),
        updatedAt: new Date().toISOString()
      }))

      const updatedData: PlanningData = {
        ...data,
        useCases: updatedUseCases
      }

      // Persist to storage/database
      await writePlanningDataWithFallback(updatedData)

      // Update local state
      setData(updatedData)
      setHasChanges(false)

      toast.success("Effort configuration saved", {
        description: `Recalculated ${updatedUseCases.length} use cases with new weights`
      })
    } catch (error) {
      console.error("Error saving effort config:", error)
      toast.error("Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(defaultEffortConfig)
    setHasChanges(true)
  }

  // Generate preview matrix
  const previewMatrix = useMemo(() => {
    return complexityLevels.map((complexity) => ({
      complexity,
      values: gapLevels.map((gap) => ({
        gap,
        manDays: calculateManDays(complexity, gap, config)
      }))
    }))
  }, [config])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Effort Configuration</h2>
          <p className="text-muted-foreground">
            Configure weights and parameters for effort estimation calculations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Recalculate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Interactive Example Calculator */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Interactive Example Calculator
          </CardTitle>
          <CardDescription>
            Select a complexity and gap level to see exactly how the effort is calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selectors */}
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label>Complexity Level</Label>
              <Select
                value={exampleComplexity}
                onValueChange={(v) => setExampleComplexity(v as Complexity)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {complexityLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {complexityLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gap Level</Label>
              <Select
                value={exampleGap}
                onValueChange={(v) => setExampleGap(v as GapLevel)}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gapLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {gapLevelLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step-by-step calculation */}
          <div className="rounded-lg border bg-background p-4">
            <h4 className="mb-4 font-semibold text-lg">
              Calculation for {complexityLabels[exampleComplexity]} + {gapLevelLabels[exampleGap]}
            </h4>

            <div className="space-y-4">
              {/* Formula display */}
              <div className="rounded bg-muted p-3 font-mono text-sm">
                <span className="text-muted-foreground">Formula:</span>{" "}
                <span className="text-primary">base</span> + (
                <span className="text-blue-600 dark:text-blue-400">complexity_weight</span> ×
                <span className="text-green-600 dark:text-green-400">gap_weight</span> ×
                <span className="text-orange-600 dark:text-orange-400">multiplier</span>)
              </div>

              {/* Step 1: Show values */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded border p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Base</div>
                  <div className="text-2xl font-bold text-primary">{exampleCalculation.base}</div>
                  <div className="text-xs text-muted-foreground">({exampleComplexity} complexity)</div>
                </div>
                <div className="rounded border p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Complexity Weight</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{exampleCalculation.complexityWeight}</div>
                  <div className="text-xs text-muted-foreground">({exampleComplexity})</div>
                </div>
                <div className="rounded border p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Gap Weight</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{exampleCalculation.gapWeight}</div>
                  <div className="text-xs text-muted-foreground">({gapLevelLabels[exampleGap]})</div>
                </div>
                <div className="rounded border p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Multiplier</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{exampleCalculation.multiplier}</div>
                  <div className="text-xs text-muted-foreground">({exampleComplexity} complexity)</div>
                </div>
              </div>

              {/* Step 2: Show calculation steps */}
              <div className="space-y-2 rounded border p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Step 1:</span>
                  <span className="text-blue-600 dark:text-blue-400">{exampleCalculation.complexityWeight}</span>
                  <span>×</span>
                  <span className="text-green-600 dark:text-green-400">{exampleCalculation.gapWeight}</span>
                  <span>=</span>
                  <span className="font-mono font-bold">{exampleCalculation.weightProduct.toFixed(2)}</span>
                  <span className="text-muted-foreground">(weight product)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Step 2:</span>
                  <span className="font-mono">{exampleCalculation.weightProduct.toFixed(2)}</span>
                  <span>×</span>
                  <span className="text-orange-600 dark:text-orange-400">{exampleCalculation.multiplier}</span>
                  <span>=</span>
                  <span className="font-mono font-bold">{exampleCalculation.scaledProduct.toFixed(2)}</span>
                  <span className="text-muted-foreground">(scaled product)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Step 3:</span>
                  <span className="text-primary">{exampleCalculation.base}</span>
                  <span>+</span>
                  <span className="font-mono">{exampleCalculation.scaledProduct.toFixed(2)}</span>
                  <span>=</span>
                  <motion.span
                    key={exampleCalculation.total}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="rounded bg-primary px-2 py-1 font-mono font-bold text-primary-foreground"
                  >
                    {exampleCalculation.total.toFixed(1)} man-days
                  </motion.span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison: Same complexity, different gaps */}
          <div className="rounded-lg border bg-background p-4">
            <h4 className="mb-3 font-semibold">
              Compare: {complexityLabels[exampleComplexity]} complexity across all gap levels
            </h4>
            <div className="flex flex-wrap gap-2">
              {comparisonExamples.map((example) => (
                <motion.div
                  key={example.gap}
                  initial={example.isSelected ? { scale: 1.05 } : {}}
                  animate={{ scale: 1 }}
                  className={`rounded border p-3 text-center min-w-[120px] cursor-pointer transition-colors ${
                    example.isSelected
                      ? "border-primary bg-primary/10"
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setExampleGap(example.gap)}
                >
                  <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {gapLevelLabels[example.gap]}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ×{example.gapWeight}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={`font-mono font-bold ${example.isSelected ? "text-primary" : ""}`}>
                      {example.total.toFixed(1)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Complexity Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Complexity Weights
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Complexity weights multiply with gap weights to scale the
                      effort estimation. Higher complexity = more effort.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Set the weight multiplier for each complexity level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {complexityLevels.map((level) => (
              <div key={level} className="flex items-center gap-4">
                <Label className="w-24 font-medium">{complexityLabels[level]}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.complexityWeights[level]}
                  onChange={(e) => handleComplexityWeightChange(level, e.target.value)}
                  className="w-24"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gap Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Gap Weights
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Gap weights represent how much SDK extension is needed.
                      Higher gap = more custom development work.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Set the weight for each SDK gap level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gapLevels.map((level) => (
              <div key={level} className="flex items-center gap-4">
                <Label className="w-40 font-medium">{gapLevelLabels[level]}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.gapWeights[level]}
                  onChange={(e) => handleGapWeightChange(level, e.target.value)}
                  className="w-24"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Formula Parameters */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Formula Parameters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Formula: <code>base + (complexity_weight × gap_weight × multiplier)</code>
                    </p>
                    <p className="mt-1">
                      Base is the minimum effort, multiplier scales the weight product.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Configure base values and multipliers per complexity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {complexityLevels.map((level) => (
                <div key={level} className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-semibold">{complexityLabels[level]} Complexity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="w-20">Base</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={config.formulaParams[level].base}
                        onChange={(e) =>
                          handleFormulaParamChange(level, "base", e.target.value)
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">man-days</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-20">Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={config.formulaParams[level].multiplier}
                        onChange={(e) =>
                          handleFormulaParamChange(level, "multiplier", e.target.value)
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Effort Preview Matrix</CardTitle>
            <CardDescription>
              Preview calculated man-days for each complexity/gap combination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left font-medium">Complexity / Gap</th>
                    {gapLevels.map((gap) => (
                      <th key={gap} className="p-2 text-center font-medium text-xs">
                        {gapLevelLabels[gap]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewMatrix.map((row) => (
                    <tr key={row.complexity} className="border-b">
                      <td className="p-2 font-medium">
                        {complexityLabels[row.complexity]}
                      </td>
                      {row.values.map(({ gap, manDays }) => (
                        <td key={gap} className="p-2 text-center">
                          <motion.span
                            key={manDays}
                            initial={{ scale: 1.2, color: "#3b82f6" }}
                            animate={{ scale: 1, color: "inherit" }}
                            transition={{ duration: 0.3 }}
                            className="inline-block rounded bg-muted px-2 py-1 text-sm font-mono"
                          >
                            {manDays.toFixed(1)}
                          </motion.span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Values shown in man-days. Formula:{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                base + (complexity_weight × gap_weight × multiplier)
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
