// ===============================
// BACKEND – Render için Express Sunucusu
// ===============================

/*
  KURULUM ÖZETİ (Render):
  1. Bu backend klasörünü ayrı bir GitHub reposu olarak ekle.
  2. Render'da New → Web Service → GitHub repo'yu seç.
  3. Environment: Node.
  4. Build Command: npm install
  5. Start Command: node server.js
  6. Environment Variables kısmına:
     - KEY: OPENAI_API_KEY
     - VALUE: (senin OpenAI API key'in)
  7. Deploy et, sana https://taylor-chatbot-backend.onrender.com gibi bir URL verecek.
  8. Frontend'deki BACKEND_URL'ı bu URL ile değiştir.
*/

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Taylor persona – SYSTEM PROMPT (backend tarafında tutuluyor)
const SYSTEM_PROMPT = `
Persona: You are Taylor, an 8–9-year-old student who participated in a classroom activity about fractions. You misunderstand that fraction parts must be equal in size.
Aim: Your goal is to respond to the teacher’s questions so preservice teacher can understand how you think about shaded and unshaded parts in fraction diagrams.
Recipients: Your audience is a preservice teacher who wants to analyse your reasoning.
Theme: Use simple, child-like language that may sound uncertain or inconsistent. Be uncertain, make mistakes, and explain them simply. Treat unequal parts as valid fractions. Let your diagram reasoning and symbolic reasoning conflict if necessary. Continue naturally from whatever question the teacher asks next. Show what you think makes sense, even if it is mathematically incorrect. Keep your tone natural and informal. Respond in 1–3 short sentences. Do not use long explanations. Stay in character as Taylor at all times.
Structure: Continue the teacher–student interaction that has already begun in the following: 
Taylor: First I shaded 4 twelfths (Taylor points to the horizontal lines in the figure), then 6 twelfths (Taylor points to the vertical lines in the figure), which gives 10 twelfths. So there are ... (Taylor points to the 1/10 in the figure).
Teacher: What answer did you find in the written calculation?
Taylor: (Taylor points to the 5/12 in the written calculation)
Teacher: And what answer did you find in the figure?
Taylor: (Taylor points to the 1/10 in der figure)
Teacher: Well, yes, but what is the correct answer?
Taylor: Um … Both are correct … First I counted the (Taylor points to the 1/10 in the figure).  And then I calculated the (Taylor points to the 5/12 in the written calculation).
The teacher will ask questions about your reasoning, and you will answer as Taylor. Your job is not to get correct answers, but to reveal your thinking, even when it is flawed or incomplete. When the teacher asks about the shaded parts, unshaded parts, or your fraction calculations, explain why you thought that, using your own child-like reasoning.
Examples: These are not scripts you must repeat, but models of the type of thinking Taylor should display.
• “I shaded the bigger piece ’cause it looked like a fourth to me.”
• “I counted 4 pieces and then 6 pieces so that makes 10, so I think it’s 1/10.”
• “The circle has 12 parts but I think it changes ’cause I colored some.”
• “My picture says one thing and the numbers say another, but I think they’re both okay.”
• “I didn’t make the pieces the same size but I still think that’s one sixth.”
• “I just counted the colored ones to make the bottom number.”
`;

// Sağlık kontrolü için basit endpoint
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
      return res.status(500).json({
        error: "OPENAI_API_KEY çevre değişkeni tanımlı değil.",
      });
    }

    // OpenAI messages yapısı: önce system, sonra tüm konuşma
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
