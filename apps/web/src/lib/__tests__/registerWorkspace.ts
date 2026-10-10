// Như packages/sections: node:test dùng JS thật do cùng lượt tsc sinh ra cho workspace exports TS.
import { resolve } from "node:path";

for (const name of ["core", "ui", "sections"]) {
  const compiled = require.resolve(resolve(__dirname, `../../../../../packages/${name}/src/index.js`));
  require(compiled);
  require.cache[require.resolve(`@solar/${name}`)] = require.cache[compiled];
}
