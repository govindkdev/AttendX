import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../src/components/common/Navbar';
import { AuthProvider } from '../src/features/authentication/AuthContext';

describe('Navbar Active Link Highlighting (Fix 4 Compliance)', () => {
  const routes = [
    { path: '/', activeText: 'Home', inactiveText: 'About' },
    { path: '/about', activeText: 'About', inactiveText: 'Home' },
    { path: '/features', activeText: 'Features', inactiveText: 'Home' },
    { path: '/how-it-works', activeText: 'How It Works', inactiveText: 'Home' },
    { path: '/security', activeText: 'Security', inactiveText: 'Home' },
    { path: '/contact', activeText: 'Contact', inactiveText: 'Home' },
  ];

  routes.forEach(({ path, activeText, inactiveText }) => {
    it(`highlights '${activeText}' in blue when current route is '${path}' and '${inactiveText}' is inactive`, () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={[path]}>
            <Navbar />
          </MemoryRouter>
        </AuthProvider>
      );

      // Desktop link is the first one found for that text
      const activeLinks = screen.getAllByRole('link', { name: activeText });
      const inactiveLinks = screen.getAllByRole('link', { name: inactiveText });

      // Active link must include blue text classes
      expect(activeLinks[0].className).toContain('text-blue-600');
      expect(activeLinks[0].className).toContain('font-semibold');

      // Inactive link must not include font-semibold active indicator
      expect(inactiveLinks[0].className).toContain('text-slate-600');
      expect(inactiveLinks[0].className).not.toContain('text-blue-600 font-semibold');
    });
  });

  it('preserves the lock icon and Get Started CTA button', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Navbar />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByTitle('Administrative Access')).toBeInTheDocument();
  });
});
