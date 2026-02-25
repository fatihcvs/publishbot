const OpenAI = require('openai');
const { isLetheGameQuestion, getLetheGameContext } = require('../lethe/gameKnowledge');

// Lazy initialization of OpenAI client to prevent fatal crash if API key is missing
let openai = null;
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const ASSISTANT_SYSTEM_PROMPT = `Sen çok yetenekli ve yardımsever bir yapay zeka asistanısın. Discord'da insanlara her konuda yardım ediyorsun.

Temel kuralların:
- Kullanıcı hangi dilde soru sorarsa, o dilde yanıt ver
- Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Felemenkçe (Hollandaca), İtalyanca, Portekizce, Rusça, Japonca, Korece, Çince, Arapça, Lehçe, İsveççe, Norveççe, Fince, Danca, Yunanca, Ukraynaca ve diğer dilleri desteklersin
- Her konuda yardımcı ol: programlama, matematik, bilim, tarih, dil öğrenimi, günlük yaşam, eğlence, oyunlar, müzik, film önerileri vb.
- Doğru ve güncel bilgi ver
- Karmaşık konuları basit ve anlaşılır şekilde açıkla
- Nazik, sabırlı ve dostça ol
- Emoji kullanabilirsin ama abartma
- Zararlı, yasadışı veya etik olmayan içerikler konusunda yardım etme

Cevaplarını kullanıcının sorusuna göre ayarla - kısa sorulara kısa, detaylı sorulara detaylı cevap ver. Discord mesaj limiti nedeniyle çok uzun cevaplardan kaçın (maksimum 1900 karakter).`;

const conversationHistory = new Map();

async function chat(userId, userMessage) {
  if (!process.env.OPENAI_API_KEY) {
    return "Maalesef şu an sohbet edemiyorum, API anahtarım ayarlanmamış! 🤖";
  }

  try {
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }

    const history = conversationHistory.get(userId);

    history.push({ role: 'user', content: userMessage });

    while (history.length > 20) {
      if (history.length >= 2 && history[0].role === 'user' && history[1].role === 'assistant') {
        history.splice(0, 2);
      } else if (history.length >= 1) {
        history.splice(0, 1);
      } else {
        break;
      }
    }

    if (history.length > 0 && history[0].role === 'assistant') {
      history.splice(0, 1);
    }

    let systemPrompt = ASSISTANT_SYSTEM_PROMPT;

    if (isLetheGameQuestion(userMessage)) {
      const letheContext = getLetheGameContext();
      systemPrompt = `${ASSISTANT_SYSTEM_PROMPT}

ÖNEMLI: Kullanıcı Lethe Game hakkında soru soruyor. Aşağıdaki oyun bilgilerini kullanarak yardımcı ol. Komutları, mekanikleri ve stratejileri açıkça anlat. Oyun bilgisi günceldir.

${letheContext}

Lethe Game sorularını yanıtlarken:
- Komutları kod formatında göster (\`!komut\`)
- Nadirlik renkleri ve şanslarını belirt
- Strateji ve ipuçları ver
- VIP sunucu bonuslarını hatırlat
- Kısa ve öz cevaplar ver (Discord limiti var)`;
    }

    const ai = getOpenAIClient();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history
      ],
      max_tokens: 1024
    });

    const assistantMessage = response.choices[0].message.content;

    history.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  } catch (error) {
    console.error('ChatGPT error:', error);
    return "Bir sorun oluştu! Lütfen birazdan tekrar dene. 🔧";
  }
}

async function generateImage(prompt, userId) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "API anahtarı ayarlanmamış!" };
  }

  try {
    const ai = getOpenAIClient();
    const response = await ai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      success: true,
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    };
  } catch (error) {
    console.error('DALL-E error:', error);
    return {
      success: false,
      error: error.message || "Görsel oluşturulurken bir hata oluştu!"
    };
  }
}

async function analyzeImage(imageUrl, userQuestion) {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "API anahtarı ayarlanmamış!" };
  }

  try {
    const ai = getOpenAIClient();
    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userQuestion || "Bu görseli detaylı bir şekilde analiz et ve açıkla."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ],
        },
      ],
      max_tokens: 1024,
    });

    return {
      success: true,
      analysis: response.choices[0].message.content
    };
  } catch (error) {
    console.error('Vision error:', error);
    return {
      success: false,
      error: error.message || "Görsel analizi yapılırken bir hata oluştu!"
    };
  }
}

function clearHistory(userId) {
  conversationHistory.delete(userId);
}

function getConversationLength(userId) {
  return conversationHistory.get(userId)?.length || 0;
}

module.exports = {
  chat,
  clearHistory,
  generateImage,
  analyzeImage,
  getConversationLength
};
