/* global require, process */
// CLI fault injection: keep the module loader's filesystem access working.
const fs = require("node:fs/promises");
const failure = process.env.BACKUP_TEST_FAILURE;
const file = process.env.BACKUP_TEST_FILE;
if (failure === "read") {
  const read = fs.readFile;
  fs.readFile = async (...args) => {
    if (args[0] === file) throw new Error("injected read EACCES");
    return read(...args);
  };
}
if (failure === "write") {
  const write = fs.writeFile;
  fs.writeFile = async (...args) => {
    await write(...args);
    if (String(args[0]).startsWith(`${file}.`)) throw new Error("injected write ENOSPC after partial file");
  };
}
if (failure === "rename") {
  const rename = fs.rename;
  fs.rename = async (...args) => {
    if (args[1] === file) throw new Error("injected rename EACCES");
    return rename(...args);
  };
}
