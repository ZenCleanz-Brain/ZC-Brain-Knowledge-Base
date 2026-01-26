'use client';

import { useRef, ReactNode, MouseEvent } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'a';
  href?: string;
  onClick?: () => void;
}

export default function GlowCard({
  children,
  className = '',
  as = 'div',
  href,
  onClick
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement | HTMLAnchorElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    // Reset to center when mouse leaves
    cardRef.current.style.setProperty('--mouse-x', '50%');
    cardRef.current.style.setProperty('--mouse-y', '50%');
  };

  const commonProps = {
    className: `glow-card ${className}`,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: {
      '--mouse-x': '50%',
      '--mouse-y': '50%',
    } as React.CSSProperties,
  };

  if (as === 'a' && href) {
    return (
      <a
        ref={cardRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        {...commonProps}
      >
        {children}
      </a>
    );
  }

  return (
    <div
      ref={cardRef as React.RefObject<HTMLDivElement>}
      onClick={onClick}
      {...commonProps}
    >
      {children}
    </div>
  );
}
