import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface RoastingEmailContext {
  userName: string;
  courseTitle: string;
  progressPercent: number;
  daysSinceLastStudy: number;
  totalVideos: number;
  completedVideos: number;
}

export async function generateRoastingEmail(context: RoastingEmailContext): Promise<{ subject: string; body: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
You are a playful, motivating AI assistant that sends Duolingo-style "roasting" emails to encourage users to continue their online course. 

User Context:
- Name: ${context.userName}
- Course: ${context.courseTitle}
- Progress: ${context.completedVideos}/${context.totalVideos} videos (${context.progressPercent}%)
- Days since last study: ${context.daysSinceLastStudy}

Generate a creative, funny, and motivating email that:
1. Playfully "roasts" the user for not studying
2. Uses humor and guilt-tripping (but in a friendly way)
3. Encourages them to continue their course
4. Includes emojis and personality
5. Is motivating and makes them want to study

Format your response as JSON with "subject" and "body" fields. The body should be HTML-ready.

Examples of tone:
- "Hey ${context.userName}, that ${context.courseTitle} isn't going to learn itself! 😤"
- "Your course is gathering digital dust while you're out there living your best life..."
- "I see you've been ghosting your studies again... 👻"

Make it personal, funny, and motivating!
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse as JSON, fallback to structured response
    try {
      const parsed = JSON.parse(text);
      return {
        subject: parsed.subject || `Don't abandon ${context.courseTitle}! 😤`,
        body: parsed.body || generateFallbackEmail(context)
      };
    } catch {
      // If not JSON, create structured response
      return {
        subject: `Don't abandon ${context.courseTitle}! 😤`,
        body: text || generateFallbackEmail(context)
      };
    }
  } catch (error) {
    console.error("Error generating email with Gemini:", error);
    return {
      subject: `Time to get back to ${context.courseTitle}! 📚`,
      body: generateFallbackEmail(context)
    };
  }
}

function generateFallbackEmail(context: RoastingEmailContext): string {
  const daysText = context.daysSinceLastStudy === 0 ? "today" : 
                   context.daysSinceLastStudy === 1 ? "yesterday" : 
                   `${context.daysSinceLastStudy} days ago`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Hey ${context.userName}! 👋</h2>
      
      <p>I noticed you haven't touched <strong>${context.courseTitle}</strong> since ${daysText}... 😏</p>
      
      <p>Your course is sitting there at <strong>${context.progressPercent}%</strong> completion (${context.completedVideos}/${context.totalVideos} videos), just waiting for you to come back!</p>
      
      <p>Don't let all that progress go to waste! Your future self will thank you for not giving up now. 💪</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/courses/${context.courseTitle}" 
           style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Continue Learning Now! 🚀
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Remember: Every expert was once a beginner. Keep going! 🌟
      </p>
    </div>
  `;
}
