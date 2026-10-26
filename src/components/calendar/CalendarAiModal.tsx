"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CalendarCategory,
  CalendarScope,
  CALENDAR_CATEGORIES,
  AICalendarParsedEvent,
} from "@/domain/calendarTypes";
import { saveCalendarEvent } from "@/storage/calendarStorage";
import { getStoredGeminiApiKey, CALORIE_STORAGE_KEYS } from "@/storage/calorieStorage";
import { queueLocalChangePush } from "@/lib/firebase/syncService";
import { useProfile } from "@/context/ProfileContext";

interface CalendarAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventsAdded: () => void;
}

interface ExtendedSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

const QUICK_EXAMPLES = [
  "🚨 Kasımda 10 12 15 günleri nöbet olarak ekle",
  "🏥 Yarın saat 14:30'da diş hekimi randevusu",
  "💰 28 Ekimde elektrik faturası son ödeme",
  "🎂 5 Kasım annemin doğum günü",
  "✈️ 10-15 Kasım Antalya tatili",
  "💼 Cuma saat 10:00 haftalık ekip toplantısı",
];

export function CalendarAiModal({
  isOpen,
  onClose,
  onEventsAdded,
}: CalendarAiModalProps) {
  const { profiles, activeProfile } = useProfile();

  const [promptText, setPromptText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingLabel, setAnalyzingLabel] = useState<string>("Yapay Zeka Analiz Ediyor...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [extractedEvents, setExtractedEvents] = useState<AICalendarParsedEvent[]>([]);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");
  const promptTextRef = useRef(promptText);

  useEffect(() => {
    promptTextRef.current = promptText;
  }, [promptText]);

  const cleanupAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    setIsRecording(false);
    setRecordSeconds(0);
  };

  // Optional live speech interim preview setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechClass =
        (window as unknown as { SpeechRecognition?: new () => ExtendedSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => ExtendedSpeechRecognition }).webkitSpeechRecognition;

      if (SpeechClass) {
        try {
          const recognition = new SpeechClass();
          recognition.lang = "tr-TR";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript.trim()) {
              setPromptText(currentTranscript);
            }
          };

          recognition.onerror = (e) => {
            // Silently ignore browser speech network errors because MediaRecorder
            // captures the true audio locally and sends it to Gemini directly!
            console.warn("Speech recognition notice (MediaRecorder active):", e.error);
          };

          recognitionRef.current = recognition;
        } catch {
          // ignore
        }
      }
    }

    return () => {
      cleanupAudioRecording();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPromptText("");
      setExtractedEvents([]);
      setErrorMessage(null);
      setSummaryMessage(null);
      setModelUsed(null);
      setApiKeyInput(getStoredGeminiApiKey());
    } else {
      cleanupAudioRecording();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startVoiceRecording = async () => {
    cleanupAudioRecording();
    setErrorMessage(null);

    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Tarayıcınız ses kaydını desteklemiyor. Lütfen aşağıdaki alana yazarak kullanın.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let chosenMime = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          chosenMime = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          chosenMime = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          chosenMime = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          chosenMime = "audio/ogg";
        }
      }
      mimeTypeRef.current = chosenMime;

      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Release hardware mic
        stream.getTracks().forEach((track) => track.stop());

        // Eğer tarayıcı konuşmayı metne dökmeyi başardıysa, ses dosyası göndermeden
        // doğrudan METİN ile analiz yapıyoruz (Böylece ses token'ı harcanmaz ve 1 sn'de biter!)
        if (promptTextRef.current && promptTextRef.current.trim().length > 3) {
          handleAnalyze();
          return;
        }

        // Tarayıcı STT başarısız olduysa (network hatası vb.) ses kaydını Gemini'ye fallback olarak gönder
        const finalMime = recorder.mimeType || mimeTypeRef.current || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

        if (audioBlob.size > 500) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = (reader.result as string)?.split(",")?.[1];
            if (base64Data) {
              handleAnalyze({
                audio: {
                  mimeType: finalMime.split(";")[0],
                  data: base64Data,
                },
              });
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      // Start interim recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // ignore
        }
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 15) {
            stopVoiceRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErrorMessage("Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından mikrofona izin verin veya yazarak ekleyin.");
      } else {
        setErrorMessage("Mikrofona erişilemedi. Lütfen mikrofonunuzu kontrol edin veya yazarak ekleyin.");
      }
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("MediaRecorder stop error:", err);
      }
    }

    setIsRecording(false);
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const handleAnalyze = async (options?: { audio?: { mimeType: string; data: string } }) => {
    const audioPayload = options?.audio;
    const textToSubmit = promptText.trim();

    if (!textToSubmit && !audioPayload) return;

    if (isRecording) {
      stopVoiceRecording();
    }

    setIsAnalyzing(true);
    setAnalyzingLabel(
      audioPayload
        ? "Sesiniz dinleniyor ve takvime planlanıyor..."
        : "Yapay zeka analiz ediyor..."
    );
    setErrorMessage(null);
    setSummaryMessage(null);
    setExtractedEvents([]);

    try {
      const storedKey = getStoredGeminiApiKey();
      const today = new Date();
      const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

      const res = await fetch("/api/calendar-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSubmit || undefined,
          audio: audioPayload || undefined,
          todayDate: today.toISOString().split("T")[0],
          todayDayOfWeek: dayNames[today.getDay()],
          activeProfileName: activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}`.trim() : "Ortak",
          activeProfileId: activeProfile?.id || "default",
          profiles: profiles.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`.trim() })),
          apiKey: storedKey || undefined,
        }),
        signal: AbortSignal.timeout(audioPayload ? 60000 : 35000),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.missingApiKey) {
          setIsKeyModalOpen(true);
        }
        setErrorMessage(data.error || "Yapay zeka takvim analizinde bir hata oluştu.");
        return;
      }

      if (data.result) {
        if (data.result.transcribedText) {
          setPromptText(data.result.transcribedText);
        }
        if (Array.isArray(data.result.events)) {
          setExtractedEvents(data.result.events);
          setSummaryMessage(data.result.summary || `${data.result.events.length} adet etkinlik bulundu.`);
        }
        setModelUsed(data.modelUsed || null);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes("timed out") || (err as { name?: string })?.name === "AbortError") {
        setErrorMessage("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Bağlantı hatası oluştu.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAllEvents = () => {
    if (extractedEvents.length === 0) return;

    extractedEvents.forEach((evt) => {
      saveCalendarEvent({
        title: evt.title,
        description: evt.description || "",
        date: evt.date,
        endDate: evt.endDate,
        time: evt.time,
        endTime: evt.endTime,
        isAllDay: evt.isAllDay,
        category: evt.category,
        scope: evt.scope,
        targetProfileId: evt.targetProfileId,
        targetProfileName: evt.targetProfileName,
        createdByProfileId: activeProfile?.id || "default",
        createdByName: activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}`.trim() : "Hane",
      });
    });

    // Buluta anında yedekle
    queueLocalChangePush(true);
    onEventsAdded();
    onClose();
  };

  const handleRemoveExtractedEvent = (index: number) => {
    setExtractedEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExtractedField = (
    index: number,
    field: keyof AICalendarParsedEvent,
    value: unknown
  ) => {
    setExtractedEvents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      localStorage.setItem(CALORIE_STORAGE_KEYS.geminiApiKey, apiKeyInput.trim());
      setIsKeyModalOpen(false);
      setErrorMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-xl rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-xl text-white shadow-md">
              ✨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Yapay Zeka Takvim Asistanı
                </h2>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Ses & Metin
                </span>
              </div>
              <p className="text-xs text-muted">
                Konuşarak veya yazarak nöbet, randevu, fatura veya planlarınızı anında ekleyin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Input & Microphone Area */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Örn: 'Kasımda 10 12 15 günleri nöbet olarak ekle' veya 'Yarın saat 14:30 diş kontrolü'..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-raised p-3.5 pr-14 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:border-purple-500 focus:outline-none transition resize-none"
            />

            {/* Glowing Microphone Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`absolute right-3 bottom-3.5 flex h-10 w-10 items-center justify-center rounded-xl transition cursor-pointer shadow-sm ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30"
                  : "bg-surface border border-border/80 text-foreground hover:text-purple-600 hover:border-purple-500/50"
              }`}
              title={isRecording ? "Kaydı Durdur ve Planla" : "Mikrofonla Konuşarak Söyle"}
            >
              <span className="text-lg">{isRecording ? "⏹️" : "🎙️"}</span>
            </button>
          </div>

          {/* Voice Recording Active Wave Indicator */}
          {isRecording && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Sesiniz kaydediliyor...</span>
                    <span className="font-mono text-[11px] bg-rose-500/20 px-1.5 py-0.5 rounded-md">
                      00:{recordSeconds.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-500/80">
                    Konuşmanız bittiğinde tamamla butonuna basın, yapay zeka doğrudan takvime aktaracaktır.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="flex items-center gap-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 text-xs shadow-xs transition cursor-pointer shrink-0 ml-2"
              >
                <span>⏹️</span>
                <span>Tamamla</span>
              </button>
            </div>
          )}

          {/* Quick Examples */}
          {!extractedEvents.length && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted">Örnek Cümleler:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPromptText(ex.substring(3))}
                    className="rounded-xl border border-border/80 bg-surface-raised/60 hover:bg-surface-raised px-2.5 py-1 text-[11px] text-muted hover:text-foreground transition cursor-pointer truncate max-w-full"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500 space-y-2">
              <div className="font-semibold">{errorMessage}</div>
              {errorMessage.includes("API") && (
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(true)}
                  className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-600 transition cursor-pointer"
                >
                  🔑 Gemini API Anahtarını Gir
                </button>
              )}
            </div>
          )}

          {/* Analyze Button */}
          {!extractedEvents.length && (
            <button
              type="button"
              disabled={isAnalyzing || (!promptText.trim() && !isRecording)}
              onClick={() => {
                if (isRecording) {
                  stopVoiceRecording();
                } else {
                  handleAnalyze();
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{analyzingLabel}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Etkinlikleri Çıkar & Planla</span>
                </>
              )}
            </button>
          )}

          {/* Extracted Events Preview */}
          {extractedEvents.length > 0 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    ✓ {summaryMessage}
                  </span>
                  {modelUsed && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
                      ⚡ {modelUsed}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExtractedEvents([])}
                  className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
                >
                  ← Yeniden Yaz
                </button>
              </div>

              {/* Event Cards List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {extractedEvents.map((evt, idx) => {
                  const catInfo = CALENDAR_CATEGORIES[evt.category] || CALENDAR_CATEGORIES.default;

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/80 bg-surface-raised/70 p-3 space-y-2.5 text-xs hover:border-purple-500/40 transition"
                    >
                      {/* Top Bar of Card */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface border border-border/60 text-sm shrink-0">
                            {catInfo.icon}
                          </span>
                          <input
                            type="text"
                            value={evt.title}
                            onChange={(e) => handleUpdateExtractedField(idx, "title", e.target.value)}
                            className="w-full font-bold text-xs text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-purple-500 focus:outline-none"
                            placeholder="Etkinlik Başlığı"
                          />
                        </div>

                        {/* Category Selector */}
                        <select
                          value={evt.category}
                          onChange={(e) => handleUpdateExtractedField(idx, "category", e.target.value as CalendarCategory)}
                          className="rounded-xl border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer"
                        >
                          {Object.values(CALENDAR_CATEGORIES).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.label}
                            </option>
                          ))}
                        </select>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExtractedEvent(idx)}
                          className="text-muted hover:text-rose-500 text-xs px-1 cursor-pointer"
                          title="Bu Etkinliği Çıkar"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Date & Time Row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 bg-surface border border-border/60 px-2 py-1 rounded-xl">
                          <span className="text-muted">📅</span>
                          <input
                            type="date"
                            value={evt.date}
                            onChange={(e) => handleUpdateExtractedField(idx, "date", e.target.value)}
                            className="bg-transparent text-foreground font-semibold focus:outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-surface border border-border/60 px-2 py-1 rounded-xl">
                          <span className="text-muted">⏰</span>
                          <input
                            type="time"
                            value={evt.time || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateExtractedField(idx, "time", val || undefined);
                              handleUpdateExtractedField(idx, "isAllDay", !val);
                            }}
                            className="bg-transparent text-foreground font-semibold focus:outline-none w-full"
                          />
                        </div>
                      </div>

                      {/* Scope & Profile Row */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateExtractedField(idx, "scope", evt.scope === "common" ? "personal" : "common")}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition cursor-pointer border ${
                              evt.scope === "common"
                                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                                : "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {evt.scope === "common" ? "👥 Ortak Aile" : "👤 Kişisel"}
                          </button>

                          {evt.scope === "personal" && (
                            <select
                              value={evt.targetProfileId || ""}
                              onChange={(e) => {
                                const pid = e.target.value;
                                const p = profiles.find((prof) => prof.id === pid);
                                handleUpdateExtractedField(idx, "targetProfileId", pid);
                                handleUpdateExtractedField(idx, "targetProfileName", p ? `${p.firstName} ${p.lastName}`.trim() : undefined);
                              }}
                              className="rounded-lg border border-border bg-surface px-2 py-0.5 text-[10px] text-foreground focus:outline-none"
                            >
                              <option value="">Profil Seçin...</option>
                              {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.firstName} {p.lastName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {evt.isAllDay && (
                          <span className="text-[10px] text-muted">Tüm Gün</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm & Save Button */}
              <div className="flex items-center justify-between pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllEvents}
                  className="rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  ✓ Hepsini Takvime Ekle ({extractedEvents.length} Etkinlik)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Key Modal inside if needed */}
        {isKeyModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <form
              onSubmit={handleSaveApiKey}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">🔑 Gemini API Anahtarı</h3>
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted">
                Yapay zekanın takvime etkinlik ekleyebilmesi için ücretsiz Google Gemini API anahtarınızı girin:
              </p>
              <input
                type="password"
                required
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
