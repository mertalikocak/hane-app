"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  AssistantAction,
  AssistantApiResponse,
  AssistantChatMessage,
  AssistantModule,
} from "@/domain/assistantTypes";
import { buildAssistantContext } from "@/services/assistantContext";
import { executeAssistantAction } from "@/services/assistantExecutor";
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from "@/storage/calorieStorage";
import { useProfile } from "@/context/ProfileContext";
import {
  CheckIcon,
  CloseIcon,
  TrashIcon,
  SettingsIcon,
  UserIcon,
  ModuleLucideIcon,
} from "@/components/ui/Icons";

const CHAT_STORAGE_PREFIX = "hane_assistant_chat_history_";
const LEGACY_SHARED_CHAT_KEY = "hane_assistant_chat_history";
const AUTO_APPLY_STORAGE_KEY = "hane_assistant_auto_apply";

const getChatStorageKey = (profileKey: string) => `${CHAT_STORAGE_PREFIX}${profileKey}`;

function readProfileChat(profileKey: string): AssistantChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getChatStorageKey(profileKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProfileChat(profileKey: string, list: AssistantChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = list.slice(-50);
    const key = getChatStorageKey(profileKey);
    if (trimmed.length > 0) {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } else {
      localStorage.removeItem(key);
    }
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore storage errors
  }
}

const MODULE_META: Record<
  AssistantModule,
  { label: string; href: string; iconHref: string }
> = {
  gider: { label: "Hane Gider", href: "/gider", iconHref: "/gider" },
  taksit: { label: "Taksitler", href: "/gider?tab=taksit", iconHref: "/gider" },
  fit: { label: "Hane Fit", href: "/fit/dashboard", iconHref: "/fit/dashboard" },
  kalori: { label: "Hane Kalori", href: "/kalori", iconHref: "/kalori" },
  shopping: { label: "Alışveriş", href: "/shopping", iconHref: "/shopping" },
  calendar: { label: "Takvim", href: "/calendar", iconHref: "/calendar" },
  wedding: { label: "Hane Wedding", href: "/wedding", iconHref: "/wedding" },
  wishlist: { label: "Wish List", href: "/wishlist", iconHref: "/wishlist" },
  cleaning: { label: "Temizlik", href: "/cleaning", iconHref: "/cleaning" },
  cardolist: { label: "Hane Car", href: "/cardolist", iconHref: "/cardolist" },
};

const QUICK_PROMPTS: { module: AssistantModule; title: string; prompt: string }[] = [
  {
    module: "gider",
    title: "Karta harcama ekle",
    prompt: "Garanti kartına Mert için 650 TL market harcaması ekle",
  },
  {
    module: "fit",
    title: "Haftalık ölçüm gir",
    prompt: "Bugünkü ölçümümü gir: kilo 87.5 kg, bel 84 cm, boyun 39 cm",
  },
  {
    module: "kalori",
    title: "Öğün / kalori ekle",
    prompt: "Öğle yemeğine 1 tabak tavuklu pilav ve 1 bardak ayran ekle",
  },
  {
    module: "shopping",
    title: "Alışveriş listesi",
    prompt: "Alışveriş listesine 2 litre süt, 10 yumurta ve tam buğday ekmek ekle",
  },
];

function MicIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function StopIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className={className}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

function SendIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as new () => SpeechRecognitionLike) : null;
}

