const fs = require("fs");
const AdmZip = require("adm-zip");

exports.getDirectoryFiles = (path, extensions) => {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                console.log("err", err);
                reject(err);
                return;
            }

            resolve(files
                .filter(f =>
                    extensions.some(ext => f.endsWith("." + ext)))
                .map(f => path + f));
        });
    })
};

exports.createZipFile = (files, targetFile) => {
    const zip = new AdmZip();
    files.forEach(f => zip.addLocalFile(f));
    zip.writeZip(targetFile);
};

exports.readFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data.toString());
        });
    });
};

exports.writeFile = (filePath, content) => {
    return new Promise((resolve, reject) =>
        fs.writeFile(filePath, content, () => resolve()));
}