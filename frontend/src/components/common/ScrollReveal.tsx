import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'none';
  as?: React.ElementType;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  as: Component = 'div',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Accessibility: Check for prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    // 2. Resilience: If IntersectionObserver is not available, immediately reveal
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // 3. Fallback timeout: Ensure content is never permanently hidden if observer fails
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            clearTimeout(fallbackTimer);
            if (domRef.current) {
              observer.unobserve(domRef.current);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentElem = domRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (currentElem) {
        observer.unobserve(currentElem);
      }
      observer.disconnect();
    };
  }, []);

  const transitionStyle: React.CSSProperties = {
    transitionDelay: isVisible && delay > 0 ? `${delay}ms` : '0ms',
  };

  return (
    <Component
      ref={domRef}
      style={transitionStyle}
      className={`scroll-reveal-init ${direction === 'none' ? 'translate-y-0' : ''} ${
        isVisible ? 'scroll-reveal-visible' : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
};
