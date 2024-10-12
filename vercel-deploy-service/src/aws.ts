import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";

const s3 = new S3({
    accessKeyId: "19352b2d4f343dce7b88fe037113abf9",
    secretAccessKey: "e51f36ed4b07ed036f3d0406834be3b01c660735360b1d07590471651d99c19c",
    endpoint: "https://ad08bde786909448bfaac2692349abd4.r2.cloudflarestorage.com",
    s3ForcePathStyle: true
})

// output/asdasd
export async function downloadS3Folder(prefix: string) {
    try {
        const allFiles = await s3.listObjectsV2({
            Bucket: "vercel",
            Prefix: prefix
        }).promise();

        if (!allFiles.Contents) {
            console.log("No files found.");
            return;
        }

        const downloadPromises = allFiles.Contents.map(async ({ Key }) => {
            if (!Key) return;

            const finalOutputPath = path.join(__dirname, Key);
            const dirName = path.dirname(finalOutputPath);

            // Create directory if it doesn't exist
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }

            const outputFile = fs.createWriteStream(finalOutputPath);
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
        });

        await Promise.all(downloadPromises);
        console.log("All files downloaded successfully.");
    } catch (error) {
        console.error("Error downloading folder:", error);
    }
}

export function copyFinalDist(id: string) {
    const folderPath = path.join(`E:/100x-projects/vercel/vercel/dist`, `output/${id}/dist`);
    if (!fs.existsSync(folderPath)) {
        console.error(`Directory not found: ${folderPath}`);
        return;
    }

    const allFiles = getAllFiles(folderPath);
    allFiles.forEach(async (file) => {
        await uploadFile(`dist/${id}/` + path.relative(folderPath, file), file);
    });
}

const getAllFiles = (folderPath: string) => {
    let response: string[] = [];
    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
};

const uploadFile = async (fileName: string, localFilePath: string) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const response = await s3.upload({
            Body: fileContent,
            Bucket: "vercel",
            Key: fileName,
        }).promise();
        console.log("File uploaded successfully:", response);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
};