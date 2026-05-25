import React from 'react';

export interface PremiumCardProps {
  className?: string;
  children: React.ReactNode;
}

export const PremiumCard: React.FC<PremiumCardProps> & {
  Header: React.FC<{ children?: React.ReactNode; title?: string; className?: string }>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
} = ({ className = '', children }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#1a0f1f]/80 backdrop-blur-xl border border-white/5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/10 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">{children}</div>
    </div>
  );
};

PremiumCard.Header = ({ children, title, className = '' }) => (
  <div className={`p-6 pb-4 border-b border-white/5 ${className}`}>
    {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
    {children}
  </div>
);

PremiumCard.Body = ({ children, className = '' }) => (
  <div className={`p-6 flex-1 ${className}`}>
    {children}
  </div>
);

PremiumCard.Footer = ({ children, className = '' }) => (
  <div className={`p-6 pt-4 border-t border-white/5 mt-auto flex items-center gap-3 ${className}`}>
    {children}
  </div>
);
