"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Provider = "openai" | "gemini";

interface AssistantSettingsState {
  provider: Provider;
  openaiApiKey: string;
  geminiApiKey: string;
}

interface AssistantSettingsContextValue extends AssistantSettingsState {
  setProvider: (provider: Provider) => void;
  setOpenaiApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
}

const SETTINGS_KEY = "assistant-settings-storage";

const defaultSettings: AssistantSettingsState = {
  provider: "openai",
  openaiApiKey: "",
  geminiApiKey: "",
};

const AssistantSettingsContext = createContext<
  AssistantSettingsContextValue | undefined
>(undefined);

const parseStoredSettings = (raw: string | null): AssistantSettingsState => {
  if (!raw) {
    return { ...defaultSettings };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AssistantSettingsState>;
    return {
      provider: parsed.provider === "gemini" ? "gemini" : "openai",
      openaiApiKey:
        typeof parsed.openaiApiKey === "string" ? parsed.openaiApiKey : "",
      geminiApiKey:
        typeof parsed.geminiApiKey === "string" ? parsed.geminiApiKey : "",
    };
  } catch (error) {
    console.error(
      "Failed to parse assistant settings from localStorage",
      error,
    );
    return { ...defaultSettings };
  }
};

const readStoredSettings = (): AssistantSettingsState => {
  if (typeof window === "undefined") {
    return { ...defaultSettings };
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  return parseStoredSettings(raw);
};

export const AssistantSettingsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [settings, setSettings] = useState<AssistantSettingsState>(() =>
    readStoredSettings(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save assistant settings to localStorage", error);
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SETTINGS_KEY) {
        return;
      }

      setSettings(parseStoredSettings(event.newValue));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    (): AssistantSettingsContextValue => ({
      ...settings,
      setProvider: (provider: Provider) => {
        setSettings((prev) => ({ ...prev, provider }));
      },
      setOpenaiApiKey: (key: string) => {
        setSettings((prev) => ({ ...prev, openaiApiKey: key }));
      },
      setGeminiApiKey: (key: string) => {
        setSettings((prev) => ({ ...prev, geminiApiKey: key }));
      },
    }),
    [settings],
  );

  return (
    <AssistantSettingsContext.Provider value={value}>
      {children}
    </AssistantSettingsContext.Provider>
  );
};

export const useAssistantSettings = () => {
  const context = useContext(AssistantSettingsContext);

  if (!context) {
    throw new Error(
      "useAssistantSettings must be used within an AssistantSettingsProvider",
    );
  }

  return context;
};
