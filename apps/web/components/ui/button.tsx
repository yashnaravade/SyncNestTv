import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  asChild?: boolean;
};

export function Button({ className = '', asChild, ...props }: ButtonProps) {
  return (
    <button
      className={
        'inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 ' +
        className
      }
      {...props}
    />
  );
}
