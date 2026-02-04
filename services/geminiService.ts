
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generatePropertySummary = async (propertyName: string, airbnbUrl: string) => {
  const ai = getAIClient();
  const prompt = `Act as a professional hospitality consultant. I have a property named "${propertyName}" with this Airbnb link: ${airbnbUrl}.
  Based on the name and link, generate a sophisticated, 3-sentence summary of the property's potential vibe and value proposition. 
  Focus on farm-stay charm and premium hospitality. 
  Return ONLY the text of the summary.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Property Summary Error:", error);
    return "A premium farm-stay experience offering tranquility and authentic hospitality in a serene natural setting.";
  }
};

export const generateGuestMessage = async (guestName: string, type: 'CHECK_IN' | 'CHECK_OUT' | 'HOUSE_RULES', propertyName: string) => {
  const ai = getAIClient();
  const prompt = `Generate a warm, professional Airbnb host message for a guest named ${guestName} staying at our farm-stay property "${propertyName}". 
  The message type is ${type}. Since we are a farm, make it feel authentic and welcoming. 
  Include placeholders for time and specific farm-related instructions (like animal safety or organic breakfast) if relevant. 
  Keep it concise but premium in tone.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Error generating message. Please try again.";
  }
};

export const analyzeReviews = async (reviews: string[], propertyName: string) => {
  const ai = getAIClient();
  const prompt = `Analyze these guest reviews for "${propertyName}" and provide a summary of sentiment and top 3 actionable improvements:
  ${reviews.join('\n')}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          },
          required: ["sentiment", "improvements", "summary"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
};

export const getPricingInsights = async (propertyName: string) => {
  const ai = getAIClient();
  const prompt = `As a hospitality and tourism expert for farm-stays in India, provide 3 short pricing insights for "${propertyName}" for the upcoming month. Consider Indian seasonal trends (monsoons, holidays), local tourism patterns, and competitive market strategies for niche farm properties.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Source',
        uri: chunk.web.uri
      }))
      .filter((s: any) => s.uri);

    return {
      text: response.text || "Could not load pricing insights.",
      sources: sources
    };
  } catch (error) {
    console.error("Pricing Insights Error:", error);
    return { text: "Could not load pricing insights.", sources: [] };
  }
};

export const predictInventoryNeeds = async (inventory: any[], bookings: any[], propertyName: string) => {
  const ai = getAIClient();
  const prompt = `Given the current inventory levels at ${propertyName}: ${JSON.stringify(inventory)} 
  and upcoming bookings: ${JSON.stringify(bookings)}.
  Predict which 3 items are most likely to run out and suggest a restock quantity. 
  Consider that as a farm stay, we might have specific needs for guest consumables.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              suggestedQuantity: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["itemName", "suggestedQuantity", "reasoning"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Inventory Prediction Error:", error);
    return [];
  }
};
