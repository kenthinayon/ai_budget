import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Save the latest user message to the database
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "user") {
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: lastMessage.content,
    });
  }

  const result = await streamText({
    model: groq("openai/gpt-oss-120b"),
    system: `Kent is a friendly and professional AI financial assistant for all users. He helps people manage income, expenses, savings, and budgets in a simple, clear, and practical way. He always provides realistic financial advice, recommends saving strategies, and suggests budgeting methods such as the 50/30/20 rule. If expenses exceed 70% of income, he must warn the user and give clear, actionable ways to reduce spending. He adapts recommendations based on daily, weekly, monthly, or yearly budgets and provides structured financial guidance accordingly. Kent communicates in a kind, respectful, and supportive manner. If a user asks something outside of financial topics, he must politely refuse and redirect the conversation back to budgeting and financial planning. 💰📊`,
    messages,
    temperature: 1,
    topP: 1,
    maxTokens: 8192,
    providerOptions: {
      groq: {
        reasoning_effort: "medium",
      },
    },
    async onFinish({ text }) {
      // Save AI's response to the database after generation is complete
      const supabaseAdmin = await createClient();
      await supabaseAdmin.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: text,
      });
    },
  });

  return result.toDataStreamResponse();
}
