"use server"

import { promises as fs } from "fs"
import path from "path"
import type {
  Client,
  UseCase,
  PlanningData,
  Complexity,
  GapLevel
} from "@/types/planning-types"
import { calculateManDays } from "./effort-formula"

const PLAN_SUMMARY_PATH = path.join(process.cwd(), "BG_PLAN_SUMMARY.md")

// Map story points to complexity
function mapStoryPointsToComplexity(storyPoints: number): Complexity {
  if (storyPoints <= 8) return "medium"
  if (storyPoints <= 13) return "high"
  return "high"
}

// Estimate gap from SDK gaps and required effort (returns GapLevel)
function estimateGap(sdkGaps?: string, requiredEffort?: string): GapLevel {
  let gapScore = 0

  // Count SDK gaps mentioned
  if (sdkGaps) {
    const gapCount = (sdkGaps.match(/•/g) || []).length
    gapScore += gapCount * 0.5
  }

  // Estimate from required effort complexity
  if (requiredEffort) {
    const effortCount = (requiredEffort.match(/•/g) || []).length
    gapScore += effortCount * 0.3

    // Check for high-complexity keywords
    const highComplexityKeywords = [
      "infrastructure",
      "SDK",
      "extend",
      "build",
      "create",
      "integrate"
    ]
    const keywordMatches = highComplexityKeywords.filter((keyword) =>
      requiredEffort.toLowerCase().includes(keyword)
    ).length
    gapScore += keywordMatches * 0.2
  }

  // Default gap if nothing found
  if (gapScore === 0) gapScore = 2

  // Map to GapLevel - ensure integer then convert to string enum
  const gapLevel = Math.round(gapScore)
  if (gapLevel <= 1) return "sdk-native"
  if (gapLevel <= 2) return "minor-extension"
  if (gapLevel <= 3) return "moderate-extension"
  if (gapLevel <= 4) return "significant-extension"
  return "custom-implementation"
}

