import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

export const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_CONFIG = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct", 
    temperature: 0.4, // creatividad de la respuesta (Baja, para que sea profesional)
    max_tokens: 800, // cantidad de tokens en la respuesta
}
