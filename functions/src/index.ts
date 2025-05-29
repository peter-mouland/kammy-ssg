import { onRequest } from "firebase-functions/v2/https";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import path from "node:path";

const app = express();

// Debug: Log the working directory
console.log("Functions working directory:", process.cwd());
console.log("__dirname:", __dirname);

// Serve static assets from copied build
const staticPath = path.join(__dirname, "../build/client");
console.log("Static path:", staticPath);
app.use(express.static(staticPath, {
    immutable: true,
    maxAge: '1y'
}));

// SSR handler with copied build
const serverBuildPath = path.join(__dirname, "../build/server/index.js");
console.log("Server build path:", serverBuildPath);

app.all("*", createRequestHandler({
    build: async () => {
        console.log("Loading server build from:", serverBuildPath);
        try {
            const build = await import(serverBuildPath);
            console.log("Server build loaded successfully");
            return build;
        } catch (error) {
            console.error("Failed to load server build:", error);
            throw error;
        }
    },
    getLoadContext: (req, res) => {
        // PASS BODY THROUGH CONTEXT TO GET FORM DATA ON FIREBASE
        return req.body
    },
    mode: process.env.NODE_ENV || "production",
}));

export const ssr = onRequest(
    {
        memory: "1GiB",
        timeoutSeconds: 60,
        cors: true
    },
    app
);

export const api = onRequest({ cors: true }, async (req, res) => {
    res.json({ status: 'ok', path: req.path });
});
