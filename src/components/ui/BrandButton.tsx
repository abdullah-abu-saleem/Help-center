import React from 'react';

type ButtonVariant = 'primary' | 'dark' | 'ghost';

interface BrandButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#ed3b91] hover:bg-[#d6257a] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-200',
  dark:
    'bg-[#091e42] hover:bg-[#08b8fb] text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200',
  ghost:
    'bg-white border border-slate-200 hover:border-[#ed3b91] hover:text-[#ed3b91] text-[#6882a9] font-semibold py-3 rounded-xl transition-all duration-200',
};

export const BrandButton: React.FC<BrandButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`${variantClasses[variant]} px-6 inline-flex items-center justify-center gap-2 text-sm ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${className}`}
  >
    {children}
  </button>
);
