const express = require("express");
const { chat } = require("../ai/assistant");

const router = express.Router();

router.get("/ai", (req, res) => res.render("ai"));

router.post("/ai/chat", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const userKey = req.sessionID || "public";
    const response = await chat({ userKey, prompt });
    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: "AI error" });
  }
});

module.exports = router;
