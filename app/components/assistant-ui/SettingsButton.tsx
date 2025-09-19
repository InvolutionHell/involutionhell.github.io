import { SettingsIcon } from "lucide-react";
import { TooltipIconButton } from "./tooltip-icon-button";

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = ({ onClick }: SettingsButtonProps) => {
  return (
    <TooltipIconButton tooltip="Settings" side="top" onClick={onClick}>
      <SettingsIcon className="size-5" />
    </TooltipIconButton>
  );
};
