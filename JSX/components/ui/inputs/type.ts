import { JSX } from "../../deps.ts";

export interface InputProps extends JSX.HTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
};

export interface TextareaProps extends JSX.HTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
};

export interface SelectProps extends JSX.HTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
};
