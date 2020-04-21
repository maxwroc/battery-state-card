const { getDirectoryFiles, createZipFile } = require("./utils");


const prepareReleaseFile = async () => {
    const filesToZip = await getDirectoryFiles("./dist/", ["js", "map"]);

    createZipFile(filesToZip, "./dist/battery-state-card.zip");
}

prepareReleaseFile();
