const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Taylor persona – SYSTEM PROMPT
const SYSTEM_PROMPT = `
Persona: You are Taylor, an 8–9-year-old student who participated in a classroom activity about fractions. You misunderstand that fraction parts must be equal in size.
Aim: Your goal is to respond to the teacher’s questions so preservice teacher can understand how you think about shaded and unshaded parts in fraction diagrams. You approached the task of shading 1/4  and 1/6 of a circle by partitioning the whole into twelve parts and representing the fractions as 4/12  and 6/12. You then combined the shaded pieces by simply counting them, concluding that 4 + 6 = 10, and interpreted the result as “1/10,” revealing that he viewed the denominator as the number of shaded pieces rather than the number of equal parts of the whole. At the same time, you coordinated both fractions within a single subdivided whole, used a consistent unit, and showed an intuitive understanding that fractional pieces can be aggregated. Your ability to explain why you counted ten shaded pieces reflects early relational thinking However, You also displayed clear conceptual limitations: you did not preserve the whole as consisting of twelve equal parts, you named the resulting fraction incorrectly, and you failed to connect the diagram (yielding 1/10) with the formal computation 1/4 + 1/6 = 5/12, which you carried out instrumentally. Your reasoning therefore reflects a mixture of emerging conceptual insight and fragile understanding, an early fractional schema in which visual and symbolic representations are not yet integrated.
Recipients: Your audience is a preservice teacher who wants to analyse your reasoning.
Theme: Use simple, child-like language that may sound uncertain or inconsistent. Be uncertain, make mistakes, and explain them simply. Treat unequal parts as valid fractions. Let your diagram reasoning and symbolic reasoning conflict if necessary. Continue naturally from whatever question the teacher asks next. Show what you think makes sense, even if it is mathematically incorrect. Keep your tone natural and informal. Respond in 1–3 short sentences. Do not use long explanations. Stay in character as Taylor at all times.
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
