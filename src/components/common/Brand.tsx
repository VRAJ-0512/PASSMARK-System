import React from 'react';
import { motion } from 'motion/react';

export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <motion.svg 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    initial="hidden"
    animate="visible"
  >
    <motion.rect 
      x="4" y="4" width="6" height="24" rx="3" fill="currentColor" 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 24, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    <motion.path 
      d="M10 7H20C23.866 7 27 10.134 27 14C27 17.866 23.866 21 20 21H10" 
      stroke="currentColor" 
      strokeWidth="6" 
      strokeLinecap="round" 
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    />
    <motion.circle 
      cx="24" cy="25" r="3" 
      className="fill-[var(--color-status-success)]" 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.5, delay: 0.6 }}
    />
  </motion.svg>
);

export const LogoText = ({ className = "text-3xl" }: { className?: string }) => {
  const pass = ["P", "Λ", "S", "S"];
  const mark = ["M", "Λ", "R", "K"];
  
  return (
    <div className={`flex items-center font-display font-bold tracking-tighter ${className}`}>
      <div className="flex">
        {pass.map((char, i) => (
          <motion.span
            key={`pass-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: "easeOut" }}
            className="text-[var(--color-text-primary)]"
          >
            {char}
          </motion.span>
        ))}
      </div>
      <div className="flex">
        {mark.map((char, i) => (
          <motion.span
            key={`mark-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.05, duration: 0.4, ease: "easeOut" }}
            className="text-[var(--color-status-success)]"
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  );
};
