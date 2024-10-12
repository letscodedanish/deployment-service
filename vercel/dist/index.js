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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_git_1 = __importDefault(require("simple-git"));
const utils_1 = require("./utils");
const file_1 = require("./file");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const aws_1 = require("./aws");
const redis_1 = require("redis");
const publisher = (0, redis_1.createClient)();
publisher.connect();
const subscriber = (0, redis_1.createClient)();
subscriber.connect();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoUrl = req.body.repoUrl;
    const id = (0, utils_1.generate)(); // Example id: zadzn
    const projectPath = path_1.default.join(__dirname, `output/${id}`);
    // Clone the repo
    yield (0, simple_git_1.default)().clone(repoUrl, projectPath);
    // Run npm install and build
    const exec = require("child_process").exec;
    exec(`cd ${projectPath} && npm install && npm run build`, (err, stdout, stderr) => {
        if (err) {
            console.error("Build error:", stderr);
            res.status(500).json({ error: "Build failed" });
            return;
        }
        console.log("Build output:", stdout);
        // After the build, check if the dist folder exists
        const distPath = path_1.default.join(projectPath, "dist");
        if (!fs_1.default.existsSync(distPath)) {
            res.status(500).json({ error: "dist folder not found after build" });
            return;
        }
        // Upload files
        const files = (0, file_1.getAllFiles)(distPath);
        files.forEach((file) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, aws_1.uploadFile)(file.slice(__dirname.length + 1), file);
        }));
        // Push build id to Redis queue
        publisher.lPush("build-queue", id);
        publisher.hSet("status", id, "uploaded");
        res.json({ id });
    });
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const response = yield subscriber.hGet("status", id);
    res.json({
        status: response
    });
}));
app.listen(3000);
