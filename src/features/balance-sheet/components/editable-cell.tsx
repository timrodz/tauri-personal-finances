import { Input } from "@/components/ui/input";
import {
  formatCurrencyRate,
  formatDecimal2Digits,
} from "@/lib/currency-formatting";
import { cn } from "@/lib/utils";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface EditableCellProps {
  value: number | undefined;
  // TODO: Will be used later, do not remove
  currency: string;
  onChange: (value: number) => Promise<void>;
  disabled?: boolean;
  isRate?: boolean;
}

export function EditableCell({
  value,
  onChange,
  disabled = false,
  isRate = false,
}: EditableCellProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused) return;
    if (!value) return;
    if (isRate) {
      setInputValue(formatCurrencyRate(value));
      return;
    }
    setInputValue(formatDecimal2Digits(value));
    setIsValid(true);
  }, [value, isFocused, isRate]);

  const handleFocus = () => {
    if (disabled || !value) return;
    setIsFocused(true);
    // When focused, show raw number for editing
    setInputValue(value.toString());
  };

  const handleBlur = async () => {
    setIsFocused(false);
    await handleCommit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value === "" || value === "-" || value === ".") {
      setIsValid(true);
      return;
    }

    // Strict number check
    const valid = !isNaN(Number(value));
    setIsValid(valid);
  };

  const handleCommit = async () => {
    const num = parseFloat(inputValue);

    if (isNaN(num) && inputValue !== "") {
      // If invalid (non-numeric string), revert to previous value (handled by effect)
      return;
    }

    // If input is empty
    if (inputValue === "") {
      if (value === undefined) {
        return;
      }
    }

    // Enforce positive numbers
    const finalValue = inputValue === "" ? 0 : Math.abs(num);

    if (finalValue === value) {
      return;
    }

    try {
      // Optimistic update should be handled by parent or query cache,
      // but here we just call onChange.
      await onChange(finalValue);
    } catch (e) {
      console.error("Failed to save cell", e);
      // Reversion handled by props sync if parent fails to update
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Commit value
      await handleCommit();
      // Move focus down (spreadsheet behavior)
      moveFocus("ArrowDown");
      return;
    }

    if (e.key === "Escape") {
      setIsFocused(false);
      setInputValue(
        isRate && value
          ? formatDecimal2Digits(value)
          : formatCurrencyRate(value),
      );
      setIsValid(true);
      inputRef.current?.blur();
      return;
    }

    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight"
    ) {
      // Prevent default scrolling and caret movement
      e.preventDefault();
      moveFocus(e.key);
    }
  };

  const moveFocus = (key: string) => {
    const input = inputRef.current;
    if (!input) return;

    const td = input.closest("td");
    if (!td) return;

    const tr = td.parentElement as HTMLTableRowElement;
    if (!tr) return;

    const direction = key.replace("Arrow", "").toLowerCase();

    // Horizontal
    if (direction === "left" || direction === "right") {
      const sibling =
        direction === "left"
          ? td.previousElementSibling
          : td.nextElementSibling;
      if (sibling) {
        const target = sibling.querySelector<HTMLInputElement>("input");
        if (target) {
          target.focus({ preventScroll: true });
          checkAndScroll(target);
          return;
        }
      }
    }

    // Vertical
    if (direction === "up" || direction === "down") {
      const colIndex = Array.from(tr.children).indexOf(td);
      let nextRow =
        direction === "up" ? tr.previousElementSibling : tr.nextElementSibling;

      // Loop to skip headers/empty rows (max 3 tries)
      for (let i = 0; i < 3 && nextRow; i++) {
        const targetTd = nextRow.children[colIndex];
        if (targetTd) {
          const target = targetTd.querySelector<HTMLInputElement>("input");
          if (target) {
            target.focus({ preventScroll: true });
            checkAndScroll(target);
            return;
          }
        }
        nextRow =
          direction === "up"
            ? nextRow.previousElementSibling
            : nextRow.nextElementSibling;
      }
    }
  };

  const checkAndScroll = (input: HTMLInputElement) => {
    const container = input.closest(".overflow-x-auto");
    if (!container) return;

    const rect = input.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check if out of bounds
    // We add a small buffer (e.g., 20px) to ensure comfort
    if (rect.left < containerRect.left) {
      container.scrollLeft -= containerRect.left - rect.left + 20;
    } else if (rect.right > containerRect.right) {
      container.scrollLeft += rect.right - containerRect.right + 20;
    }
  };

  return (
    <div className="relative w-full h-full p-1">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={disabled}
        className={cn(
          "h-8 text-right px-2 py-1 text-sm w-full rounded-sm border-transparent hover:border-border focus:border-primary transition-colors bg-transparent focus:bg-background shadow-none",
          disabled && "opacity-50 cursor-not-allowed focus:border-transparent",
          !isValid && "border-red-500 focus:border-red-500 text-red-500",
        )}
        placeholder="-"
      />
    </div>
  );
}
