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
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SparklesIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  SettingsIcon,
  UserIcon,
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
  { label: string; icon: string; href: string; badgeClass: string }
> = {
  gider: {
    label: "Hane Gider",
    icon: "💰",
    href: "/gider",
    badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  },
  taksit: {
    label: "Taksitler",
    icon: "💳",
    href: "/gider?tab=taksit",
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  },
  fit: {
    label: "Hane Fit",
    icon: "📐",
    href: "/fit/dashboard",
    badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
  },
  kalori: {
    label: "Hane Kalori",
    icon: "🥑",
    href: "/kalori",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
  },
  shopping: {
    label: "Alışveriş",
    icon: "🛒",
    href: "/shopping",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  calendar: {
    label: "Takvim",
    icon: "📅",
    href: "/calendar",
    badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  },
  wedding: {
    label: "Hane Wedding",
    icon: "💍",
    href: "/wedding",
    badgeClass: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25",
  },
  wishlist: {
    label: "Wish List",
    icon: "🎁",
    href: "/wishlist",
    badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  },
  cleaning: {
    label: "Temizlik",
    icon: "🧹",
    href: "/cleaning",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  },
  cardolist: {
    label: "Hane Car",
    icon: "🚗",
    href: "/cardolist",
    badgeClass: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25",
  },
};

const QUICK_PROMPTS = [
  {
    icon: "💰",
    title: "Karta harcama ekle",
    prompt: "Garanti kartına Mert için 650 TL market harcaması ekle",
  },
  {
    icon: "📐",
    title: "Haftalık ölçüm gir",
    prompt: "Bugünkü ölçümümü gir: kilo 87.5 kg, bel 84 cm, boyun 39 cm",
  },
  {
    icon: "🥑",
    title: "Öğün / Kalori ekle",
    prompt: "Öğle yemeğine 1 tabak tavuklu pilav ve 1 bardak ayran ekle",
  },
  {
    icon: "🛒",
    title: "Alışveriş listesi",
    prompt: "Alışveriş listesine 2 litre süt, 10 yumurta ve tam buğday ekmek ekle",
  },
  {
    icon: "📅",
    title: "Takvime etkinlik ekle",
    prompt: "Yarın saat 15:00'e diş hekimi randevusu ekle",
  },
  {
    icon: "📊",
    title: "Durum özeti sor",
    prompt: "Bu ay ne kadar kart ekstresi görünüyor ve listede hangi alışverişler var?",
  },
];

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

  // API Key modal state
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Voice input state (Web Speech API birincil, MediaRecorder yedek)
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

  // İlk yüklemede genel ayarları yükle ve eski ortak sohbet anahtarını temizle
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

  // Aktif profil değiştikçe yalnızca o profile ait özel sohbeti yükle
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

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(apiKeyInput);
    setHasApiKey(Boolean(apiKeyInput.trim()));
    setIsApiModalOpen(false);
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
        ? cleanText || "🎤 Sesli mesaj gönderildi..."
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
          setIsApiModalOpen(true);
        }
        updateChatForProfile(targetProfileKey, (prev) => [
          ...prev,
          {
            id: makeId("err"),
            role: "assistant",
            content:
              data?.error ||
              "İstek işlenirken bir sorun oluştu. Lütfen tekrar deneyin.",
            createdAt: new Date().toISOString(),
            error: data?.error || "Hata",
          },
        ]);
        return;
      }

      // Sesli mesaj deşifresini kullanıcı balonuna yaz
      if (audioPayload && data.transcribedText) {
        updateChatForProfile(targetProfileKey, (prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? { ...m, content: `🎤 "${data.transcribedText}"` }
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
      const msg = err instanceof Error ? err.message : "Ağ hatası oluştu.";
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
          content: "Mikrofon erişimi sağlanamadı. Tarayıcı izinlerini kontrol edin.",
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
              content: "Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofon erişimine izin verin.",
              createdAt: new Date().toISOString(),
              error: "Mikrofon izni",
            },
          ]);
          return;
        }

        // Brave vb. tarayıcılar Google Speech sunucusunu engellediğinde ("network") veya dil hatasında
        // otomatik olarak ses kaydı (MediaRecorder) yedeğine geç
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

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        badge="AI • Tüm Modüller"
        icon={<SparklesIcon className="h-3.5 w-3.5" />}
        title="Hane Asistan"
        subtitle="Gider, taksit, fit ölçümü, kalori, alışveriş, takvim, düğün ve temizlik dahil tüm modülleri tek sohbetten yönetin."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Aktif Kullanıcı Özel Sohbet Rozeti */}
            <button
              type="button"
              onClick={() => openProfileModal("select")}
              className="h-9 px-3 rounded-xl border border-border-lavender bg-accent text-foreground text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 hover:bg-accent-hover"
              title="Aktif kullanıcıya özel sohbet (değiştirmek için tıklayın)"
            >
              <UserIcon className="h-3.5 w-3.5 text-primary" />
              <span>🔒 {effectiveProfileName}</span>
            </button>

            {/* Otomatik Uygula Toggle */}
            <button
              type="button"
              onClick={toggleAutoApply}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                autoApply
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300"
                  : "bg-surface border-border text-foreground-secondary hover:text-foreground"
              }`}
              title="Açıkken asistanın oluşturduğu kayıtlar onay beklemeden doğrudan kaydedilir"
            >
              <span>⚡</span>
              <span>{autoApply ? "Otomatik Kayıt: Açık" : "Onaylı Mod"}</span>
            </button>

            {/* Gemini API Key Butonu */}
            <button
              type="button"
              onClick={() => setIsApiModalOpen(true)}
              className="secondary-button h-9 px-3 text-xs flex items-center gap-1.5"
              title="Gemini API Anahtarını Ayarla"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              <span>API Anahtarı</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  hasApiKey ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="secondary-button h-9 px-3 text-xs text-muted hover:text-rose-600 flex items-center gap-1.5"
                title="Sohbet Geçmişini Temizle"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            )}
          </div>
        }
      />

      {/* Bağlı Modüller Şeridi */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider shrink-0 mr-1">
          Erişim:
        </span>
        {(Object.keys(MODULE_META) as AssistantModule[]).map((mod) => {
          const m = MODULE_META[mod];
          return (
            <Link
              key={mod}
              href={m.href}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition hover:opacity-80 ${m.badgeClass}`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Ana Sohbet Kutusu */}
      <div className="ds-card flex flex-col h-[calc(100vh-290px)] min-h-[460px] max-h-[760px] overflow-hidden">
        {/* Mesajlar Alanı */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-4">
              <div className="space-y-2 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/25 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mx-auto">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Hane Asistan&apos;a Hoş Geldiniz
                </h2>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Tüm uygulama verilerinize doğrudan erişebilirim. Bana doğal bir cümle yazın veya
                  sesle söyleyin; soruları yanıtlayayım ya da sizin yerinize kayıtları ekleyeyim.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-3xl text-left">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.title}
                    type="button"
                    onClick={() => sendToAssistant(qp.prompt)}
                    className="p-3 rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-raised hover:border-primary/40 transition text-left cursor-pointer group space-y-1"
                  >
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      <span>{qp.icon}</span>
                      <span>{qp.title}</span>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2 leading-snug">
                      &ldquo;{qp.prompt}&rdquo;
                    </p>
                  </button>
                ))}
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
                  } space-y-2`}
                >
                  {/* Mesaj Balonu */}
                  <div
                    className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-xs"
                        : msg.error
                        ? "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-bl-sm"
                        : "bg-surface-raised border border-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                    {msg.modelUsed && (
                      <div className="mt-1.5 text-[10px] opacity-60 font-medium">
                        ✨ {msg.modelUsed}
                      </div>
                    )}
                  </div>

                  {/* Aksiyon Kartları */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="w-full max-w-[95%] sm:max-w-[82%] space-y-2">
                      {pendingActions.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleApplyAllActions(msg.id)}
                            className="primary-button h-7 px-3 text-[11px] font-bold"
                          >
                            <CheckIcon className="w-3 h-3" />
                            <span>Tümünü Onayla ({pendingActions.length})</span>
                          </button>
                        </div>
                      )}

                      {msg.actions.map((act) => {
                        const modMeta = MODULE_META[act.module];
                        const status = act.status || "pending";

                        return (
                          <div
                            key={act.id}
                            className={`rounded-xl border p-3 transition space-y-2 ${
                              status === "applied"
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : status === "cancelled"
                                ? "bg-surface-raised/50 border-border opacity-60"
                                : status === "error"
                                ? "bg-rose-500/10 border-rose-500/30"
                                : "bg-surface border-border-lavender shadow-2xs"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${modMeta.badgeClass}`}
                              >
                                <span>{modMeta.icon}</span>
                                <span>{modMeta.label}</span>
                              </span>

                              {status === "applied" && (
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                  <CheckIcon className="w-3.5 h-3.5" />
                                  <span>Kaydedildi</span>
                                </span>
                              )}
                              {status === "cancelled" && (
                                <span className="text-[11px] font-semibold text-muted">
                                  İptal edildi
                                </span>
                              )}
                              {status === "error" && (
                                <span className="text-[11px] font-bold text-rose-600">
                                  Hata
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-foreground">
                              {act.summary}
                            </p>

                            {act.resultMessage && (
                              <p
                                className={`text-xs ${
                                  status === "error"
                                    ? "text-rose-600 font-semibold"
                                    : "text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                {act.resultMessage}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              {(status === "pending" || status === "error") && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActionDecision(msg.id, act.id, "apply")
                                    }
                                    className="primary-button h-8 px-3 text-xs font-bold"
                                  >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    <span>
                                      {status === "error"
                                        ? "Tekrar Dene"
                                        : "Onayla ve Kaydet"}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActionDecision(msg.id, act.id, "cancel")
                                    }
                                    className="secondary-button h-8 px-3 text-xs"
                                  >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                    <span>İptal</span>
                                  </button>
                                </div>
                              )}

                              {status === "applied" && (
                                <Link
                                  href={act.targetHref || modMeta.href}
                                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{modMeta.label} sayfasında gör →</span>
                                </Link>
                              )}
                            </div>
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
              <div className="rounded-2xl rounded-bl-sm bg-surface-raised border border-border px-4 py-3 text-xs text-muted flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-ping" />
                <span>Hane Asistan düşünüyor ve verileri kontrol ediyor...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Alt Mesaj Yazma Barı */}
        <div className="border-t border-border bg-surface p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={
                isSpeechListening || isRecording ? stopVoiceInput : startVoiceInput
              }
              disabled={isSending}
              className={`h-11 px-3 rounded-xl border text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSpeechListening || isRecording
                  ? "bg-rose-600 border-rose-600 text-white animate-pulse"
                  : "bg-surface-raised border-border text-foreground hover:border-primary/40"
              }`}
              title={
                isSpeechListening
                  ? "Dinlemeyi Durdur"
                  : isRecording
                  ? "Kaydı Durdur ve Gönder"
                  : "Sesle Yaz (Tarayıcı Dikte)"
              }
            >
              <span>{isSpeechListening || isRecording ? "⏹️" : "🎙️"}</span>
              {isSpeechListening && <span>Dinleniyor</span>}
              {isRecording && (
                <span className="tabular-nums">{recordingSeconds}s</span>
              )}
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isSpeechListening
                  ? "Konuşun, söyledikleriniz buraya canlı yazılıyor..."
                  : "Örn: Garanti kartına Mert için 500 TL yakıt ekle veya kilom 87 kg..."
              }
              disabled={isSending}
              className="field flex-1 min-h-[44px] max-h-32 py-2.5 px-3.5 text-sm resize-none leading-snug"
            />

            <button
              type="button"
              onClick={() => sendToAssistant(inputText)}
              disabled={isSending || !inputText.trim()}
              className="primary-button h-11 px-4 sm:px-5 text-xs sm:text-sm font-bold shrink-0 disabled:opacity-50"
            >
              <span>Gönder</span>
            </button>
          </div>
          <p className="text-[10px] text-muted mt-1.5 px-1">
            {isSpeechListening
              ? "🎙️ Konuşmanız doğrudan yazı kutusuna aktarılıyor; bitince durdurup düzenleyebilir veya Gönder'e basabilirsiniz."
              : "💡 Mikrofonla konuşarak metne çevirebilir, tek cümlede birden fazla modül komutu verebilirsiniz. Enter ile gönderir, Shift+Enter ile alt satıra geçersiniz."}
          </p>
        </div>
      </div>

      {/* Gemini API Anahtarı Modalı */}
      {isApiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveApiKey}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>🔑</span>
                <span>Gemini API Anahtarı</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsApiModalOpen(false)}
                className="icon-button h-8 w-8"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Hane Kalori, Takvim ve Asistan ortak Gemini API anahtarını kullanır. Sunucuda{" "}
              <code className="px-1 py-0.5 rounded bg-surface-raised">GEMINI_API_KEY</code>{" "}
              tanımlıysa boş bırakabilirsiniz.
            </p>

            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="field h-10 px-3 text-sm"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApiModalOpen(false)}
                className="secondary-button h-9 px-3.5 text-xs"
              >
                İptal
              </button>
              <button
                type="submit"
                className="primary-button h-9 px-4 text-xs font-bold"
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