export function HaneAsistanView() {
  const {
    activeProfile,
    activeProfileId,
    isLoaded: isProfileLoaded,
    openProfileModal,
  } = useProfile();

  const effectiveProfileKey = activeProfile?.id || activeProfileId || "default";
  const effectiveProfileName = activeProfile?.firstName || "Kullanıcı";

  const [chatState, setChatState] = useState<{
    ownerKey: string | null;
    list: AssistantChatMessage[];
  }>({ ownerKey: null, list: [] });
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [autoApply, setAutoApply] = useState(false);

  const messages = chatState.ownerKey === effectiveProfileKey ? chatState.list : [];

  // Ayarlar & API Anahtarı modalı
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Sesli giriş (Web Speech API birincil, MediaRecorder yedek)
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseTextRef = useRef<string>("");
  const speechApiBlockedRef = useRef<boolean>(false);
  const speechGotResultRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(LEGACY_SHARED_CHAT_KEY)) {
        localStorage.removeItem(LEGACY_SHARED_CHAT_KEY);
      }
      const savedAuto = localStorage.getItem(AUTO_APPLY_STORAGE_KEY);
      if (savedAuto === "true") {
        setAutoApply(true);
      }
      const key = getStoredGeminiApiKey();
      setHasApiKey(Boolean(key));
      setApiKeyInput(key);
    } catch {
      // ignore storage errors
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
        speechRecognitionRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isProfileLoaded) return;
    const loaded = readProfileChat(effectiveProfileKey);
    setChatState({ ownerKey: effectiveProfileKey, list: loaded });

    const handleStorage = () => {
      const fresh = readProfileChat(effectiveProfileKey);
      setChatState((prev) => {
        if (
          prev.ownerKey === effectiveProfileKey &&
          JSON.stringify(prev.list) === JSON.stringify(fresh)
        ) {
          return prev;
        }
        return { ownerKey: effectiveProfileKey, list: fresh };
      });
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [isProfileLoaded, effectiveProfileKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, effectiveProfileKey]);

  const updateChatForProfile = (
    targetKey: string,
    updater: (prevList: AssistantChatMessage[]) => AssistantChatMessage[]
  ) => {
    const currentList = readProfileChat(targetKey);
    const nextList = updater(currentList).slice(-50);
    writeProfileChat(targetKey, nextList);
    setChatState((prev) =>
      prev.ownerKey === targetKey ? { ownerKey: targetKey, list: nextList } : prev
    );
  };

  const toggleAutoApply = () => {
    const next = !autoApply;
    setAutoApply(next);
    try {
      localStorage.setItem(AUTO_APPLY_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(apiKeyInput);
    setHasApiKey(Boolean(apiKeyInput.trim()));
    setIsSettingsOpen(false);
  };

  const handleClearChat = () => {
    writeProfileChat(effectiveProfileKey, []);
    setChatState({ ownerKey: effectiveProfileKey, list: [] });
  };

  const sendToAssistant = async (
    textPayload: string,
    audioPayload?: { data: string; mimeType: string }
  ) => {
    const cleanText = textPayload.trim();
    if (!cleanText && !audioPayload) return;
    if (isSending) return;

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.abort();
      speechRecognitionRef.current = null;
      setIsSpeechListening(false);
    }

    const targetProfileKey = effectiveProfileKey;
    const userMsgId = makeId("usr");
    const userMessage: AssistantChatMessage = {
      id: userMsgId,
      role: "user",
      content: audioPayload
        ? cleanText || "Sesli mesaj gönderildi"
        : cleanText,
      createdAt: new Date().toISOString(),
      isVoice: Boolean(audioPayload),
    };

    const historySnapshot = messages
      .filter((m) => !m.error)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    updateChatForProfile(targetProfileKey, (prev) => [...prev, userMessage]);
    if (!audioPayload) setInputText("");
    setIsSending(true);

    try {
      const context = buildAssistantContext();
      const apiKey = getStoredGeminiApiKey();

      const res = await fetch("/api/assistant-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanText,
          audio: audioPayload,
          history: historySnapshot,
          context,
          apiKey,
        }),
      });

      const data = (await res.json()) as AssistantApiResponse;

      if (!res.ok || !data.success) {
        if (data?.missingApiKey) {
          setIsSettingsOpen(true);
        }
        updateChatForProfile(targetProfileKey, (prev) => [
          ...prev,
          {
            id: makeId("err"),
            role: "assistant",
            content:
              data?.error ||
              "İstek işlenirken bir sorun oluştu, lütfen tekrar deneyin",
            createdAt: new Date().toISOString(),
            error: data?.error || "Hata",
          },
        ]);
        return;
      }

      if (audioPayload && data.transcribedText) {
        updateChatForProfile(targetProfileKey, (prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? { ...m, content: `Sesli: "${data.transcribedText}"` }
              : m
          )
        );
      }

      const rawActions = Array.isArray(data.actions) ? data.actions : [];
      const preparedActions: AssistantAction[] = rawActions.map((rawAct) => {
        const baseAction: AssistantAction = {
          id: makeId("act"),
          type: rawAct.type,
          module: rawAct.module,
          summary: rawAct.summary,
          payload: rawAct.payload || {},
          targetHref: MODULE_META[rawAct.module]?.href || "/",
          status: "pending",
        };

        if (autoApply) {
          const result = executeAssistantAction(baseAction);
          return {
            ...baseAction,
            status: result.success ? "applied" : "error",
            resultMessage: result.message,
            targetHref: result.targetHref,
          };
        }

        return baseAction;
      });

      const assistantMessage: AssistantChatMessage = {
        id: makeId("ast"),
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
        actions: preparedActions.length > 0 ? preparedActions : undefined,
        modelUsed: data.modelUsed,
      };

      updateChatForProfile(targetProfileKey, (prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ağ hatası oluştu";
      updateChatForProfile(targetProfileKey, (prev) => [
        ...prev,
        {
          id: makeId("err"),
          role: "assistant",
          content: `Bağlantı hatası: ${msg}`,
          createdAt: new Date().toISOString(),
          error: msg,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleActionDecision = (
    messageId: string,
    actionId: string,
    decision: "apply" | "cancel"
  ) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    const targetAct = targetMsg?.actions?.find((a) => a.id === actionId);
    if (!targetAct) return;

    if (decision === "cancel") {
      updateChatForProfile(effectiveProfileKey, (prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.actions
            ? {
                ...msg,
                actions: msg.actions.map((act) =>
                  act.id === actionId ? { ...act, status: "cancelled" } : act
                ),
              }
            : msg
        )
      );
      return;
    }

    if (targetAct.status === "applied") return;
    const res = executeAssistantAction(targetAct);

    updateChatForProfile(effectiveProfileKey, (prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.actions
          ? {
              ...msg,
              actions: msg.actions.map((act) =>
                act.id === actionId
                  ? {
                      ...act,
                      status: res.success ? "applied" : "error",
                      resultMessage: res.message,
                      targetHref: res.targetHref,
                    }
                  : act
              ),
            }
          : msg
      )
    );
  };

  const handleApplyAllActions = (messageId: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg?.actions) return;

    const resultsMap = new Map<string, ReturnType<typeof executeAssistantAction>>();
    for (const act of targetMsg.actions) {
      if (act.status === "pending" || act.status === "error") {
        resultsMap.set(act.id, executeAssistantAction(act));
      }
    }

    updateChatForProfile(effectiveProfileKey, (prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.actions
          ? {
              ...msg,
              actions: msg.actions.map((act) => {
                const res = resultsMap.get(act.id);
                if (!res) return act;
                return {
                  ...act,
                  status: res.success ? "applied" : "error",
                  resultMessage: res.message,
                  targetHref: res.targetHref,
                };
              }),
            }
          : msg
      )
    );
  };

  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingSeconds(0);

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 200) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = String(reader.result || "");
          const base64 = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
          if (base64) {
            sendToAssistant(inputText, { data: base64, mimeType });
            setInputText("");
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      updateChatForProfile(effectiveProfileKey, (prev) => [
        ...prev,
        {
          id: makeId("err"),
          role: "assistant",
          content: "Mikrofon erişimi sağlanamadı, tarayıcı izinlerini kontrol edin",
          createdAt: new Date().toISOString(),
          error: "Mikrofon hatası",
        },
      ]);
    }
  };

  const startVoiceInput = async () => {
    if (isSpeechListening || isRecording || isSending) return;

    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec || speechApiBlockedRef.current) {
      await startMediaRecorderFallback();
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = "tr-TR";
      rec.continuous = true;
      rec.interimResults = true;

      speechBaseTextRef.current = inputText.trim() ? `${inputText.trimEnd()} ` : "";
      speechGotResultRef.current = false;

      rec.onresult = (event) => {
        speechGotResultRef.current = true;
        const parts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i]?.[0]?.transcript?.trim();
          if (piece) parts.push(piece);
        }
        const combined = `${speechBaseTextRef.current}${parts.join(" ")}`.trimStart();
        setInputText(combined);
      };

      rec.onerror = (event) => {
        const errCode = event?.error || "";
        if (errCode === "aborted" || errCode === "no-speech") {
          return;
        }
        setIsSpeechListening(false);
        const currentRec = speechRecognitionRef.current;
        speechRecognitionRef.current = null;

        if (errCode === "not-allowed" || errCode === "service-not-allowed") {
          updateChatForProfile(effectiveProfileKey, (prev) => [
            ...prev,
            {
              id: makeId("err"),
              role: "assistant",
              content: "Mikrofon izni verilmedi, tarayıcı ayarlarından izin verin",
              createdAt: new Date().toISOString(),
              error: "Mikrofon izni",
            },
          ]);
          return;
        }

        if (
          errCode === "network" ||
          errCode === "language-not-supported" ||
          !speechGotResultRef.current
        ) {
          speechApiBlockedRef.current = true;
          try {
            currentRec?.abort();
          } catch {
            // ignore
          }
          void startMediaRecorderFallback();
        }
      };

      rec.onend = () => {
        setIsSpeechListening(false);
        speechRecognitionRef.current = null;
        inputRef.current?.focus();
      };

      speechRecognitionRef.current = rec;
      rec.start();
      setIsSpeechListening(true);
    } catch {
      speechRecognitionRef.current = null;
      setIsSpeechListening(false);
      await startMediaRecorderFallback();
    }
  };

  const stopVoiceInput = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsSpeechListening(false);
      inputRef.current?.focus();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToAssistant(inputText);
    }
  };

  const isMicActive = isSpeechListening || isRecording;

  return (
    <div className="flex flex-col h-[calc(100dvh-108px)] lg:h-[calc(100dvh-80px)] min-h-[480px] rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Sade Üst Bar */}
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight truncate">
            Hane Asistan
          </h1>
          <button
            type="button"
            onClick={() => openProfileModal("select")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground-secondary bg-surface-raised border border-border hover:border-border-strong transition-colors cursor-pointer shrink-0"
            title="Kullanıcıyı değiştir"
          >
            <UserIcon className="h-3.5 w-3.5 text-muted" />
            <span>{effectiveProfileName}</span>
            <span className="text-muted hidden sm:inline">· Özel sohbet</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-rose-600 hover:border-border-strong transition-colors cursor-pointer"
              aria-label="Sohbeti temizle"
              title="Sohbeti temizle"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground hover:border-border-strong transition-colors cursor-pointer"
            aria-label="Asistan ayarları"
            title="Asistan ayarları"
          >
            <SettingsIcon className="h-4 w-4" />
            {!hasApiKey && (
              <span
                className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-amber-500"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </header>

      {/* Mesaj Alanı */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="min-h-full flex flex-col items-center justify-center py-4">
            <div className="w-full max-w-2xl space-y-6">
              <div className="space-y-1.5 text-left sm:text-center">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                  Ne yapmak istersin, {effectiveProfileName}?
                </h2>
                <p className="text-sm text-muted">
                  Gider, ölçüm, kalori, alışveriş veya takvim için yaz ya da konuş
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((qp) => {
                  const mod = MODULE_META[qp.module];
                  return (
                    <button
                      key={qp.title}
                      type="button"
                      onClick={() => sendToAssistant(qp.prompt)}
                      className="p-4 rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-raised hover:border-border-strong transition-colors text-left cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="w-4 h-4 text-foreground-secondary shrink-0 flex items-center justify-center">
                          <ModuleLucideIcon href={mod.iconHref} className="w-4 h-4" />
                        </span>
                        <span>{qp.title}</span>
                      </div>
                      <p className="text-[13px] text-muted leading-snug line-clamp-2">
                        {qp.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            const pendingActions =
              msg.actions?.filter(
                (a) => a.status === "pending" || a.status === "error"
              ) || [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isUser ? "items-end" : "items-start"
                } space-y-2.5`}
              >
                {/* Mesaj Balonu */}
                <div
                  className={`max-w-[92%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : msg.error
                      ? "bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 rounded-bl-sm"
                      : "bg-surface-raised border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Aksiyon Onay Kartları */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="w-full max-w-[94%] sm:max-w-[80%] space-y-2.5">
                    {pendingActions.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleApplyAllActions(msg.id)}
                          className="primary-button h-9 px-3.5 text-xs font-medium rounded-xl"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>Tümünü onayla ({pendingActions.length})</span>
                        </button>
                      </div>
                    )}

                    {msg.actions.map((act) => {
                      const modMeta = MODULE_META[act.module];
                      const status = act.status || "pending";

                      return (
                        <div
                          key={act.id}
                          className={`rounded-xl border p-3.5 sm:p-4 space-y-2.5 transition-colors ${
                            status === "applied"
                              ? "bg-emerald-500/5 border-emerald-500/30"
                              : status === "cancelled"
                              ? "bg-surface-raised/50 border-border opacity-60"
                              : status === "error"
                              ? "bg-rose-500/5 border-rose-500/30"
                              : "bg-surface border-border-strong"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground-secondary">
                              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                                <ModuleLucideIcon
                                  href={modMeta.iconHref}
                                  className="w-4 h-4"
                                />
                              </span>
                              <span>{modMeta.label}</span>
                            </div>

                            {status === "applied" && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Kaydedildi</span>
                              </span>
                            )}
                            {status === "cancelled" && (
                              <span className="text-xs font-medium text-muted">
                                İptal edildi
                              </span>
                            )}
                            {status === "error" && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                <span>Hata</span>
                              </span>
                            )}
                          </div>

                          <p className="text-sm sm:text-[15px] font-medium text-foreground leading-snug">
                            {act.summary}
                          </p>

                          {act.resultMessage && (
                            <p
                              className={`text-[13px] leading-snug ${
                                status === "error"
                                  ? "text-rose-600 font-medium"
                                  : "text-emerald-700 dark:text-emerald-300"
                              }`}
                            >
                              {act.resultMessage}
                            </p>
                          )}

                          {(status === "pending" ||
                            status === "error" ||
                            status === "applied") && (
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {(status === "pending" || status === "error") && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActionDecision(msg.id, act.id, "apply")
                                    }
                                    className="primary-button min-h-[42px] flex-1 sm:flex-none px-4 text-sm font-medium rounded-xl"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                    <span>
                                      {status === "error"
                                        ? "Tekrar dene"
                                        : "Onayla ve kaydet"}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActionDecision(msg.id, act.id, "cancel")
                                    }
                                    className="secondary-button min-h-[42px] flex-1 sm:flex-none px-4 text-sm font-medium rounded-xl"
                                  >
                                    <CloseIcon className="w-4 h-4" />
                                    <span>İptal</span>
                                  </button>
                                </>
                              )}

                              {status === "applied" && (
                                <Link
                                  href={act.targetHref || modMeta.href}
                                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 py-1"
                                >
                                  <span>{modMeta.label} sayfasında gör</span>
                                  <span aria-hidden="true">→</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start">
            <div className="rounded-2xl rounded-bl-sm bg-surface-raised border border-border px-4 py-3 text-sm text-muted flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <span>Yanıt hazırlanıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Alt Mesaj Yazma Barı */}
      <div className="border-t border-border bg-surface p-3 sm:p-4 shrink-0">
        <div className="flex items-end gap-1.5 rounded-2xl border border-border bg-surface-raised p-1.5 focus-within:border-primary/60 transition-colors">
          <button
            type="button"
            onClick={isMicActive ? stopVoiceInput : startVoiceInput}
            disabled={isSending}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors shrink-0 cursor-pointer ${
              isMicActive
                ? "bg-rose-600 text-white"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface"
            }`}
            aria-label={isMicActive ? "Ses kaydını durdur" : "Sesle yaz"}
            title={isMicActive ? "Durdur" : "Sesle yaz"}
          >
            {isMicActive ? <StopIcon /> : <MicIcon />}
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isSpeechListening
                ? "Konuşun, söyledikleriniz yazılıyor"
                : "Bir şey yaz veya sor..."
            }
            disabled={isSending}
            className="flex-1 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted min-h-[44px] max-h-32 py-2.5 px-2 resize-none leading-normal"
          />

          <button
            type="button"
            onClick={() => sendToAssistant(inputText)}
            disabled={isSending || !inputText.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Gönder"
            title="Gönder"
          >
            <SendIcon />
          </button>
        </div>

        {(isSpeechListening || isRecording) && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2 px-1 tabular-nums">
            {isSpeechListening
              ? "Dinleniyor · Durdurmak için mikrofona dokun"
              : `Ses kaydediliyor · ${recordingSeconds} sn (göndermek için durdur)`}
          </p>
        )}
      </div>

      {/* Asistan Ayarları Modalı (Otomatik Kayıt + Gemini API Anahtarı) */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveSettings}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                Asistan ayarları
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="icon-button h-9 w-9"
                aria-label="Kapat"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Otomatik Kayıt Seçeneği */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-raised">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">
                  Otomatik kayıt
                </div>
                <p className="text-xs text-muted">
                  Açıkken asistanın oluşturduğu işlemler onay beklemeden kaydedilir
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoApply}
                onClick={toggleAutoApply}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  autoApply ? "bg-primary" : "bg-border-strong"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoApply ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Gemini API Anahtarı */}
            <div className="space-y-2">
              <label
                htmlFor="gemini-api-key-input"
                className="block text-sm font-medium text-foreground"
              >
                Gemini API anahtarı
              </label>
              <input
                id="gemini-api-key-input"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="field h-11 px-3.5 text-sm"
              />
              <p className="text-xs text-muted leading-relaxed">
                Hane Kalori ve Takvim ile ortak kullanılır. Sunucuda tanımlıysa boş
                bırakabilirsiniz.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="secondary-button h-10 px-4 text-sm font-medium rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                className="primary-button h-10 px-4 text-sm font-medium rounded-xl"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
