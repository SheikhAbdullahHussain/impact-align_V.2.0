import { useId } from 'react';
import { cn } from '@impactalign/ui';

export interface TextFieldProps {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly type?: 'text' | 'email' | 'password';
  readonly error?: string | undefined;
  readonly hint?: string;
  readonly autoComplete?: string;
  readonly disabled?: boolean;
}

/** Labelled input with its hint and error wired up through aria-describedby. */
export function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  autoComplete,
  disabled,
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'mt-1 block h-11 w-full rounded-md border bg-white px-3 text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-60',
          error ? 'border-red-700' : 'border-navy-300',
        )}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-navy-700">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
