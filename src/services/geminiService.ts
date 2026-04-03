
import { GoogleGenAI } from "@google/genai";
import { Ball } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI commentary will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const getRaceCommentary = async (balls: Ball[], event?: string): Promise<string> => {
  const sortedBalls = [...balls].sort((a, b) => b.y - a.y);
  const leader = sortedBalls[0];
  const runnerUp = sortedBalls[1];

  const prompt = `
    This is a physics-based vertical ball racing game. 
    Current Rankings (Top 3):
    1. ${leader.name} (Position: ${Math.round(leader.y)}m)
    2. ${runnerUp ? `${runnerUp.name} (Position: ${Math.round(runnerUp.y)}m)` : 'N/A'}
    
    Context: ${event || 'General race progress.'}
    
    Task: Provide a very short, energetic, and exciting sports commentary (max 2 sentences) in Korean. 
    Make it sound like an intense e-sports broadcast. Use the names of the balls.
  `;

  const aiInstance = getAI();
  if (!aiInstance) return "경기가 점점 더 치열해지고 있습니다!";

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.8,
      }
    });
    return response.text || "경기가 점점 더 치열해지고 있습니다!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "선수들의 움직임이 심상치 않습니다! 정말 대단한 레이스네요!";
  }
};
