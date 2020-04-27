const { readFile, writeFile } = require("./utils");

const minimizeCss =  content => {
    content = content.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "");
    // now all comments, newlines and tabs have been removed
    content = content.replace(/ {2,}/g, " ");
    // now there are no more than single adjacent spaces left
    // now unnecessary: content = content.replace( /(\s)+\./g, ' .' );
    content = content.replace(/ ([{:}]) /g, "$1");
    content = content.replace(/([;,]) /g, "$1");
    content = content.replace(/ !/g, "!");
    return content;
}

const compileCss = async () => {
    const cssCode = await readFile("src/styles.css");

    return await writeFile("src/styles.ts", 'import { css } from "./lit-element"; const styles = css`' + minimizeCss(cssCode) + '`; export default styles;');
};

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

compileCss();
updateVersion();