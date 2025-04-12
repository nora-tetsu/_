import {JSX, type Signal} from "../deps.ts";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
    return (
      <button
        {...props}
      />
    );
  }
  
  export function Button2(props: JSX.HTMLAttributes<HTMLButtonElement>) {
    return (
      <button
        {...props}
        class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors"
      />
    );
  }
  
  export function FaButton(
    { fontawesome, onClick, title }: {
      fontawesome: string;
      onClick: (e: MouseEvent) => void;
      title: string;
    },
  ) {
    return (
      <i
        class={fontawesome + " button"}
        onClick={onClick}
        title={title}
      />
    );
  }
  
  function toggleSignalBool(signal: Signal<boolean>) {
    const current = signal.value;
    signal.value = !current;
  }
  
  export function FaToggleButton(
    { fontawesome, signal, title }: {
      fontawesome: string;
      signal: Signal<boolean>;
      title: string;
    },
  ) {
    return (
      <i
        class={fontawesome + " button"}
        data-on={String(signal.value)}
        onClick={() => toggleSignalBool(signal)}
        title={title}
      />
    );
  }
  