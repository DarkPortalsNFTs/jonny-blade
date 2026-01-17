const { saveMemory, recentMemory } = require("./memory/store");

function localAnswer(prompt, memories) {
  const context = memories
    .slice()
    .reverse()
    .map((m) => `User: ${m.input}\nBladeAI: ${m.response}`)
    .join("\n\n");

  return `BladeAI (local)\n\nRecent context:\n${context || "(none yet)"}\n\nAnswer:\nI can help with grooming advice, product info, and site support.\n\nYou said: "${prompt}"\n\nTell me what you want: (1) product recommendation (2) shaving routine (3) beard care (4) site help.`;
}

async function chat({ userKey = "public", prompt }) {
  const memories = await recentMemory({ userKey, limit: 6 });
  const response = localAnswer(prompt, memories);
  await saveMemory({ userKey, input: prompt, response });
  return response;
}

module.exports = { chat };
