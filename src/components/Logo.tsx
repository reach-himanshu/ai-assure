import clsx from 'clsx';
import { useApp } from '@/stores';
import { LogoMark } from './LogoMark';

export function Logo({ className }: { className?: string }) {
  const variant = useApp((s) => s.logoVariant);
  return (
    <span className={clsx('inline-flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <LogoMark variant={variant} size={32} />
      <span className="text-lg leading-none">
        <span className="text-ink dark:text-[#F1F5EE]">AI-</span>
        <span className="text-brand-600 dark:text-brand-400">Assure</span>
      </span>
    </span>
  );
}