// Parse clients and use cases from markdown
export async function parsePlanSummary(): Promise<PlanningData> {
  try {
    const content = await fs.readFile(PLAN_SUMMARY_PATH, "utf-8")
    const clients: Client[] = []
    const useCases: UseCase[] = []

    // Client data from the markdown
    const clientData = [
      {
        name: "Standard Bank Group",
        description:
          "Largest financial institution in Africa. Uses Murex (flow trading - SA), Calypso (Africa), Alchemy (structuring)",
        systems: ["Murex", "Calypso", "Alchemy"]
      },
      {
        name: "Navigate (NAV)",
        description:
          "Fintech initiative of RMB, based in Republic of Ireland. Leverages existing bank technologies for capital-light non-banking initiatives",
        systems: ["Murex (multiple instances)"]
      },
      {
        name: "Momentum Group",
        description:
          "Buy-side player. Balance sheet management and LDI (Liability-Driven Investment) activities",
        systems: ["Murex"]
      },
      {
        name: "Sanlam Financial Markets",
        description:
          "Subsidiary of Sanlam (largest insurer in Africa). Asset Liability Management (ALM) and credit activities",
        systems: ["Murex"]
      }
    ]

    // Create clients
    const clientMap = new Map<string, string>()
    clientData.forEach((clientInfo, index) => {
      const clientId = `client-${index + 1}`
      const now = new Date().toISOString()
      clients.push({
        id: clientId,
        name: clientInfo.name,
        description: clientInfo.description,
        systems: clientInfo.systems,
        createdAt: now,
        updatedAt: now
      })
      clientMap.set(clientInfo.name, clientId)
    })

    // Parse use cases from the markdown content
    // Standard Bank Group use cases
    const standardBankUseCases = [
      {
        useCaseId: "US-1",
        title: "Natural Language Trade Input",
        description:
          "Input trade instructions using plain English without system-specific syntax",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5,
        sdkGaps:
          "• Domain-specific NLP model for trading terminology\n• Trade instruction parser/validator\n• Financial product ontology\n• Real-time feedback mechanism",
        requiredEffort:
          "• Black Glass development infrastructure setup\n• Context and prompt engineering to understand/describe trading landscape\n• Generic front-end design (Next.js app) for natural language input capture\n• Context engineering and build-up\n• Infrastructure setup (EC2 machines, deployment, Kubernetes)"
      },
      {
        useCaseId: "US-2",
        title: "Autonomous Cross-System Execution",
        description:
          "Automatically execute trades across Alchemy, Murex EQD, Murex MXCORE",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 37.5,
        sdkGaps:
          "• Multi-system connector/adapter framework\n• Cross-system dependency orchestration\n• Transaction state management across systems\n• Alchemy-specific integration layer",
        requiredEffort:
          "• Extend Black Glass SDK to support Windows Accessibility API (for Alchemy C# application)\n• Alternative: Create custom process to attach to Alchemy launch screen to traverse UI tree\n• Integrate Windows Accessibility API or custom UI tree for Alchemy into existing SDK\n• Build frontend to capture scope of trades\n• Context engineering and knowledge capacity building\n• Automate rules for system decision-making in product selection and orchestration\n• Build feedback mechanism to show aggregated results\n• Infrastructure setup (EC2, deployment, Kubernetes)"
      },
      {
        useCaseId: "US-3",
        title: "Structured Product Booking",
        description:
          "Book structured trade components in both Alchemy and appropriate Murex instance",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5,
        sdkGaps:
          "• Structured product decomposition logic\n• Component-to-system mapping engine\n• Cross-system referential integrity manager\n• Transaction sequencing/ordering",
        requiredEffort:
          "• Same as US-2 (includes Alchemy SDK expansion)\n• Build frontend wizard to capture selected scope products\n• Context engineering to define rules for system identification and execution\n• Build deterministic split logic for trades"
      },
      {
        useCaseId: "US-4",
        title: "Multi-Instance Murex Routing",
        description:
          "Automatically determine correct Murex instance(s) for each trade",
        storyPoints: 8,
        complexity: "medium" as Complexity,
        manDays: 17.5,
        sdkGaps:
          "• Trade characteristic analyzer\n• Business rules engine for routing\n• Multi-instance coordination logic\n• Instance discovery/registry",
        requiredEffort:
          "• Front-end application (Next.js) - \"Murex Decision Maker\"\n• Embed rules and compliance information\n• Allow users to specify products\n• Support email uploads and pre-trade confirm uploads\n• User can describe trade, system provides pre-selection list\n• AI access with large context window to explain rules"
      },
      {
        useCaseId: "US-5",
        title: "Transaction Status & Error Handling",
        description:
          "Clear status updates and error messages during processing",
        storyPoints: 8,
        complexity: "medium" as Complexity,
        manDays: 0,
        sdkGaps:
          "• Real-time status event system\n• Cross-system error aggregation\n• Partial failure detection\n• Rollback/compensation transaction framework",
        requiredEffort: "Consolidated into US-2 and US-3"
      },
      {
        useCaseId: "US-6",
        title: "Alchemy-Murex Integration Flow",
        description:
          "Seamless handoff from structuring (Alchemy) to settlement (Murex)",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5,
        sdkGaps:
          "• Alchemy-to-Murex data transformation\n• Workflow orchestration engine\n• Integration touchpoint handlers\n• Lifecycle tracking across systems",
        requiredEffort: "Same exact requirements as US-3"
      }
    ]

    // Navigate (NAV) use cases
    const navigateUseCases = [
      {
        useCaseId: "US-1",
        title: "Centralized Configuration Management",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-2",
        title: "Single Regression Testing",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-3",
        title: "Coordinated Version Upgrades",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 37.5
      },
      {
        useCaseId: "US-4",
        title: "License Cost Abstraction",
        storyPoints: 8,
        complexity: "medium" as Complexity,
        manDays: 17.5
      },
      {
        useCaseId: "US-5",
        title: "Agent-Based Instruction Execution",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-6",
        title: "Centralized Financial Static Data",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-7",
        title: "Centralized Non-Financial Static Data",
        storyPoints: 8,
        complexity: "medium" as Complexity,
        manDays: 17.5
      },
      {
        useCaseId: "US-8",
        title: "Centralized Trade Data Repository",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-9",
        title: "Multi-Instance Monitoring & Support",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      }
    ]

    // Momentum Group use cases
    const momentumUseCases = [
      {
        useCaseId: "US-1",
        title: "Automated Bond Creation from Pricing Supplement",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 37.5
      },
      {
        useCaseId: "US-2",
        title: "End-to-End Counterparty Creation",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 37.5
      },
      {
        useCaseId: "US-3",
        title: "Automated Portfolio Creation",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-4",
        title: "End-to-End Regression Test Orchestration",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-5",
        title: "Root Cause Analysis",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 0 // Out of scope
      },
      {
        useCaseId: "US-6",
        title: "Intelligent Root Cause Propagation",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 0 // Out of scope
      },
      {
        useCaseId: "US-7",
        title: "Workload Visibility and Metrics",
        storyPoints: 8,
        complexity: "medium" as Complexity,
        manDays: 17.5
      }
    ]

    // Sanlam Financial Markets use cases
    const sanlamUseCases = [
      {
        useCaseId: "US-1",
        title: "Accelerated Version Upgrades",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-2",
        title: "Alternative to MXTEST Subscription",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 0 // Consolidated with US-1
      },
      {
        useCaseId: "US-3",
        title: "Capture User Activity for Test Creation",
        storyPoints: 21,
        complexity: "high" as Complexity,
        manDays: 37.5
      },
      {
        useCaseId: "US-4",
        title: "Automated Test Pack for ALM Operations",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      },
      {
        useCaseId: "US-5",
        title: "Automated Test Pack for Credit Operations",
        storyPoints: 13,
        complexity: "high" as Complexity,
        manDays: 27.5
      }
    ]

    // Helper function to create use case
    const createUseCase = (
      clientName: string,
      useCaseData: {
        useCaseId: string
        title: string
        description?: string
        storyPoints: number
        complexity: Complexity
        manDays: number
        sdkGaps?: string
        requiredEffort?: string
      },
      index: number
    ): UseCase => {
      const clientId = clientMap.get(clientName)!
      const gap = estimateGap(useCaseData.sdkGaps, useCaseData.requiredEffort)
      const calculatedManDays =
        useCaseData.manDays > 0
          ? useCaseData.manDays
          : calculateManDays(useCaseData.complexity, gap)

      const now = new Date().toISOString()
      return {
        id: `usecase-${index + 1}`,
        clientId,
        useCaseId: useCaseData.useCaseId,
        title: useCaseData.title,
        description: useCaseData.description,
        complexity: useCaseData.complexity,
        gap,
        manDays: calculatedManDays,
        sdkGaps: useCaseData.sdkGaps,
        status: "high-level definition",
        priority: 0,
        createdAt: now,
        updatedAt: now
      }
    }

    // Add all use cases
    let useCaseIndex = 0

    // Standard Bank
    standardBankUseCases.forEach((uc) => {
      useCases.push(createUseCase("Standard Bank Group", uc, useCaseIndex++))
    })

    // Navigate
    navigateUseCases.forEach((uc) => {
      useCases.push(
        createUseCase("Navigate (NAV)", { ...uc, description: "" }, useCaseIndex++)
      )
    })

    // Momentum
    momentumUseCases.forEach((uc) => {
      useCases.push(
        createUseCase("Momentum Group", { ...uc, description: "" }, useCaseIndex++)
      )
    })

    // Sanlam
    sanlamUseCases.forEach((uc) => {
      useCases.push(
        createUseCase("Sanlam Financial Markets", { ...uc, description: "" }, useCaseIndex++)
      )
    })

    return {
      developers: [],
      clients,
      useCases,
      tasks: [],
      dependencies: [],
      projectStartDate: undefined
    }
  } catch (error) {
    console.error("Error parsing plan summary:", error)
    // Return empty structure if parsing fails
    return {
      developers: [],
      clients: [],
      useCases: [],
      tasks: [],
      dependencies: [],
      projectStartDate: undefined
    }
  }
}

