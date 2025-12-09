'use client';

import { useState, useRef, useEffect } from 'react';
import { Conversation, Message } from '@/types';
import MessageList from './MessageList';
import InputArea from './InputArea';

interface ChatWindowProps {
  conversation: Conversation | undefined;
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onNewConversation: () => void;
}

export default function ChatWindow({
  conversation,
  onUpdateConversation,
  onNewConversation,
}: ChatWindowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!conversation || !content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...conversation.messages, userMessage];
    
    // Update conversation with user message
    onUpdateConversation(conversation.id, {
      messages: updatedMessages,
      title: conversation.messages.length === 0 ? content.slice(0, 30) : conversation.title,
      updatedAt: new Date(),
    });

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      onUpdateConversation(conversation.id, {
        messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
        timestamp: new Date(),
      };
      onUpdateConversation(conversation.id, {
        messages: [...updatedMessages, errorMessage],
        updatedAt: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            选择一个对话或创建新对话
          </h2>
          <button
            onClick={onNewConversation}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            开始新对话
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {conversation.title}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={conversation.messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}


