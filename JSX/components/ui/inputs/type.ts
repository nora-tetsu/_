import { JSX } from "../../deps.ts";

export type InputProps = {
    label?: string;
    error?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export type TextareaProps = {
    label?: string;
    error?: string;
} & JSX.HTMLAttributes<HTMLTextAreaElement>;

export type SelectProps = {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
} & JSX.HTMLAttributes<HTMLSelectElement>;
