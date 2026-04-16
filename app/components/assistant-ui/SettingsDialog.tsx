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
import { Checkbox } from "@/app/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

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
    saveToLocalStorage,
    setSaveToLocalStorage,
  } = useAssistantSettings();

  const handleSave = () => {
    // 设置已在内存状态中实时更新，这里只关闭弹窗，避免回读 localStorage 覆盖新值。
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--background)]">
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={(value) =>
                setProvider(value as "openai" | "gemini" | "intern")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intern" id="intern" />
                <Label htmlFor="intern">GLM-4.6V-Flash (Free)</Label>
              </div>
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
            <div className="space-y-4">
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

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-to-storage"
                    checked={saveToLocalStorage}
                    onCheckedChange={(checked) =>
                      setSaveToLocalStorage(checked === true)
                    }
                  />
                  <Label
                    htmlFor="save-to-storage"
                    className="text-sm font-normal cursor-pointer"
                  >
                    保存 API Key 到本地存储
                  </Label>
                </div>

                {saveToLocalStorage && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                        <p className="font-medium">安全提示</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>
                            API Key 将以明文形式存储在浏览器的 localStorage 中
                          </li>
                          <li>任何能访问此浏览器的人都可能获取您的 API Key</li>
                          <li>请勿在公用电脑或共享设备上勾选此选项</li>
                          <li>建议定期更换 API Key 以提高安全性</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {provider === "gemini" && (
            <div className="space-y-4">
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

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-to-storage"
                    checked={saveToLocalStorage}
                    onCheckedChange={(checked) =>
                      setSaveToLocalStorage(checked === true)
                    }
                  />
                  <Label
                    htmlFor="save-to-storage"
                    className="text-sm font-normal cursor-pointer"
                  >
                    保存 API Key 到本地存储
                  </Label>
                </div>

                {saveToLocalStorage && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                        <p className="font-medium">安全提示</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>
                            API Key 将以明文形式存储在浏览器的 localStorage 中
                          </li>
                          <li>任何能访问此浏览器的人都可能获取您的 API Key</li>
                          <li>请勿在公用电脑或共享设备上勾选此选项</li>
                          <li>建议定期更换 API Key 以提高安全性</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {provider === "intern" && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                当前免费模型为智谱 GLM-4.6V-Flash（128K
                上下文，支持多模态），由站点统一承担费用，无需提供 API Key。
              </p>
              <p className="text-xs">
                🙏 特别鸣谢上海 AI Lab 书生 Intern-S1
                为本项目提供首发算力支持——第一个金主，永远铭记。
              </p>
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
