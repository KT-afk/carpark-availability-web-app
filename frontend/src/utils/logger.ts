const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true'

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDebugEnabled) {
      console.debug(...args)
    }
  },
  info: (...args: unknown[]) => {
    if (isDebugEnabled) {
      console.info(...args)
    }
  }
}
