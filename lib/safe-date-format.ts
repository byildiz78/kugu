export function safeFormatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  
  try {
    if (typeof date === 'string') {
      return date
    }
    
    if (date instanceof Date) {
      return date.toISOString()
    }
    
    // Fallback: try to create Date from value
    return new Date(date).toISOString()
  } catch (error) {
    console.warn('Date formatting error:', error, 'Input:', date)
    return String(date)
  }
}

export function safeDateValue(date: Date | string | null | undefined): string {
  if (!date) return ''
  
  try {
    if (typeof date === 'string') {
      return date
    }
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    
    return new Date(date).toISOString().split('T')[0]
  } catch (error) {
    console.warn('Date value error:', error, 'Input:', date)
    return ''
  }
}