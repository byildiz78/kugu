import { assignCustomerToAutomaticSegments } from './segment-auto-assign'

// Simple in-memory queue for segment updates
const segmentUpdateQueue = new Map<string, NodeJS.Timeout>()
const DEBOUNCE_DELAY = 2000 // 2 seconds

/**
 * Debounced version of assignCustomerToAutomaticSegments
 * Prevents multiple rapid calls for the same customer
 */
export function queueSegmentUpdate(customerId: string) {
  // Clear existing timeout for this customer
  const existingTimeout = segmentUpdateQueue.get(customerId)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  
  // Set new timeout
  const timeout = setTimeout(async () => {
    segmentUpdateQueue.delete(customerId)
    try {
      await assignCustomerToAutomaticSegments(customerId)
    } catch (error) {
      console.error(`Error updating segments for customer ${customerId}:`, error)
    }
  }, DEBOUNCE_DELAY)
  
  segmentUpdateQueue.set(customerId, timeout)
}