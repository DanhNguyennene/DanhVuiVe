import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Send, 
  User, 
  Bot, 
  Trash2,
  Info, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check,
  X,
  Square
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ChatbotInterface = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentTypingMessage, setCurrentTypingMessage] = useState(null);
  const [typingTimerId, setTypingTimerId] = useState(null);
  
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  // Focus input on first render
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulate typing effect for bot messages
  useEffect(() => {
    if (isTyping && currentTypingMessage) {
      if (typingIndex < currentTypingMessage.length) {
        const timer = setTimeout(() => {
          setTypingText(prev => prev + currentTypingMessage[typingIndex]);
          setTypingIndex(typingIndex + 1);
        }, 15); // Speed of typing
        setTypingTimerId(timer);
        return () => clearTimeout(timer);
      } else {
        stopTyping(true);
      }
    }
  }, [isTyping, typingIndex, currentTypingMessage, typingText]);

  // Generate speech for bot responses if audio is enabled
  useEffect(() => {
    if (audioEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && !lastMessage.isError) {
        const utterance = new SpeechSynthesisUtterance(lastMessage.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, audioEnabled]);
  
  // Function to stop typing animation and add the full message
  const stopTyping = (completed = false) => {
    if (typingTimerId) {
      clearTimeout(typingTimerId);
      setTypingTimerId(null);
    }
    
    window.speechSynthesis.cancel(); // Stop any speech in progress
    
    setIsTyping(false);
    
    if (!completed && currentTypingMessage) {
      // Add the full message immediately instead of continuing the animation
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the placeholder
        { text: currentTypingMessage, sender: 'bot', timestamp: new Date() }
      ]);
    } else if (completed) {
      // If typing completed naturally
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the placeholder
        { text: typingText, sender: 'bot', timestamp: new Date() }
      ]);
    }
    
    setTypingText('');
    setTypingIndex(0);
    setCurrentTypingMessage(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = { 
      text: newMessage, 
      sender: 'user', 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      // Add a placeholder for the bot message with typing indicator
      setMessages(prev => [
        ...prev, 
        { sender: 'bot', isLoading: true, timestamp: new Date() }
      ]);
    console.log([
    ...messages
        .filter(msg => msg.sender === 'user') // Keep only messages where sender is 'user'
        .map(msg => ({
        role: 'user', // Assign 'user' role to the kept messages
        content: msg.text
        })),
    { role: "user", content: userMessage.text },
    ]);

      // const backendHost = process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST;
      // const backendPort = process.env.NEXT_PUBLIC_BACKEND_SERVICE_PORT;
      // const backendApiUrl = `http://chatbot-backend-svc:8000/chat`;
      // const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
      const backendBaseUrl = `http://${'chatbot.danhvuive.34.121.113.166.nip.io'}`;
      // console.log('Backend API URL:', backendBaseUrl);
      const backendApiUrl = `${backendBaseUrl}/chat`;
      console.log('Backend API URL:', backendApiUrl);
      const response = await fetch(backendApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages
                .filter(msg => msg.sender === 'user') // Keep only messages where sender is 'user'
                .map(msg => ({
                role: 'user', // Assign 'user' role to the kept messages
                content: msg.text
                })),
            { role: "user", content: userMessage.text },
            ],
        }),signal: AbortSignal.timeout(300000)});

      if (!response.ok) {

        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get bot response.');
      }

      const data = await response.json();
      
      // Start typing effect
      setCurrentTypingMessage(data.response);
      setIsTyping(true);

    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the loading placeholder
        { 
          text: "Sorry, I encountered an error. Please try again.", 
          sender: 'bot', 
          isError: true,
          timestamp: new Date() 
        }
      ]);
  } finally {
      clearTimeout(timeoutId);

      setLoading(false);
    }
  };

  const clearChat = () => {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    if (isTyping) {
      stopTyping(false);
    }
    setMessages([]);
    setNewMessage('');
    setError(null);
    inputRef.current?.focus();
  };

  const copyConversation = () => {
    const conversationText = messages
      .map(msg => `${msg.sender === 'user' ? 'You' : 'Bot'}: ${msg.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(conversationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (audioEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/95 backdrop-blur-md flex flex-col rounded-xl h-[80vh]">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-t-xl flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-5 w-5" />
              DanhVuiVe
            </CardTitle>
            <CardDescription className="text-indigo-100 font-medium">
              Contact me at danhvm12345@gmail.com
              Because of low resources, I can only answer 1 quetion in 5 minutes. PLease be patient : ) 
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                    onClick={toggleAudio}
                  >
                    {audioEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {audioEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                    onClick={copyConversation}
                    disabled={messages.length === 0}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? 'Copied!' : 'Copy conversation'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                    onClick={clearChat}
                    disabled={messages.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Clear conversation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        
        <CardContent 
          className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" 
          ref={chatContainerRef}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <Bot className="h-12 w-12 mb-4 text-indigo-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Welcome to the Chat!</h3>
              <p className="max-w-sm text-sm">
                Start a conversation by typing a message below. I'm here to assist you with any questions or tasks.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className="flex flex-col max-w-[75%]">
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender === 'bot' && (
                        <div className="bg-indigo-100 p-1 rounded-full">
                          <Bot className="h-4 w-4 text-indigo-600" />
                        </div>
                      )}
                      {msg.sender === 'user' && (
                        <div className="ml-auto bg-purple-100 p-1 rounded-full">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                      )}
                      <span className="text-xs text-gray-500">
                        {msg.timestamp && formatTime(msg.timestamp)}
                      </span>
                      {msg.isError && (
                        <Badge variant="destructive" className="text-xs px-1">Error</Badge>
                      )}
                    </div>
                    
                    <div 
                      className={`rounded-xl p-4 ${
                        msg.sender === 'user' 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                          : msg.isError 
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : 'bg-white border border-gray-200 text-gray-800'
                      } ${msg.isLoading ? 'min-h-[40px] min-w-[60px]' : ''}`}
                    >
                      {msg.isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words text-sm">
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator when bot is "typing" its response */}
              {isTyping && (
                <div className="flex justify-start group">
                  <div className="flex flex-col max-w-[75%]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-indigo-100 p-1 rounded-full">
                        <Bot className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Button
                        variant="outline" 
                        size="sm" 
                        className="ml-auto h-6 py-0.5 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 focus:ring-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => stopTyping(false)}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </div>
                    <div className="rounded-xl p-4 bg-white border border-gray-200 text-gray-800">
                      <div className="whitespace-pre-wrap break-words text-sm">
                        {typingText}
                        <span className="inline-block w-1 h-4 bg-indigo-500 ml-1 animate-pulse"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
        
        <CardFooter className="p-4 border-t border-gray-100">
          {error && (
            <Alert variant="destructive" className="mb-3 border-2 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-xs flex items-center">
                <Info className="h-4 w-4 mr-2" />
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center space-x-2 w-full">
            <Input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-grow rounded-full border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 py-6"
              disabled={loading || isTyping}
            />
            {isTyping ? (
              <Button 
                onClick={() => stopTyping(false)}
                className="rounded-full bg-red-500 hover:bg-red-600"
                title="Stop response"
              >
                <Square className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={sendMessage} 
                disabled={loading || !newMessage.trim() || isTyping}
                className="rounded-full bg-indigo-600 hover:bg-indigo-700"
                title="Send message"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatbotInterface;