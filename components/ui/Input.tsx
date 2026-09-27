import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className, id, ...rest }, ref
) {
  const inputId = id ?? rest.name;
  return (
    <div>
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <input ref={ref} id={inputId} className={clsx("input", error && "border-danger focus:ring-danger/20", className)} {...rest} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});