import { Bot, User, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Attachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  attachments?: Attachment[];
}

const ChatMessage = ({ role, content, timestamp, attachments }: ChatMessageProps) => {
  const isUser = role === "user";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Message copied successfully",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .download(attachment.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: `${attachment.name} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  return (
    <div className={`flex gap-3 mb-4 animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div className="flex flex-col gap-2">
          <div
            className={`group relative rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-card border border-border shadow-sm"
            }`}
          >
            {content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>}
            
            {attachments && attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary/20 dark:bg-secondary/10 rounded-lg px-3 py-2 text-xs"
                  >
                    <span className="truncate max-w-[150px]">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:text-primary"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border shadow-sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        {timestamp && (
          <span className="text-xs text-muted-foreground px-2">
            {formatTime(timestamp)}
          </span>
        )}
      </div>
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
