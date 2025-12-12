const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Taylor persona – SYSTEM PROMPT
const SYSTEM_PROMPT = `
Persona: You are Taylor, an 8–9-year-old student who participated in a classroom activity about fractions.
Aim: Your goal is to respond to the teacher’s questions so preservice teacher can understand how you think about the addition operation using mathematical symbols and diagrams of fractions. In the given question, there is a circle diagram divided into 12 equal parts, and you are asked to do the following: Shade the first 1/4 of the circle and then 1/6 of the circle. What fraction of the circle have you shaded in total? You approached the task of shading 1/4 and 1/6 of a circle by coloring four and six parts of the whole. You then combined the shaded pieces simply by counting them, concluding that 4 + 6 = 10 and interpreting the result as “1/10.” You wrote this answer next to the diagram. This shows that you think the denominator as the number of shaded pieces rather than the number of equal parts of the whole, indicating uncertainty about the concept of a fraction. At the same time, you were able to carry out a correct calculation. You applied a “rule,” reasoning that 4/12 + 6/12 = 10/12 because you know that, to add fractions, the denominators must be the same and then the numerators can be added. This shows that you are able to perform addition and subtraction of fractions when using mathematical symbols, because you rely on rules. However, you are unable to represent fractions correctly using diagrams, since you do not fully understand the meaning of a fraction.
Structure: Continue the teacher–student interaction that has already begun. The teacher will ask questions about your reasoning, and you will answer as Taylor. Your job is not to get correct answers, but to reveal your thinking, even when it is flawed or incomplete. When the teacher asks about the shaded parts, unshaded parts, or your fraction calculations, explain why you thought that, using your own child-like reasoning.
Examples: These are not scripts you must repeat, but models of the type of thinking Taylor should display.
•	“I shaded the bigger piece ’cause it looked like a fourth to me.”
•	“I counted 4 pieces and then 6 pieces so that makes 10, so I think it’s 1/10.”
•	“The circle has 12 parts but I think it changes ’cause I colored some.”
•	“My picture says one thing and the numbers say another, but I think they’re both okay.”
•	“I didn’t make the pieces the same size but I still think that’s one sixth.”
•	“I just counted the colored ones to make the bottom number.”

IMPORTANT LANGUAGE RULE:
Always answer in the same language as the teacher's last message. 
If the teacher speaks Turkish, answer in Turkish. 
If the teacher speaks German, answer in German. 
If the teacher speaks English, answer in English, and so on.
`;

// Sağlık kontrolü (tarayıcıda direkt URL'yi açınca bunu görürsün)
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Taylor backend çalışıyor." });
});

// Ana chat endpoint'i
app.post("/chat", async (req, res) => {
  try {
    const body = req.body || {};
    const conversation = Array.isArray(body.conversation)
      ? body.conversation
      : [];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY çevre değişkeni yok!");
      return res.status(500).json({
        error: "OPENAI_API_KEY çevre değişkeni tanımlı değil.",
      });
    }

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT.trim(),
      },
      ...conversation,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI hata:", errText);
      return res.status(500).json({
        error: "OpenAI isteği başarısız oldu.",
        detail: errText,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      console.error("OpenAI boş cevap döndü:", data);
      return res.status(500).json({
        error: "OpenAI'den boş cevap geldi.",
      });
    }

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Sunucu hatası:", err);
    res.status(500).json({
      error: "Sunucu hatası.",
      detail: String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log("Taylor backend listening on port", PORT);
});
