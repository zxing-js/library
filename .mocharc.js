const log = require('loglevel');
if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = 'info';
log.setLevel(process.env.LOG_LEVEL)

module.exports = {
  extension: ['js', 'ts'],
  timeout: 20000,
}
