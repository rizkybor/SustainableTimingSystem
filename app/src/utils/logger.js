/* eslint-disable no-console */
const enabled = process.env.VUE_APP_ENV === "development" || process.env.VUE_APP_ENV === "lan";

export const logger = {
  info:  (...args) => enabled && console.info(...args),
  warn:  (...args) => enabled && console.warn(...args),
  error: (...args) => enabled && console.error(...args),
  debug: (...args) => enabled && console.debug(...args),
};
/* eslint-enable no-console */