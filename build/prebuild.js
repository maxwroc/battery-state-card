const { readFile, writeFile } = require("./utils");

// Updates version printed in console window
const updateVersion = async () => {
    const filePath = "src/utils.ts";
    const pkg = require("./../package.json");
    const utils = await readFile(filePath);
    const updatedUtils = utils.replace(/"%c BATTERY-STATE-CARD %c [0-9]+.[0-9]+.[0-9]+"/gm, `"%c BATTERY-STATE-CARD %c ${pkg.version}"`);
    if (utils !== updatedUtils) {
        await writeFile(filePath, updatedUtils);
    }
}

updateVersion();