import { GoogleGenerativeAI, SchemaType as Type } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface RoastingEmailContext {
  userName: string;
  courseTitle: string;
  progressPercent: number;
  daysSinceLastStudy: number;
  totalVideos: number;
  completedVideos: number;
}

export interface EmailContent {
  subject: string;
  body: string;
  endingRemarks: string;
}

export async function generateRoastingEmail(context: RoastingEmailContext): Promise<EmailContent> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: {
            type: Type.STRING,
            description: "Short, punchy email subject line (max 60 characters) with emoji"
          },
          body: {
            type: Type.STRING,
            description: "Main email body content in HTML format with <br> tags for line breaks. Should be short, punchy, and memorable (max 100 words). Use HTML tags for formatting."
          },
          endingRemarks: {
            type: Type.STRING,
            description: "Closing signature/sign-off (e.g., 'Regards, Your AI Overlord 😈' or 'Your worst nightmare if you don't start studying now')"
          }
        },
        required: ["subject", "body", "endingRemarks"]
      }
    }
  });

  const prompt = `
You are a mean roasting, motivating AI assistant that sends Duolingo-style "roasting" emails to encourage users to continue their online course. 

User Context:
- Name: ${context.userName}
- Course: ${context.courseTitle}
- Progress: ${context.completedVideos}/${context.totalVideos} videos (${context.progressPercent}%)
- Days since last study: ${context.daysSinceLastStudy}

Generate a creative, and mean roasting, email that:
1. "roasts" the user for not studying 
2. Uses humor and guilt-tripping like best friends. but in a mean way.
3. Encourages them to continue their course
4. Includes personality
5. Is mean and makes them want to share this with their friends and family.

Requirements:
- subject: Short, punchy, max 60 characters, include emoji
- body: Main content, max 100 words, use HTML <br> tags for line breaks, make it personal and painfully creative
- endingRemarks: Creative sign-off that fits the roasting tone
Make no reference to you being an AI assistant. unless it's to say even you are better than them.

Examples of tone:
- Subject: "Moudjahid, 'Beginner' Doesn't Mean 'Never Started'! 😒"
- Body: "Hey Moudjahid! Your course is literally begging for attention. It's been 0 days and you're at 0% completion. Did you accidentally enroll in 'Advanced Procrastination'? 😏"
- Ending: "Regards (and extreme judgment), Your worst nightmare if you don't start studying now"

Make it personal, originally funny, mean! Keep it short, punchy and unforgettable.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the structured JSON response
    const parsed: EmailContent = JSON.parse(text);
    
    // Clean up and validate the response
    const cleanSubject = (parsed.subject || `Don't abandon ${context.courseTitle}! 😤`)
      .replace(/\n/g, ' ')
      .trim()
      .substring(0, 100); // Safety limit
    
    let cleanBody = parsed.body || '';
    if (typeof cleanBody === 'string') {
      // Ensure we have HTML breaks instead of raw newlines
      cleanBody = cleanBody
        .replace(/\n/g, '<br>')
        .replace(/\\n/g, '<br>')
        .trim();
    }
    
    const cleanEnding = (parsed.endingRemarks || 'Regards, Your Study Buddy 📚')
      .replace(/\n/g, ' ')
      .trim();
    
    // Combine body with ending remarks
    const fullBody = `${cleanBody}<br><br><strong>${cleanEnding}</strong>`;
    
    return {
      subject: cleanSubject,
      body: fullBody,
      endingRemarks: cleanEnding
    };
  } catch (error) {
    console.error("Error generating email with Gemini:", error);
    const fallback = generateFallbackEmail(context);
    return {
      subject: `Time to get back to ${context.courseTitle}! 📚`,
      body: fallback,
      endingRemarks: "Regards, Your Study Buddy 📚"
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
