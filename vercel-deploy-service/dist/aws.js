"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFinalDist = exports.downloadS3Folder = void 0;
const aws_sdk_1 = require("aws-sdk");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const s3 = new aws_sdk_1.S3({
    accessKeyId: "19352b2d4f343dce7b88fe037113abf9",
    secretAccessKey: "e51f36ed4b07ed036f3d0406834be3b01c660735360b1d07590471651d99c19c",
    endpoint: "https://ad08bde786909448bfaac2692349abd4.r2.cloudflarestorage.com",
    s3ForcePathStyle: true
});
// output/asdasd
function downloadS3Folder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allFiles = yield s3.listObjectsV2({
                Bucket: "vercel",
                Prefix: prefix
            }).promise();
            if (!allFiles.Contents) {
                console.log("No files found.");
                return;
            }
            const downloadPromises = allFiles.Contents.map((_a) => __awaiter(this, [_a], void 0, function* ({ Key }) {
                if (!Key)
                    return;
                const finalOutputPath = path_1.default.join(__dirname, Key);
                const dirName = path_1.default.dirname(finalOutputPath);
                // Create directory if it doesn't exist
                if (!fs_1.default.existsSync(dirName)) {
                    fs_1.default.mkdirSync(dirName, { recursive: true });
                }
                const outputFile = fs_1.default.createWriteStream(finalOutputPath);
                return new Promise((resolve, reject) => {
                    s3.getObject({ Bucket: "vercel", Key })
                        .createReadStream()
                        .pipe(outputFile)
                        .on("finish", () => resolve(void 0))
                        .on("error", (error) => {
                        console.error(`Failed to download ${Key}:`, error);
                        reject(error);
                    });
                });
            }));
            yield Promise.all(downloadPromises);
            console.log("All files downloaded successfully.");
        }
        catch (error) {
            console.error("Error downloading folder:", error);
        }
    });
}
exports.downloadS3Folder = downloadS3Folder;
function copyFinalDist(id) {
    const folderPath = path_1.default.join(`E:/100x-projects/vercel/vercel/dist`, `output/${id}/dist`);
    if (!fs_1.default.existsSync(folderPath)) {
        console.error(`Directory not found: ${folderPath}`);
        return;
    }
    const allFiles = getAllFiles(folderPath);
    allFiles.forEach((file) => __awaiter(this, void 0, void 0, function* () {
        yield uploadFile(`dist/${id}/` + path_1.default.relative(folderPath, file), file);
    }));
}
exports.copyFinalDist = copyFinalDist;
const getAllFiles = (folderPath) => {
    let response = [];
    const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        }
        else {
            response.push(fullFilePath);
        }
    });
    return response;
};
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileContent = fs_1.default.readFileSync(localFilePath);
        const response = yield s3.upload({
            Body: fileContent,
            Bucket: "vercel",
            Key: fileName,
        }).promise();
        console.log("File uploaded successfully:", response);
    }
    catch (error) {
        console.error("Error uploading file:", error);
    }
});
