const BACKEND_URL = "https://virtualstudent.onrender.com";

// Tüm sohbeti backend'e yollamak için tutulacak mesajlar
// system prompt'u backend tarafında ekliyoruz, burada sadece
// teacher (user) ve Taylor (assistant) mesajları tutuluyor.
let conversation = [];

// DOM elemanları
const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const saveBtn = document.getElementById("saveBtn");

// İlk açıklama mesajı (UI ve konuşma için)
const initialGreeting = "Merhaba öğretmenim…";

addMessageToUI("Taylor", initialGreeting, "taylor");
conversation.push({
  role: "assistant",
  content: initialGreeting,
});

// Form gönderme (Gönder butonu veya enter ile)
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  // UI'ya öğretmen mesajını ekle
  addMessageToUI("Öğretmen", text, "teacher");

  // Frontend konuşma state'ine ekle
  conversation.push({
    role: "user",
    content: text,
  });

  // Inputu temizle
  inputEl.value = "";

  // Butonu kilitle
  sendBtn.disabled = true;
  sendBtn.textContent = "Taylor düşünüyor...";

  try {
    const reply = await callBackend(conversation);

    // Sohbet state'ine ekle
    conversation.push({
      role: "assistant",
      content: reply,
    });

    // UI'ya Taylor cevabını ekle
    addMessageToUI("Taylor", reply, "taylor");
  } catch (err) {
    console.error(err);
    addMessageToUI(
      "Sistem",
      "Bir hata oluştu. Backend URL'sini ve Render servisinin çalıştığını kontrol edin. Detay: " + err.message,
      "taylor"
    );
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Gönder";
    inputEl.focus();
  }
});

// ⬇⬇⬇ BURASI YENİ: Enter ile mesaj gönderme (Shift+Enter = yeni satır) ⬇⬇⬇
inputEl.addEventListener("keydown", (e) => {
  // Sadece Enter ve Shift'e basılmamışsa
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // yeni satır eklemesini engelle
    // Formu programatik olarak submit et
    if (formEl.requestSubmit) {
      formEl.requestSubmit();
    } else {
      formEl.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  }
});
// ⬆⬆⬆ YENİ KISIM BİTTİ ⬆⬆⬆

// Kaydet butonu: sohbeti .txt olarak indir
saveBtn.addEventListener("click", () => {
  const text = exportConversationAsText(conversation);
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "taylor-chat.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Backend çağrısı
async function callBackend(conversation) {
  const response = await fetch(BACKEND_URL + "/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Backend hata: " + errText);
  }

  const data = await response.json();
  if (!data.reply) {
    throw new Error("Geçersiz backend cevabı.");
  }
  return data.reply.trim();
}

// UI'ya mesaj ekleme
function addMessageToUI(senderName, text, type) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${type}`;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = senderName;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrapper.appendChild(meta);
  wrapper.appendChild(bubble);
  chatEl.appendChild(wrapper);

  // Aşağı kaydır
  chatEl.scrollTop = chatEl.scrollHeight;
}

// Sohbeti txt formatına çevirme
function exportConversationAsText(allMessages) {
  const lines = allMessages.map((m) => {
    let who = "";
    if (m.role === "user") who = "Teacher";
    else if (m.role === "assistant") who = "Taylor";
    else who = m.role;
    return `${who}: ${m.content}`;
  });

  return lines.join("\n\n");
}
