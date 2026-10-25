import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../src/components/common/Navbar';
import { Footer } from '../src/components/common/Footer';
import { AuthProvider } from '../src/features/authentication/AuthContext';

describe('Public Branding & Institute Integrity (Bug 1 & Bug 2 Compliance)', () => {
  it('renders AttendX brand, discreet lock icon, and does NOT display institute name in navbar', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthProvider>
    );

    // Brand and CTA
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByTitle('Administrative Access')).toBeInTheDocument();

    // Bug 1: Public navbar must NOT display institute name
    expect(screen.queryByText(/GCRG Group of Institutions/i)).not.toBeInTheDocument();
  });

  it('renders AttendX branding in footer without institute name on public page', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    // Bug 1: Public footer must show AttendX and NOT display institute name
    expect(screen.getAllByText(/AttendX/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/GCRG Group of Institutions/i)).not.toBeInTheDocument();
  });
});
