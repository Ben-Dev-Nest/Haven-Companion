import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Info, LogOut, Mic, MicOff, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "@/components/ChatMessage";
import CrisisResources from "@/components/CrisisResources";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useConversations } from "@/hooks/useConversations";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript,
    isSupported: isSpeechSupported 
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const {
    conversations,
    currentConversationId,
    messages,
    createConversation,
    saveMessage,
    deleteConversation,
    updateConversationTitle,
    switchConversation,
    setMessages,
  } = useConversations();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "Take care of yourself. Come back anytime you need support 💜",
    });
    navigate("/");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessage: { role: 'user' | 'assistant'; content: string }, conversationId: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/luma-chat`;
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok) {
        if (resp.status === 429 || resp.status === 402) {
          const error = await resp.json();
          throw new Error(error.error || "Service temporarily unavailable");
        }
        throw new Error("Failed to connect to Haven");
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save the complete assistant message
      if (assistantContent) {
        await saveMessage(conversationId, 'assistant', assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to reach Haven",
        variant: "destructive",
      });
      
      // Remove the failed assistant message if any
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAttachments = async (conversationId: string) => {
    if (attachments.length === 0) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const uploadedFiles = [];

    for (const file of attachments) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      } else {
        uploadedFiles.push({
          name: file.name,
          path: data.path,
          type: file.type,
          size: file.size,
        });
      }
    }

    return uploadedFiles;
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Create a new conversation if none exists
    let convId = currentConversationId;
    if (!convId) {
      const newConv = await createConversation();
      if (!newConv) return;
      convId = newConv.id;
      await switchConversation(convId);
    }

    setIsLoading(true);

    // Upload attachments first
    const uploadedFiles = await uploadAttachments(convId);

    const userMessage = { 
      role: "user" as const, 
      content: input.trim() || "[Attachment]",
      attachments: uploadedFiles 
    };
    
    // Save user message to database with attachments
    const { data: savedMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: userMessage.content,
        attachments: uploadedFiles,
      })
      .select()
      .single();
    
    // Add to local state
    setMessages((prev) => [...prev, { ...userMessage, id: savedMessage?.id }]);
    setInput("");
    setAttachments([]);

    await streamChat(userMessage, convId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = async () => {
    const newConv = await createConversation();
    if (newConv) {
      await switchConversation(newConv.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={switchConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={updateConversationTitle}
        messages={messages}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-10 shadow-soft">
          <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Haven</h1>
                <p className="text-xs text-muted-foreground">
                  {currentConversationId 
                    ? conversations.find(c => c.id === currentConversationId)?.title || 'Your mental health companion'
                    : 'Your mental health companion'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>About Haven 💜</DialogTitle>
                    <DialogDescription className="space-y-3 text-left">
                      <p>
                        Haven is an AI companion designed to provide emotional support and a listening ear.
                      </p>
                      <p className="font-semibold text-foreground">
                        Important: Haven is not a substitute for professional mental health care.
                      </p>
                      <p>
                        If you're experiencing a crisis or need professional help, please reach out to a
                        licensed therapist or contact crisis resources immediately.
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        Your conversations are processed securely but please avoid sharing sensitive personal
                        information.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
          <div className="container max-w-4xl mx-auto space-y-6">
            {/* Crisis Resources Card */}
            <CrisisResources />

            {/* Messages */}
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Welcome to Haven</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      I'm here to listen and support you. Share what's on your mind, and let's work through it together.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <ChatMessage 
                  key={msg.id || idx} 
                  role={msg.role} 
                  content={msg.content}
                  timestamp={msg.created_at ? new Date(msg.created_at) : new Date()}
                  attachments={msg.attachments}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-4 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Input Area */}
        <div className="fixed bottom-0 right-0 left-64 border-t border-border/50 bg-card/95 backdrop-blur-lg shadow-soft">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 items-end">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Attach files"
                  className="flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                {isSpeechSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMicrophone}
                    disabled={isLoading}
                    title={isListening ? "Stop recording" : "Start voice input"}
                    className={`flex-shrink-0 ${isListening ? 'text-destructive animate-pulse' : ''}`}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Share what's on your mind..."}
                className="resize-none rounded-2xl border-border/70 focus:border-primary transition-colors"
                rows={2}
                disabled={isLoading}
                maxLength={2000}
              />
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                size="icon"
                className="h-12 w-12 rounded-full shadow-soft hover:shadow-glow transition-all flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Press Enter to send • Shift+Enter for new line</span>
              <span>{input.length} / 2000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
