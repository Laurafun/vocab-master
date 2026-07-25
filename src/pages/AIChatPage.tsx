import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const SYSTEM_PROMPT = `你是一个专业的英语单词学习助手。你的职责包括：
1. 帮助用户理解单词的含义、用法和搭配
2. 提供单词的同义词、反义词和词根词缀分析
3. 用单词造出贴近生活的例句
4. 解释易混淆单词的区别
5. 提供记忆技巧和联想方法
请用简洁、准确、友好的方式回答问题。回答使用中文。`;

export function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 初始化欢迎消息
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的 AI 单词学习助手。你可以问我：\n\n- 单词的含义和用法\n- 如何记忆某个单词\n- 同义词辨析\n- 用单词造句\n- 词根词缀分析\n\n有什么我可以帮助你的吗？',
    }]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: 'claude-sonnet-4',
          systemPrompt: SYSTEM_PROMPT,
          permissionMode: 'default',
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text') {
                fullContent += parsed.content;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullContent, isStreaming: true }
                    : m
                ));
              } else if (parsed.type === 'error') {
                fullContent += `\n\n❌ 错误: ${parsed.message}`;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullContent, isStreaming: false }
                    : m
                ));
              } else if (parsed.type === 'done') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false }
                    : m
                ));
              }
            } catch {
              // 忽略 JSON 解析错误
            }
          }
        }
      }

      // 确保最终状态
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, isStreaming: false, content: m.content || '（无响应）' }
          : m
      ));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, content: `连接失败: ${err.message}\n\n请检查 CodeBuddy API Key 是否已配置（设置页面）。`, isStreaming: false }
          : m
      ));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
      {/* 顶部标题 */}
      <div className="border-b px-6 py-4" style={{ borderColor: 'var(--td-component-stroke)', backgroundColor: 'var(--td-bg-color-container)' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--td-brand-color-light)' }}>
            <Sparkles size={18} color="var(--td-brand-color)" />
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--td-text-color-primary)' }}>AI 单词学习助手</h1>
            <p className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>Powered by CodeBuddy Agent SDK</p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: msg.role === 'user' ? 'var(--td-brand-color-light)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                }}
              >
                {msg.role === 'user' ? <User size={18} color="var(--td-brand-color)" /> : <Bot size={18} color="#fff" />}
              </div>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: msg.role === 'user' ? 'var(--td-brand-color-light)' : 'var(--td-bg-color-container)',
                  border: msg.role === 'assistant' ? '1px solid var(--td-component-stroke)' : 'none',
                }}
              >
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: 'var(--td-text-color-primary)' }}
                >
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="ml-1 inline-block h-3 w-0.5 animate-pulse" style={{ backgroundColor: 'var(--td-brand-color)' }} />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 */}
      <div className="border-t px-6 py-4" style={{ borderColor: 'var(--td-component-stroke)', backgroundColor: 'var(--td-bg-color-container)' }}>
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，如：解释一下 abandon 和 discard 的区别..."
              rows={1}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--td-bg-color-component)',
                color: 'var(--td-text-color-primary)',
                border: '1px solid var(--td-component-stroke)',
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
          </div>
          {loading ? (
            <button
              onClick={handleStop}
              className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-all"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              停止
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Send size={16} />
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
