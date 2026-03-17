import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Use gemini-flash-latest as requested to resolve 404/not found issues
export const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export default genAI;
