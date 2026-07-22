// questionGenService.js
//
// Uses Google's Gemini API (free tier, no credit card, no expiration).
// Get a key at https://aistudio.google.com -> "Get API key"
// Put it in backend/.env as GEMINI_API_KEY=xxxxx
// No extra npm package needed - this uses plain fetch (Node 18+ has it built in).

const GEMINI_MODEL = "gemini-2.5-flash"; // free-tier model, 1,500 requests/day
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function generateQuestionsFromNotes(topicName, notesText, pyqText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in backend/.env");
  }

  const prompt = `You are helping a student practice for an exam on the topic "${topicName}".

Below is the student's own notes on this topic:
"""
${notesText.slice(0, 12000)}
"""

${
  pyqText
    ? `Here are previous year exam questions (PYQs) on this subject, to match their style, format, and difficulty pattern:
"""
${pyqText.slice(0, 8000)}
"""`
    : ""
}

Generate 8 new practice questions based on the notes above${
    pyqText ? ", matching the style and format of the PYQs" : ""
  }. Mix difficulty levels and question types (MCQ, short answer, long answer).

Respond with ONLY a JSON array, no other text, no markdown code fences, in this exact shape:
[
  {
    "question": "...",
    "type": "mcq" | "short" | "long",
    "options": ["...", "..."],
    "answer": "...",
    "difficulty": "easy" | "medium" | "hard"
  }
]
Omit "options" entirely for non-mcq questions.`;

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini API request failed");
  }

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Could not parse questions from the AI response");
  }
}

module.exports = { generateQuestionsFromNotes };
