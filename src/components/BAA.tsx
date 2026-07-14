import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  FileText,
  Trash2,
  Copy,
  Check,
  Share2,
  RotateCcw,
  Square,
  BookOpen,
  Award,
  Terminal,
  Compass,
  X,
  Menu,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  questionType?: 'solve' | 'explain' | 'extract' | null;
  pdfName?: string | null;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface BAAProps {
  profile: any;
  onClose: () => void;
}

export default function BAA({ profile, onClose }: BAAProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // PDF Upload state
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [questionType, setQuestionType] = useState<'solve' | 'explain' | 'extract'>('solve');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const userEmail = profile?.email?.toLowerCase().trim() || 'anonymous';

  // Load chat sessions from Firestore
  useEffect(() => {
    if (!db || !userEmail) return;

    const chatsCollectionRef = collection(db, 'users', userEmail, 'baaChats');
    const q = query(chatsCollectionRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatSession[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChatSession);
      });
      setChatSessions(list);
      setIsLoadingSessions(false);

      // Auto-select the first session if none selected and sessions exist
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0].id);
        setMessages(list[0].messages || []);
      }
    }, (error) => {
      console.error('Error loading chat history from Firestore:', error);
      setIsLoadingSessions(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  // Sync messages list when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      const activeSession = chatSessions.find(s => s.id === activeSessionId);
      if (activeSession) {
        setMessages(activeSession.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [activeSessionId, chatSessions]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle new chat creation
  const handleCreateNewChat = () => {
    const newSessionId = `chat_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Study Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (db && userEmail) {
      const docRef = doc(db, 'users', userEmail, 'baaChats', newSessionId);
      setDoc(docRef, newSession).catch(error => {
        console.error('Error creating new chat in Firestore:', error);
      });
    }

    setActiveSessionId(newSessionId);
    setMessages([]);
    setInputMessage('');
    setSelectedPdf(null);
    setIsSidebarOpen(false);
  };

  // Handle chat session delete
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat session?')) return;

    if (db && userEmail) {
      const docRef = doc(db, 'users', userEmail, 'baaChats', id);
      deleteDoc(docRef).catch(error => {
        console.error('Error deleting chat from Firestore:', error);
      });
    }

    if (activeSessionId === id) {
      const remaining = chatSessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  // Process and send message to API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && !selectedPdf) return;

    let targetSessionId = activeSessionId;
    let isNewSession = false;

    // Create session if none active
    if (!targetSessionId) {
      targetSessionId = `chat_${Date.now()}`;
      isNewSession = true;
    }

    const timestamp = new Date().toISOString();
    const newUserMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text || `Please ${questionType} the attached PDF file.`,
      timestamp,
      questionType: selectedPdf ? questionType : null,
      pdfName: selectedPdf ? selectedPdf.name : null
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsGenerating(true);

    // Save user message to Firestore instantly (non-blocking)
    const emailLower = userEmail;
    const sessionCreatedAt = isNewSession ? timestamp : (chatSessions.find(s => s.id === targetSessionId)?.createdAt || timestamp);
    const sessionTitle = isNewSession ? (text ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : `PDF ${questionType}`) : (chatSessions.find(s => s.id === targetSessionId)?.title || 'Study Conversation');

    if (db && emailLower) {
      const docRef = doc(db, 'users', emailLower, 'baaChats', targetSessionId);
      setDoc(docRef, {
        id: targetSessionId,
        title: sessionTitle,
        messages: updatedMessages,
        createdAt: sessionCreatedAt,
        updatedAt: timestamp
      }, { merge: true }).catch(error => {
        console.error('Error saving user message to Firestore:', error);
      });
    }

    if (isNewSession) {
      setActiveSessionId(targetSessionId);
    }

    // Call API Route
    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch('/api/baa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          prompt: text || `Please ${questionType} this document.`,
          pdfBase64: selectedPdf?.base64 || null,
          questionType: selectedPdf ? questionType : null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from BAA server');
      }

      const result = await response.json();
      if (result.success && result.text) {
        const newModelMessage: Message = {
          id: `msg_model_${Date.now()}`,
          role: 'model',
          content: result.text,
          timestamp: new Date().toISOString()
        };

        const finalMessages = [...updatedMessages, newModelMessage];
        setMessages(finalMessages);

        // Update session in Firestore (non-blocking)
        if (db && emailLower) {
          const docRef = doc(db, 'users', emailLower, 'baaChats', targetSessionId);
          setDoc(docRef, {
            messages: finalMessages,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(error => {
            console.error('Error saving model message to Firestore:', error);
          });
        }
      } else {
        throw new Error(result.error || 'Unknown BAA Error');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('BAA Generation Aborted by User.');
      } else {
        console.error('BAA API Error:', error);
        // Add an error message to the thread
        const errorMsg: Message = {
          id: `msg_err_${Date.now()}`,
          role: 'model',
          content: `⚠️ Sorry, BAA encountered an error. Please check your internet connection or retry.\n\nDetails: ${error.message || 'Server did not respond.'}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
      setSelectedPdf(null); // Clear selected PDF after sending
      abortControllerRef.current = null;
    }
  };

  // Abort ongoing generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Regenerate last AI message
  const handleRegenerateResponse = () => {
    if (isGenerating || messages.length === 0) return;
    
    // Find the last user message and trim messages list to that point
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const userMsg = messages[actualIndex];
    const slicedMessages = messages.slice(0, actualIndex);
    setMessages(slicedMessages);

    // Re-send with that user message prompt
    handleSendMessage(userMsg.content);
  };

  // PDF File Upload Handler
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported for BAA uploads.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit.');
      return;
    }

    setIsUploadingPdf(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedPdf({
        name: file.name,
        size: file.size,
        base64: base64String
      });
      setIsUploadingPdf(false);
    };
    reader.onerror = () => {
      alert('Failed to read PDF file.');
      setIsUploadingPdf(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
  };

  const handleShareMessage = (content: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'BunkSafe BAA Response',
        text: content
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(content);
      alert('Sharing details copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex overflow-hidden">
      {/* Sidebar for History (Desktop & Slide-over Mobile) */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col md:static md:z-0 shrink-0`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-100">BAA History</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Personal AI Logs</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Create New Chat Button */}
            <div className="p-3">
              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 font-bold text-xs transition-all uppercase tracking-wide cursor-pointer"
              >
                <Plus size={16} />
                New Study Session
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
              {isLoadingSessions ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500 font-mono">Syncing sessions...</span>
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs font-sans">
                  No previous study logs found. Start asking to log history!
                </div>
              ) : (
                chatSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`group w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left font-sans ${
                        isActive
                          ? 'bg-zinc-800 border border-zinc-700/80 text-zinc-100'
                          : 'bg-zinc-900/10 border border-transparent hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare size={16} className={isActive ? 'text-primary' : 'text-zinc-500'} />
                        <span className="text-xs font-bold truncate pr-2">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-700 hover:text-red-400 text-zinc-500 transition-all ml-1 shrink-0"
                        title="Delete chat session"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-[10px] text-zinc-500 font-mono text-center">
              Student profile: <span className="text-zinc-300 font-bold">{profile.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Backdrop Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        {/* Chat Header */}
        <header className="px-5 py-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-zinc-100 tracking-tight">🤖 BAA</h1>
                <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Premium</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-none">BunkSafe Study AI Assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-850/80 hover:border-zinc-700/80 hover:bg-zinc-800 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Exit BAA
          </button>
        </header>

        {/* Chat Thread / Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center px-4 py-16 space-y-6">
              {/* Animated Glowing Logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse scale-110 pointer-events-none" />
                <div className="relative inline-flex w-20 h-20 bg-zinc-900 border border-zinc-850/80 rounded-3xl items-center justify-center shadow-2xl">
                  <Sparkles size={40} className="text-primary animate-pulse" />
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
                  How can BAA assist you today, {profile?.name?.split(' ')[0] || 'Student'}?
                </h2>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-bold">
                  Ask me anything related to engineering studies, mathematics, coding, assignments, exams, or career advice. Feel free to attach a study PDF for instant step-by-step solutions or detailed analysis.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isAI = msg.role === 'model';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-8.5 h-8.5 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                        <Sparkles size={16} className="text-primary" />
                      </div>
                    )}
                    <div className="max-w-[85%] space-y-1">
                      <div
                        className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                          isAI
                            ? 'bg-zinc-900/40 border-zinc-850 text-zinc-100 shadow-sm'
                            : 'bg-primary/10 border-primary/20 text-zinc-100 shadow-md'
                        }`}
                      >
                        {/* PDF Attachment badge in chat bubble */}
                        {msg.pdfName && (
                          <div className="flex items-center gap-2 mb-2 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-400 max-w-xs truncate">
                            <FileText size={12} className="text-primary shrink-0" />
                            <span className="truncate">{msg.pdfName}</span>
                            <span className="text-primary-light uppercase font-bold shrink-0">[{msg.questionType}]</span>
                          </div>
                        )}

                        {/* Custom content parser & formatter */}
                        <div className="space-y-1 text-zinc-300">
                          {isAI ? parseAndRenderMessage(msg.content) : msg.content}
                        </div>
                      </div>

                      {/* Micro actions toolbar under bubbles */}
                      <div className={`flex items-center gap-3 px-1 text-[10px] text-zinc-500 font-mono ${!isAI ? 'justify-end' : ''}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isAI && (
                          <>
                            <button
                              onClick={() => handleCopyMessage(msg.content)}
                              className="hover:text-zinc-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="Copy to clipboard"
                            >
                              <Copy size={11} />
                              Copy
                            </button>
                            <button
                              onClick={() => handleShareMessage(msg.content)}
                              className="hover:text-zinc-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="Share response"
                            >
                              <Share2 size={11} />
                              Share
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic thinking indicator */}
              {isGenerating && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-8.5 h-8.5 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                    <Sparkles size={16} className="text-primary animate-pulse" />
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl flex items-center gap-2 shadow-sm">
                    <span className="text-xs text-zinc-400 font-mono">BAA is calculating</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <footer className="p-4 border-t border-zinc-850 bg-zinc-950/80 backdrop-blur-md sticky bottom-0 z-30">
          <div className="max-w-2xl mx-auto space-y-2">
            {/* Display pending uploaded PDF right above input bar */}
            {selectedPdf && messages.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl max-w-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-primary shrink-0" />
                  <span className="text-xs text-zinc-300 truncate font-mono">{selectedPdf.name}</span>
                  <span className="text-[9px] bg-primary/20 text-primary px-1 rounded uppercase font-bold shrink-0">{questionType}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-400"
                  >
                    <option value="solve">Solve</option>
                    <option value="explain">Explain</option>
                    <option value="extract">Extract</option>
                  </select>
                  <button onClick={() => setSelectedPdf(null)} className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 focus-within:border-primary/40 rounded-2xl p-2 transition-all shadow-inner"
            >
              {/* PDF upload quick toggle (only visible when not generating) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePdfUpload}
                accept="application/pdf"
                className="hidden"
              />
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-xl border border-zinc-850 bg-zinc-950/40 hover:bg-zinc-800 hover:border-zinc-700/80 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Upload studies or exam PDF"
              >
                <UploadCloud size={16} />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={selectedPdf ? "Specify details or hit send to analyze PDF..." : "Ask BAA a study query..."}
                disabled={isGenerating}
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm py-2 px-1 text-zinc-100 placeholder:text-zinc-500"
              />

              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all flex items-center justify-center cursor-pointer"
                  title="Stop generating"
                >
                  <Square size={14} className="fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !selectedPdf}
                  className="p-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white disabled:opacity-40 disabled:hover:bg-primary transition-all flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Send size={14} />
                </button>
              )}
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- Safe math rendering using KaTeX ---
function SafeMath({ math, block }: { math: string; block: boolean; key?: any }) {
  try {
    const html = katex.renderToString(math, {
      throwOnError: false,
      displayMode: block,
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} className={block ? "block overflow-x-auto my-2" : "inline-block align-middle"} />;
  } catch (error) {
    console.error('KaTeX error:', error);
    return <span className="font-mono text-xs text-red-500">{math}</span>;
  }
}

// --- Parse & format message block contents ---
function parseAndRenderMessage(content: string) {
  if (!content) return null;

  // Split content by code blocks and display math blocks
  const parts = content.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const cleanBlock = part.slice(3, -3).trim();
      const firstNewLine = cleanBlock.indexOf('\n');
      let lang = 'code';
      let code = cleanBlock;
      if (firstNewLine !== -1) {
        const possibleLang = cleanBlock.slice(0, firstNewLine).trim();
        if (possibleLang.length < 15 && !possibleLang.includes(' ') && !possibleLang.includes('(')) {
          lang = possibleLang;
          code = cleanBlock.slice(firstNewLine + 1);
        }
      }
      return (
        <CodeBlock key={index} language={lang} code={code} />
      );
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      const equation = part.slice(2, -2).trim();
      return (
        <div key={index} className="my-3.5 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl text-center overflow-x-auto text-primary">
          <SafeMath math={equation} block={true} />
        </div>
      );
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const equation = part.slice(2, -2).trim();
      return (
        <div key={index} className="my-3.5 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl text-center overflow-x-auto text-primary">
          <SafeMath math={equation} block={true} />
        </div>
      );
    } else {
      return renderTextBlock(part, index);
    }
  });
}

function CodeBlock({ language, code }: { language: string; code: string; key?: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 font-mono text-xs shadow-lg">
      <div className="bg-zinc-900/60 px-4 py-2 flex items-center justify-between border-b border-zinc-850">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 font-sans text-[10px] font-bold"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed text-zinc-300 selection:bg-primary/20">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderTextBlock(text: string, blockIndex: number) {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentTable: string[][] = [];
  let inTable = false;

  const flushTable = (key: string) => {
    if (currentTable.length === 0) return null;
    const header = currentTable[0];
    const rows = currentTable.slice(1).filter(r => r.length > 0 && !r.every(c => c.trim().startsWith('-')));
    
    inTable = false;
    const tableEl = (
      <div key={key} className="overflow-x-auto my-3.5 border border-zinc-800 rounded-xl bg-zinc-950/20">
        <table className="min-w-full divide-y divide-zinc-800 text-xs">
          <thead className="bg-zinc-900/40">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="px-3 py-2 text-left font-bold text-zinc-300 uppercase tracking-wider font-sans border-r border-zinc-850 last:border-r-0">
                  {renderInlineFormatting(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850/60 bg-zinc-900/5">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-800/10 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-zinc-300 font-sans leading-relaxed border-r border-zinc-850 last:border-r-0">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = [];
    return tableEl;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

    if (isTableLine) {
      if (!inTable) {
        inTable = true;
      }
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      currentTable.push(cells);
    } else {
      if (inTable) {
        const tableEl = flushTable(`table-${blockIndex}-${i}`);
        if (tableEl) renderedElements.push(tableEl);
      }

      const trimmed = line.trim();
      
      // Math Equation Block
      if ((trimmed.startsWith('$$') && trimmed.endsWith('$$')) || (trimmed.startsWith('\\[') && trimmed.endsWith('\\]'))) {
        const equation = trimmed.startsWith('$$') ? trimmed.slice(2, -2) : trimmed.slice(2, -2);
        renderedElements.push(
          <div key={`math-${blockIndex}-${i}`} className="my-3.5 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl text-center overflow-x-auto text-primary">
            <SafeMath math={equation} block={true} />
          </div>
        );
      }
      // Heading 3
      else if (trimmed.startsWith('### ')) {
        renderedElements.push(
          <h4 key={`h3-${blockIndex}-${i}`} className="text-xs font-black text-zinc-100 mt-4 mb-2 tracking-wide uppercase flex items-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {renderInlineFormatting(trimmed.slice(4))}
          </h4>
        );
      }
      // Heading 2
      else if (trimmed.startsWith('## ')) {
        renderedElements.push(
          <h3 key={`h2-${blockIndex}-${i}`} className="text-sm font-extrabold text-zinc-100 mt-5 mb-2.5 tracking-tight font-sans">
            {renderInlineFormatting(trimmed.slice(3))}
          </h3>
        );
      }
      // Heading 1
      else if (trimmed.startsWith('# ')) {
        renderedElements.push(
          <h2 key={`h1-${blockIndex}-${i}`} className="text-base font-black text-primary mt-6 mb-3 tracking-tight font-sans">
            {renderInlineFormatting(trimmed.slice(2))}
          </h2>
        );
      }
      // Unordered List Item
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        renderedElements.push(
          <div key={`li-${blockIndex}-${i}`} className="flex items-start gap-2.5 my-1.5 text-zinc-300 text-xs leading-relaxed font-sans pl-1">
            <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
            <div className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</div>
          </div>
        );
      }
      // Ordered List Item
      else if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        const num = match ? match[1] : '1';
        const content = match ? match[2] : trimmed;
        renderedElements.push(
          <div key={`oli-${blockIndex}-${i}`} className="flex items-start gap-2.5 my-1.5 text-zinc-300 text-xs leading-relaxed font-sans pl-1">
            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1 py-0.2 rounded shrink-0">{num}</span>
            <div className="flex-1">{renderInlineFormatting(content)}</div>
          </div>
        );
      }
      // Empty Line
      else if (trimmed === '') {
        renderedElements.push(<div key={`space-${blockIndex}-${i}`} className="h-2" />);
      }
      // Normal Paragraph
      else {
        renderedElements.push(
          <p key={`p-${blockIndex}-${i}`} className="text-zinc-300 text-xs leading-relaxed my-2 font-sans">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    }
  }

  if (inTable) {
    const tableEl = flushTable(`table-${blockIndex}-end`);
    if (tableEl) renderedElements.push(tableEl);
  }

  return <div key={blockIndex}>{renderedElements}</div>;
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$|\\\(.*?\\\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-black text-zinc-100">{part.slice(2, -2)}</strong>;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="font-mono text-[10px] text-primary bg-primary/5 border border-primary/10 px-1 py-0.5 rounded font-bold">{part.slice(1, -1)}</code>;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      return <SafeMath key={idx} math={part.slice(1, -1)} block={false} />;
    } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      return <SafeMath key={idx} math={part.slice(2, -2)} block={false} />;
    }
    return part;
  });
}
