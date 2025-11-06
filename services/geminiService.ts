import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    // This is a fallback for development environments where process.env might not be set up.
    // In the target runtime, the API key is expected to be available.
    console.warn("API_KEY environment variable not found. The application may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateSpeech = async (
    prompt: string,
    voice: VoiceName
): Promise<string> => {
    if (!prompt.trim()) {
        throw new Error("Prompt cannot be empty.");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("No audio data received from API. The response may have been blocked.");
        }
        
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
          throw new Error(`Failed to generate speech: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating speech.");
    }
};