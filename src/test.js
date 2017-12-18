// const context = require.context('./src/', true, /\.spec\.ts$/);
const context = require.context('./', true, /\.spec.ts$/);

context.keys().forEach(context);
