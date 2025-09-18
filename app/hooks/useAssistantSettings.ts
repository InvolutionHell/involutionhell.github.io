"use client";

import { useState, useEffect } from "react";

type Provider = "openai" | "gemini";

interface AssistantSettings {
  provider: Provider;
  openaiApiKey: string;
  geminiApiKey: string;
}

const SETTINGS_KEY = "assistant-settings-storage";

export const useAssistantSettings = () => {
  const [settings, setSettings] = useState<AssistantSettings>({
    provider: "openai",
    openaiApiKey: "",
    geminiApiKey: "",
  });

  // Load initial settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error(
        "Failed to parse assistant settings from localStorage",
        error,
      );
    }
  }, []);

  // Sync settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save assistant settings to localStorage", error);
    }
  }, [settings]);

  // Provide convenient methods for updating state
  const setProvider = (provider: Provider) => {
    setSettings((prev) => ({ ...prev, provider }));
  };

  const setOpenaiApiKey = (key: string) => {
    setSettings((prev) => ({ ...prev, openaiApiKey: key }));
  };

  const setGeminiApiKey = (key: string) => {
    setSettings((prev) => ({ ...prev, geminiApiKey: key }));
  };

  return {
    ...settings,
    setProvider,
    setOpenaiApiKey,
    setGeminiApiKey,
  };
};
