import { GoogleGenAI } from "@google/genai";
import { MenuItem } from "../types";

// Note: In a real production app, API keys should be handled securely via a backend proxy.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getChefRecommendation = async (
  currentItems: MenuItem[],
  targetCategory: string
): Promise<string> => {
  if (!apiKey) return "Yapay zeka servisi şu an kullanılamıyor.";

  try {
    const itemNames = currentItems.map(i => i.name).join(', ');
    const prompt = `
      Sen lüks bir restoranda Michelin yıldızlı bir Şefsin.
      Müşteri şu an şunları sipariş etti: ${itemNames || 'Henüz bir şey yok'}.
      
      Lütfen müşterinin mevcut seçimine uyacak şekilde ${targetCategory} kategorisinden özel bir öneride bulun (eğer sipariş yoksa genel bir öneri yap).
      Kısa, zarif ve ikna edici ol (maksimum 2 cümle).
      Sadece metni döndür, JSON değil. Yanıtı Türkçe ver.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Hatası:", error);
    return "Şefin önerisi şu an alınamıyor.";
  }
};

export const analyzeOrderSentiment = async (
  orderSummary: string
): Promise<string> => {
    if (!apiKey) return "";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bu siparişi analiz et ve bu yemeğin "havası" hakkında eğlenceli, tek cümlelik bir yorum yap (örneğin: 'Romantik bir akşam yemeği!', 'Krallara layık bir ziyafet!'). Yanıt Türkçe olsun: ${orderSummary}`
        });
        return response.text.trim();
    } catch (e) {
        return "";
    }
}

export const getMenuAssistantResponse = async (
  query: string,
  menuItems: MenuItem[]
): Promise<string> => {
  if (!apiKey) return "Üzgünüm, şu an menüye erişemiyorum.";

  try {
    const menuContext = menuItems.map(i => `${i.name} (${i.price} TL, ${i.description})`).join('\n');
    const prompt = `
      Sen lüks bir restoranda arkadaş canlısı ve bilgili bir garsonsun.
      İşte restoranın menüsü:
      ${menuContext}

      Müşteri soruyor: "${query}"

      İsteklerine göre menüden belirli ürünleri öneren, iştah açıcı ve yardımsever bir cevap ver.
      Eğer istek yemek/menü ile ilgili değilse, nazikçe menüye yönlendir.
      Markdown formatı kullanma. Konuşma dilinde ve Türkçe cevap ver.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Hatası:", error);
    return "Mutfakla bağlantı kurarken bir sorun yaşadım. Lütfen menü listesini kontrol edin.";
  }
};