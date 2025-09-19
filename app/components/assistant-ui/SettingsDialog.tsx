"use client";

import { useAssistantSettings } from "@/app/hooks/useAssistantSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Button } from "@/components/ui/button";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const SettingsDialog = ({
  isOpen,
  onOpenChange,
}: SettingsDialogProps) => {
  const {
    provider,
    setProvider,
    openaiApiKey,
    setOpenaiApiKey,
    geminiApiKey,
    setGeminiApiKey,
    refreshFromStorage,
  } = useAssistantSettings();

  const handleSave = () => {
    // Force refresh from localStorage to ensure all components get the latest values
    refreshFromStorage();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={(value) =>
                setProvider(value as "openai" | "gemini")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="openai" />
                <Label htmlFor="openai">OpenAI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini" id="gemini" />
                <Label htmlFor="gemini">Google Gemini</Label>
              </div>
            </RadioGroup>
          </div>

          {provider === "openai" && (
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
              />
            </div>
          )}

          {provider === "gemini" && (
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Save & Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
