interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimit {
  private store: RateLimitStore = {}
  private limits = {
    general: { requests: 100, window: 60 * 1000 },
    admin: { requests: 20, window: 60 * 1000 },
    login: { requests: 5, window: 15 * 60 * 1000 }
  }

  async check(identifier: string, context: keyof typeof this.limits = 'general') {
    const key = `${context}:${identifier}`
    const limit = this.limits[context]
    const now = Date.now()
    
    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + limit.window
      }
      return {
        success: true,
        limit: limit.requests,
        remaining: limit.requests - 1,
        reset: this.store[key].resetTime
      }
    }

    if (this.store[key].count >= limit.requests) {
      return {
        success: false,
        limit: limit.requests,
        remaining: 0,
        reset: this.store[key].resetTime
      }
    }

    this.store[key].count++
    return {
      success: true,
      limit: limit.requests,
      remaining: limit.requests - this.store[key].count,
      reset: this.store[key].resetTime
    }
  }

  cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key]
      }
    })
  }
}

export const rateLimit = new RateLimit()

setInterval(() => {
  rateLimit.cleanup()
}, 5 * 60 * 1000)