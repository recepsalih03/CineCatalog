type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (!this.isDevelopment && level === 'debug') {
      return
    }
    
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    switch (level) {
      case 'debug':
        console.log(`${prefix} ${message}`, ...args)
        break
      case 'info':
        console.info(`${prefix} ${message}`, ...args)
        break
      case 'warn':
        console.warn(`${prefix} ${message}`, ...args)
        break
      case 'error':
        console.error(`${prefix} ${message}`, ...args)
        break
    }
  }
  
  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args)
  }
  
  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args)
  }
  
  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args)
  }
  
  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args)
  }
  
  sanitize(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential']
    const sanitized = { ...(obj as Record<string, unknown>) }
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key])
      }
    }
    
    return sanitized
  }
}

export const logger = new Logger()