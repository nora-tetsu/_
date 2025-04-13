import type { InputProps } from "./type.ts";

// ChatGPT
export function ColorInput({ label, error, className = "", disabled, ...rest }: InputProps) {
    const baseStyle = "w-10 h-10 p-0 border rounded";
    const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
        <div class={`flex flex-col gap-1 ${className}`}>
            {label && <label class="text-sm font-medium text-gray-700">{label}</label>}
            <input
                type="color"
                disabled={disabled}
                class={`${baseStyle} ${disabledStyle}`}
                {...rest}
            />
            {error && <span class="text-sm text-red-600">{error}</span>}
        </div>
    );
}
