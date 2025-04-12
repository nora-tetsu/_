// ChatGPT
import { JSX } from "../../deps.ts";

type CheckboxProps = {
  label?: string;
  error?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export function Checkbox(props: CheckboxProps) {
  const { label, error, className = "", ...rest } = props;

  return (
    <div class={`flex flex-col gap-1 ${className}`}>
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" {...rest} />
        {label && <span>{label}</span>}
      </label>
      {error && <span class="text-sm text-red-600">{error}</span>}
    </div>
  );
}
