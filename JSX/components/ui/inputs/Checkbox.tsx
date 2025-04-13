import type { InputProps } from "./type.ts";

// ChatGPT
export function Checkbox({ label, error, className = "", disabled, ...rest }: InputProps) {
  const baseStyle = "w-4 h-4";
  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div class={`flex flex-col gap-1 ${className}`}>
      <label class="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={disabled}
          class={`${baseStyle} ${disabledStyle}`}
          {...rest}
        />
        {label}
      </label>
      {error && <span class="text-sm text-red-600">{error}</span>}
    </div>
  );
}
