const { getDirectoryFiles, createZipFile } = require("./utils");

/**
 * Creates ZIP file with all the contents of dist fir
 */
const prepareReleaseFile = async () => {
    const filesToZip = await getDirectoryFiles("./dist/", ["js", "map"]);

    createZipFile(filesToZip, "./dist/battery-state-card.zip");
}

prepareReleaseFile();
