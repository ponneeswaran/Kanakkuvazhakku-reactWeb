
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { chatWithFinancialAssistant } from '../services/geminiService';
import { ChatMessage, Category } from '../types';
import { Send, Bot, Loader2 } from 'lucide-react';

const AIChat: React.FC = () => {
  const { expenses, budgets, incomes, currency, userName, addExpense, t, chatHistory, addChatMessage } = useData();
  
  // Use a ref to track if we've initialized the welcome message to prevent double-posting
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only add welcome message if history is empty and we haven't initialized yet
    if (chatHistory.length === 0 && !hasInitialized.current) {
        hasInitialized.current = true;
        addChatMessage({
            id: 'welcome',
            role: 'model',
            text: t('welcome_message_ai'),
            timestamp: Date.now()
        });
    }
  }, [chatHistory.length, addChatMessage, t]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleAddExpenseTool = (args: any) => {
      // Validate and normalize args from AI
      const amount = parseFloat(args.amount);
      if (isNaN(amount)) throw new Error("Invalid Amount");

      const category = args.category as Category || 'Other';
      const description = args.description || 'Expense from AI';
      const date = args.date || new Date().toISOString().split('T')[0];
      const paymentMethod = args.paymentMethod || 'Cash'; // Default if missing

      addExpense({
          amount,
          category,
          description,
          date,
          paymentMethod
      });
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    addChatMessage(userMessage);
    setInput('');
    setIsThinking(true);

    try {
      const responseText = await chatWithFinancialAssistant(
        userMessage.text,
        chatHistory, // Pass current history state (which doesn't include userMessage yet due to async state update)
        { expenses, budgets, currency, incomes, userName },
        handleAddExpenseTool // Pass tool handler
      );

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      addChatMessage(aiMessage);
    } catch (error) {
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: Date.now()
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] landscape:h-screen landscape:mr-20 bg-gray-50 dark:bg-slate-950 transition-colors">
      <header className="p-4 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 flex items-center space-x-3 transition-colors">
          <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full text-teal-700 dark:text-teal-400">
              <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 dark:text-white">{t('AI Assistant')}</h1>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                {t('Online')}
            </p>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm transition-colors ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-100 dark:border-slate-700 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center space-x-2 transition-colors">
                <Loader2 className="animate-spin text-teal-600 dark:text-teal-400" size={16} />
                <span className="text-xs text-gray-500 dark:text-slate-400">{t('Thinking...')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 pb-4 transition-colors">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat_placeholder')}
            className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
