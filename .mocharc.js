const log = require('loglevel');
if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = 'info';
log.setLevel(process.env.LOG_LEVEL)

module.exports = {
  spec: 'src/test/**/*.spec.ts',
  extension: ['js', 'ts'],
  timeout: 20000,
}
