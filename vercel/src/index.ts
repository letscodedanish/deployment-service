
import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import fs from "fs";
import { uploadFile } from "./aws";
import { createClient } from "redis";
const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();

const app = express();
app.use(cors())
app.use(express.json());

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate(); // Example id: zadzn
    const projectPath = path.join(__dirname, `output/${id}`);

    // Clone the repo
    await simpleGit().clone(repoUrl, projectPath);

    // Run npm install and build
    const exec = require("child_process").exec;
    exec(`cd ${projectPath} && npm install && npm run build`, (err: Error | null, stdout: string, stderr: string) => {
        if (err) {
            console.error("Build error:", stderr);
            res.status(500).json({ error: "Build failed" });
            return;
        }
        console.log("Build output:", stdout);

        // After the build, check if the dist folder exists
        const distPath = path.join(projectPath, "dist");
        if (!fs.existsSync(distPath)) {
            res.status(500).json({ error: "dist folder not found after build" });
            return;
        }

        // Upload files
        const files = getAllFiles(distPath);
        files.forEach(async file => {
            await uploadFile(file.slice(__dirname.length + 1), file);
        });

        // Push build id to Redis queue
        publisher.lPush("build-queue", id);
        publisher.hSet("status", id, "uploaded");

        res.json({ id });
    });
});


app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({
        status: response
    })
})

app.listen(3000);
