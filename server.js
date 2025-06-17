const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload and output directories exist
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "output");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

// File storage
const upload = multer({ dest: uploadDir });

app.use(express.static("public"));
app.use("/output", express.static(outputDir));

// Force download for generated files
app.get("/download/:name", (req, res) => {
    const file = path.join(outputDir, req.params.name);
    res.download(file, err => {
        if (err) {
            console.error("Download failed:", err.message);
            res.status(404).send("File not found.");
        }
    });
});

app.post("/api/convert", upload.single("audio"), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const inputPath = req.file.path;
    const outputName = `8d_${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, outputName);

    const ffmpegCmd = ffmpeg(inputPath)
        .audioFilters([
            "apulsator=hz=0.08",
            "aecho=0.8:0.9:1000|1800:0.3|0.25"
        ])
        .on("end", () => {
            fs.unlinkSync(inputPath);
            res.json({ url: `/download/${outputName}` });
        })
        .on("error", err => {
            console.error("Conversion failed:", err.message);
            res.status(500).send("Conversion failed.");
        })
        .save(outputPath);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
