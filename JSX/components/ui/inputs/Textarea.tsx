import type { TextareaProps } from "./type.ts";

// ChatGPT
export function Textarea({ label, error, className = "", disabled, ...rest }: TextareaProps) {
    const baseStyle = "border px-2 py-1 rounded resize-vertical";
    const disabledStyle = disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";

    return (
        <div class={`flex flex-col gap-1 ${className}`}>
            {label && <label class="text-sm font-medium text-gray-700">{label}</label>}
            <textarea
                disabled={disabled}
                class={`${baseStyle} ${disabledStyle}`}
                {...rest}
            />
            {error && <span class="text-sm text-red-600">{error}</span>}
        </div>
    );
}
