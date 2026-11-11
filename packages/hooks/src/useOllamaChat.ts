import { useState, useCallback } from "react";
import type { ChatMessage, ModelConfig } from "@myllama/types";
import { useApiUrl } from "@myllama/hooks";

export interface UseOllamaChatOptions {
  model: string;
  config?: ModelConfig;
  initialWelcome?: string;
}

export interface UseOllamaChatReturn {
  messages: ChatMessage[];
  inputPrompt: string;
  setInputPrompt: (prompt: string) => void;
  isGenerating: boolean;
  chatError: string | null;
  sendMessage: (promptOverride?: string) => Promise<void>;
  toggleThinking: (msgId: string) => void;
  clearChat: () => void;
}

const DEFAULT_WELCOME =
  "👋 Welcome to MyLlama! I am connected to your local Ollama instance through the Bun server. Type a message below or pick one of the sample prompts to test me.";

export function useOllamaChat({
  model,
  config,
  initialWelcome = DEFAULT_WELCOME,
}: UseOllamaChatOptions): UseOllamaChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: initialWelcome,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const apiUrl = useApiUrl();

  const sendMessage = useCallback(
    async (promptOverride?: string) => {
      const text = (promptOverride || inputPrompt).trim();
      if (!text || isGenerating) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };

      const assistantMsgId = (Date.now() + 1).toString();
      const placeholderAssistant: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        thinking: "",
        showThinking: false,
      };

      const newMessages = [...messages, userMessage];
      setMessages([...newMessages, placeholderAssistant]);
      setInputPrompt("");
      setIsGenerating(true);
      setChatError(null);

      const payloadMessages = newMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch(`${apiUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: payloadMessages,
            config,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errJson = await response
            .json()
            .catch(() => ({ error: response.statusText }));
          throw new Error(errJson.error || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No readable response body received from server");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = "";
        let accumulatedContent = "";
        let accumulatedThinking = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split("\n");
          streamBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr) as {
                content?: string;
                thinking?: string;
                done?: boolean;
              };
              if (parsed.content) accumulatedContent += parsed.content;
              if (parsed.thinking) accumulatedThinking += parsed.thinking;

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                      ...msg,
                      content: accumulatedContent,
                      thinking: accumulatedThinking,
                    }
                    : msg
                )
              );
            } catch {
              // Ignore partial parse chunks
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setChatError(errMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                ...msg,
                content: `⚠️ Error contacting Ollama: ${errMsg}`,
              }
              : msg
          )
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [apiUrl, model, config, inputPrompt, isGenerating, messages]
  );

  const toggleThinking = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, showThinking: !m.showThinking } : m
      )
    );
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared. Ask me anything!",
      },
    ]);
    setChatError(null);
  }, []);

  return {
    messages,
    inputPrompt,
    setInputPrompt,
    isGenerating,
    chatError,
    sendMessage,
    toggleThinking,
    clearChat,
  };
}
