import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to parse use case IDs for alphanumeric sorting (e.g., US-1, US-2, US-10)
export function parseUseCaseId(useCaseId: string): { prefix: string; number: number } {
  const match = useCaseId.match(/^([A-Za-z-]+)(\d+)$/)
  if (match) {
    return { prefix: match[1], number: parseInt(match[2], 10) }
  }
  return { prefix: useCaseId, number: 0 }
}

// Compare use case IDs alphanumerically (US-1 < US-2 < US-10)
export function compareUseCaseIds(a: string, b: string): number {
  const parsedA = parseUseCaseId(a)
  const parsedB = parseUseCaseId(b)

  // First compare prefixes
  const prefixCompare = parsedA.prefix.localeCompare(parsedB.prefix)
  if (prefixCompare !== 0) return prefixCompare

  // Then compare numbers
  return parsedA.number - parsedB.number
}
