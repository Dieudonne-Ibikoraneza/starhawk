import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  User, 
  Bot, 
  ChevronRight,
  MessageSquare,
  Activity,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { followUpChat } from "@/services/aiApi";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface AiChatInterfaceProps {
  initialInsight: any; // The object returned from the initial AI call
  title?: string;
  suggestedQuestions?: string[];
  role?: 'FARMER' | 'ASSESSOR' | 'INSURER';
  borderless?: boolean;
}

export const AiChatInterface = ({ 
  initialInsight, 
  title = "Starhawk AI Assistant",
  suggestedQuestions = [
    "What are the main risk factors?",
    "How can I mitigate these issues?",
    "Can you explain the red flags?"
  ],
  role = 'FARMER',
  borderless = false
}: AiChatInterfaceProps) => {
  const { toast } = useToast();
  const [insight, setInsight] = useState(initialInsight);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawConversation = insight?.conversation || [];
  // Hide the initial system prompt (first 'user' message with raw data) from the UI
  const conversation = rawConversation.filter((msg: any, i: number) => 
    !(i === 0 && msg.role === 'user' && msg.content?.trim().startsWith('You are'))
  );
  const insightId = insight?._id || insight?.id;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSend = async (message: string) => {
    if (!message.trim() || !insightId) return;

    setIsSending(true);
    setInput("");
    setErrorMessage(null);
    setLastFailedMessage(message);
    try {
      const updatedInsight = await followUpChat(insightId, message);
      setInsight(updatedInsight);
      setLastFailedMessage(null);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const msg = error?.message || 'Failed to get response from AI.';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    
    // Split by newlines to handle paragraphs and lists
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={lineIndex} className="h-2" />; // Spacer for empty lines

      // Handle bullet points (-, *, or •)
      const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ');
      const content = isBullet ? trimmedLine.substring(2) : trimmedLine;

      // Handle bold and code text within the line
      // Regex matches **bold** or `code`
      const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
      const formattedContent = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIndex} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={partIndex} className="bg-gray-100 text-green-700 px-1.5 py-0.5 rounded font-mono text-xs border border-gray-200">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIndex} className="flex gap-2 ml-1 my-1">
            <span className="text-green-500 font-bold">•</span>
            <span className="flex-1">{formattedContent}</span>
          </div>
        );
      }

      return <p key={lineIndex} className="mb-2 last:mb-0 leading-relaxed">{formattedContent}</p>;
    });
  };

  const contentBody = (
    <>
      {/* Background Glow */}
      {!borderless && (
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Sparkles className="h-64 w-64 text-green-600 rotate-12" />
        </div>
      )}

      {!borderless && (
        <CardHeader className="border-b border-green-100/50 bg-white/50 backdrop-blur-sm py-3 shrink-0">
          <CardTitle className="text-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-green-900 font-bold">{title}</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-green-600">Live AI</span>
            </div>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={`flex-1 overflow-hidden p-0 flex flex-col ${borderless ? 'bg-transparent' : ''}`}>
        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {/* Header Metrics Summary */}
          {insight?.data && (insight.data.riskLevel || insight.data.confidenceScore) && (
            <div className="flex flex-wrap gap-3 p-3 bg-white/40 backdrop-blur-sm border border-green-100 rounded-2xl shadow-sm mb-2 animate-in fade-in slide-in-from-top-2 duration-500">
              {insight.data.riskLevel && (
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                  insight.data.riskLevel === 'Low' ? 'bg-green-100 text-green-700 border-green-200' :
                  insight.data.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-100'
                }`}>
                  Risk: {insight.data.riskLevel}
                </div>
              )}
              {insight.data.confidenceScore && (
                <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 shadow-sm flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  Confidence: {typeof insight.data.confidenceScore === 'number' && insight.data.confidenceScore < 1 ? Math.round(insight.data.confidenceScore * 100) : insight.data.confidenceScore}%
                </div>
              )}
            </div>
          )}

          {conversation.map((msg: any, i: number) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-green-100 rounded-tl-none'
                }`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                </div>
                <div className="p-3 bg-white border border-green-100 rounded-2xl rounded-tl-none shadow-sm">
                  <span className="text-xs text-gray-400">Starhawk AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className={`p-4 ${borderless ? 'bg-transparent' : 'bg-white/50 backdrop-blur-md border-t border-green-100/50'} space-y-3 shrink-0`}>
          {/* Suggested Questions */}
          {!isSending && conversation.length < 10 && (
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3 w-3" />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Field */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="pr-12 bg-white border-green-200 focus-visible:ring-green-500 rounded-xl shadow-sm"
              disabled={isSending}
            />
            <Button 
              size="icon"
              disabled={isSending || !input.trim()}
              className="absolute right-1 top-1 h-8 w-8 bg-green-600 hover:bg-green-700 rounded-lg transition-all"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </form>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-700">AI Error</p>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
              {lastFailedMessage && (
                <button
                  onClick={() => handleSend(lastFailedMessage)}
                  className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </>
  );

  if (borderless) {
    return (
      <div className="flex flex-col h-[500px] relative overflow-hidden">
        {contentBody}
      </div>
    );
  }

  return (
    <Card className="border-green-200 shadow-xl bg-gradient-to-br from-white to-green-50/30 overflow-hidden flex flex-col h-[500px] relative">
      {contentBody}
    </Card>
  );
};
