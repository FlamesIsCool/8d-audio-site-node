const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// File storage
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));
app.use("/output", express.static("output"));

app.post("/api/convert", upload.single("audio"), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const inputPath = req.file.path;
    const outputName = `8d_${Date.now()}.mp3`;
    const outputPath = path.join(__dirname, "output", outputName);

    const ffmpegCmd = ffmpeg(inputPath)
        .audioFilters([
            "apanner=0.08",
            "aecho=0.8:0.9:1000|1800:0.3|0.25",
            "areverb=50:100:50:0:100:-0" // reverb config
        ])
        .on("end", () => {
            fs.unlinkSync(inputPath);
            res.json({ url: `/output/${outputName}` });
        })
        .on("error", err => {
            console.error("Conversion failed:", err.message);
            res.status(500).send("Conversion failed.");
        })
        .save(outputPath);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
