import clsx from 'clsx';

interface Props {
  initials: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

export function Avatar({ initials, color, size = 'md', className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold text-white',
        SIZE[size],
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
