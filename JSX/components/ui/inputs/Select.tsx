import type { SelectProps } from "./type.ts";

// ChatGPT
export function Select({ label, error, options, className = "", disabled, ...rest }: SelectProps) {
    const baseStyle = "border px-2 py-1 rounded";
    const disabledStyle = disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";

    return (
        <div class={`flex flex-col gap-1 ${className}`}>
            {label && <label class="text-sm font-medium text-gray-700">{label}</label>}
            <select
                disabled={disabled}
                class={`${baseStyle} ${disabledStyle}`}
                {...rest}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span class="text-sm text-red-600">{error}</span>}
        </div>
    );
}
