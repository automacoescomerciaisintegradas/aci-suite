import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]',
      secondary:
        'bg-[#1a0f1f] text-white border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-[#1a0f1f]/80 shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98]',
      outline:
        'bg-transparent text-indigo-400 border-2 border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-[0.98]',
      tertiary:
        'bg-transparent text-gray-300 hover:text-white hover:bg-white/5 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-sm px-4 py-2 gap-2',
      md: 'text-base px-6 py-3 gap-2.5',
      lg: 'text-lg px-8 py-4 gap-3',
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';
