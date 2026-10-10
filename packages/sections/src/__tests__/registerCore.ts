// Workspace export trỏ tới TS; node:test dùng bản JS thật do cùng lượt tsc sinh ra.
import { resolve } from "node:path";

const compiled = require.resolve(resolve(__dirname, "../../../core/src/index.js"));
require(compiled);
require.cache[require.resolve("@solar/core")] = require.cache[compiled];
