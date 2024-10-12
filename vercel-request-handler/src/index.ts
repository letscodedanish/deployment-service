import express from "express";
import { S3 } from "aws-sdk";

const s3 = new S3({
    accessKeyId: "19352b2d4f343dce7b88fe037113abf9",
    secretAccessKey: "e51f36ed4b07ed036f3d0406834be3b01c660735360b1d07590471651d99c19c",
    endpoint: "https://ad08bde786909448bfaac2692349abd4.r2.cloudflarestorage.com"
})

const app = express();

app.get("/*", async (req, res) => {
    // id.100xdevs.com
    const host = req.hostname;

    const id = host.split(".")[0];
    const filePath = req.path;

    const contents = await s3.getObject({
        Bucket: "vercel",
        Key: `dist/${id}${filePath}`
    }).promise();
    
    const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
    res.set("Content-Type", type);

    res.send(contents.Body);
})

app.listen(3001);