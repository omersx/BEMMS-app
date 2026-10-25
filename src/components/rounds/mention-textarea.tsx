'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface DeviceMention {
  deviceId: string;
  deviceName: string;
  internalCode: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentions: DeviceMention[]) => void;
  devices: { id: string; name: string; internalCode: string; assetNumber: string; currentStatusCode: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  devices,
  placeholder = 'Add a note... Use @device to mention specific devices',
  className,
  disabled,
}: MentionTextareaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mentions, setMentions] = useState<DeviceMention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Detect @ trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setSearchTerm(atMatch[1]);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
      setSearchTerm('');
    }

    onChange(newValue, mentions);
  }, [mentions, onChange]);

  const insertMention = useCallback((device: typeof devices[0]) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);

    // Find the @ position
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
    if (!atMatch) return;

    const atStart = textBeforeCursor.lastIndexOf('@');
    const mentionText = `@${device.name}`;
    const newValue = value.slice(0, atStart) + mentionText + ' ' + textAfterCursor;

    const newMention: DeviceMention = {
      deviceId: device.id,
      deviceName: device.name,
      internalCode: device.internalCode,
    };

    const updatedMentions = [...mentions, newMention];
    setMentions(updatedMentions);
    setShowDropdown(false);
    setSearchTerm('');
    onChange(newValue, updatedMentions);

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = atStart + mentionText.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, mentions, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || filteredDevices.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredDevices.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredDevices[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }, [showDropdown, filteredDevices, selectedIndex, insertMention]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showDropdown]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('min-h-[80px] resize-none', className)}
        disabled={disabled}
      />

      {showDropdown && filteredDevices.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Devices in this department
          </div>
          {filteredDevices.map((device, idx) => (
            <button
              key={device.id}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                idx === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
              onClick={(e) => {
                e.stopPropagation();
                insertMention(device);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{device.name}</span>
                <span className="text-xs text-muted-foreground">{device.internalCode}</span>
              </div>
              <span className={cn(
                'ml-auto text-[10px] px-1.5 py-0.5 rounded-full',
                device.currentStatusCode === 'operational'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              )}>
                {device.currentStatusCode?.replace(/_/g, ' ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {mentions.map((m, i) => (
            <span
              key={`${m.deviceId}-${i}`}
              className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded"
            >
              @{m.deviceName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
