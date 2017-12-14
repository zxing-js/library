var context = require.context('./tests', true, /\.ts$/);
context.keys().forEach(context);
module.exports = context;
