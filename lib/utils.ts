import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function estimateTime(numLeads: number, source: string): string {
  // Rough estimates based on source
  const timePerLead = source === 'google_maps' ? 3 : 6 // seconds per lead
  const totalSeconds = numLeads * timePerLead
  
  if (totalSeconds < 60) {
    return `~${totalSeconds} seconds`
  } else if (totalSeconds < 3600) {
    const minutes = Math.ceil(totalSeconds / 60)
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    const hours = Math.ceil(totalSeconds / 3600)
    return `~${hours} hour${hours > 1 ? 's' : ''}`
  }
}
