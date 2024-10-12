import { S3 } from "aws-sdk";
import fs from "fs";

const s3 = new S3({
    accessKeyId: "19352b2d4f343dce7b88fe037113abf9",
    secretAccessKey: "e51f36ed4b07ed036f3d0406834be3b01c660735360b1d07590471651d99c19c",
    endpoint: "https://ad08bde786909448bfaac2692349abd4.r2.cloudflarestorage.com"
})

// fileName => output/12312/src/App.jsx
// filePath => /Users/harkiratsingh/vercel/dist/output/12312/src/App.jsx
export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
    }).promise();
    console.log(response);
}