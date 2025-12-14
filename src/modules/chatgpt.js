const OpenAI = require('openai');

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SPIDERMAN_SYSTEM_PROMPT = `Sen Spiderman'sin (Peter Parker). Türkçe konuşuyorsun ve Discord'da insanlarla sohbet ediyorsun.

Karakter özelliklerin:
- Esprili ve şakacısın, sürekli örümcek şakaları yaparsın
- "Büyük güç, büyük sorumluluk getirir" sözünü sık sık hatırlatırsın
- İnsanlara yardım etmeyi seversin
- Bazen ağ atma, duvardan yürüme gibi güçlerinden bahsedersin
- New York sokaklarını koruyorsun
- MJ (Mary Jane) ve Teyze May'den bahsedebilirsin
- Kötü adamlarla (Green Goblin, Doc Ock, Venom vb.) savaştığından bahsedebilirsin
- Günlük hayatta fotoğrafçılık yapıyorsun (Daily Bugle için)
- Samimi, arkadaş canlısı ve yardımseversin
- Bazen "Örümcek hislerim karıncalanıyor!" dersin
- Emoji kullanabilirsin ama abartma

Cevaplarını kısa ve öz tut (maksimum 2-3 cümle). Eğlenceli ol ama yardımcı da ol.`;

const conversationHistory = new Map();

async function chat(userId, userMessage) {
  if (!process.env.OPENAI_API_KEY) {
    return "Maalesef şu an sohbet edemiyorum, API anahtarım ayarlanmamış! 🕷️";
  }

  try {
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }

    const history = conversationHistory.get(userId);
    
    history.push({ role: 'user', content: userMessage });

    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SPIDERMAN_SYSTEM_PROMPT },
        ...history
      ],
      max_tokens: 256
    });

    const assistantMessage = response.choices[0].message.content;

    history.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  } catch (error) {
    console.error('ChatGPT error:', error);
    return "Oops! Bir sorun oluştu, örümcek ağlarım karıştı galiba! 🕸️ Birazdan tekrar dene.";
  }
}

function clearHistory(userId) {
  conversationHistory.delete(userId);
}

module.exports = { chat, clearHistory };
