import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { YSocketIO } from "y-socket.io/dist/server"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { spawn } from "child_process"

const app = express()
app.use(express.json({ limit: "1mb" }))

app.use(express.static("public"))

const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()


app.get("/health", (req, res) => {
    res.status(200).json({ message: "ok", success: true })
})

function runProcess(command, args, cwd, timeoutMs = 10000) {
    return new Promise((resolve) => {
        const child = spawn(command, args, { cwd })
        let stdout = ""
        let stderr = ""
        let timedOut = false

        const timer = setTimeout(() => {
            timedOut = true
            child.kill("SIGKILL")
        }, timeoutMs)

        child.stdout.on("data", (data) => {
            stdout += data.toString()
        })

        child.stderr.on("data", (data) => {
            stderr += data.toString()
        })

        child.on("error", (err) => {
            clearTimeout(timer)
            resolve({ exitCode: 1, stdout, stderr: err.message })
        })

        child.on("close", (exitCode) => {
            clearTimeout(timer)
            resolve({
                exitCode: timedOut ? 124 : exitCode ?? 1,
                stdout,
                stderr: timedOut ? "Execution timed out after 10 seconds." : stderr,
            })
        })
    })
}

async function executeByLanguage(language, code, workDir) {
    if (language === "python") {
        const filename = path.join(workDir, "main.py")
        await fs.writeFile(filename, code, "utf8")
        return runProcess("python3", [filename], workDir)
    }

    if (language === "cpp") {
        const source = path.join(workDir, "main.cpp")
        const output = path.join(workDir, "main")
        await fs.writeFile(source, code, "utf8")
        const compileResult = await runProcess("g++", [source, "-std=c++17", "-O2", "-o", output], workDir)
        if (compileResult.exitCode !== 0) return compileResult
        return runProcess(output, [], workDir)
    }

    if (language === "java") {
        const source = path.join(workDir, "Main.java")
        await fs.writeFile(source, code, "utf8")
        const compileResult = await runProcess("javac", [source], workDir)
        if (compileResult.exitCode !== 0) return compileResult
        return runProcess("java", ["-cp", workDir, "Main"], workDir)
    }

    return {
        exitCode: 1,
        stdout: "",
        stderr: "Unsupported language. Use one of: java, python, cpp.",
    }
}

app.post("/api/execute", async (req, res) => {
    const { language, code } = req.body ?? {}
    if (!language || typeof language !== "string") {
        return res.status(400).json({ success: false, message: "language is required" })
    }
    if (!code || typeof code !== "string") {
        return res.status(400).json({ success: false, message: "code is required" })
    }

    let workDir = ""
    try {
        workDir = await fs.mkdtemp(path.join(os.tmpdir(), "coedit-compile-"))
        const result = await executeByLanguage(language, code, workDir)
        return res.status(200).json({
            success: true,
            language,
            ...result,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown execution error",
        })
    } finally {
        if (workDir) {
            await fs.rm(workDir, { recursive: true, force: true })
        }
    }
})

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000")
})