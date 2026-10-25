import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '../src/pages/public/Home';
import { ScrollReveal } from '../src/components/common/ScrollReveal';

describe('Fix 2 — Premium Landing-Page Hero Animation', () => {
  it('renders the hero headline split into distinct readable word groups with entrance classes', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const word1 = container.querySelector('.hero-word-1');
    const word2 = container.querySelector('.hero-word-2');
    const word3 = container.querySelector('.hero-word-3');

    expect(word1).toBeInTheDocument();
    expect(word1?.textContent).toContain('Smart Attendance.');

    expect(word2).toBeInTheDocument();
    expect(word2?.textContent).toContain('Verified Identity.');

    expect(word3).toBeInTheDocument();
    expect(word3?.textContent).toContain('Trusted Insights.');
  });

  it('renders staggered entrance animation classes on badge, description, CTA, and trust indicators', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(container.querySelector('.hero-animate-badge')).toBeInTheDocument();
    expect(container.querySelector('.hero-animate-desc')).toBeInTheDocument();
    expect(container.querySelector('.hero-animate-cta')).toBeInTheDocument();
    expect(container.querySelector('.hero-animate-indicators')).toBeInTheDocument();
  });
});

describe('Fix 3 — Scroll-Triggered Text and Section Animations', () => {
  it('renders children within ScrollReveal wrapper with init animation classes', () => {
    const { container } = render(
      <ScrollReveal>
        <div data-testid="reveal-child">Section Content</div>
      </ScrollReveal>
    );

    const child = screen.getByTestId('reveal-child');
    expect(child).toBeInTheDocument();

    const wrapper = container.querySelector('.scroll-reveal-init');
    expect(wrapper).toBeInTheDocument();
  });

  it('immediately reveals content if prefers-reduced-motion is requested', () => {
    // Mock matchMedia to simulate prefers-reduced-motion: reduce
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(
      <ScrollReveal>
        <div data-testid="accessible-child">Accessible Content</div>
      </ScrollReveal>
    );

    expect(screen.getByTestId('accessible-child')).toBeInTheDocument();
    const wrapper = container.querySelector('.scroll-reveal-visible');
    expect(wrapper).toBeInTheDocument();
  });

  it('supports custom delay style and custom HTML tag', () => {
    const { container } = render(
      <ScrollReveal as="section" delay={200} className="custom-test-class">
        <span>Delayed section</span>
      </ScrollReveal>
    );

    const section = container.querySelector('section.custom-test-class');
    expect(section).toBeInTheDocument();
  });
});
