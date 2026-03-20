import { ChatInterface } from "@/components/features/ai-chat/ChatInterface";

export const metadata = {
  title: "AI Chat | BudgetWise",
};

export default function AiChatPage() {
  return (
    <div className="w-full h-[calc(100vh-6rem)]">
      <ChatInterface />
    </div>
  );
}
