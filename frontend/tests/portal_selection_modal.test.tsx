import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PortalSelectionModal } from '../src/components/common/PortalSelectionModal';
import { Navbar } from '../src/components/common/Navbar';
import { Home } from '../src/pages/public/Home';
import { PublicLayout } from '../src/layouts/PublicLayout';
import { AuthProvider } from '../src/features/authentication/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PortalSelectionModal Component & Get Started Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders modal with required header and three compact portal options when isOpen is true', () => {
    render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    // 1. Heading and Subtitle
    expect(screen.getByText('Welcome to AttendX')).toBeInTheDocument();
    expect(screen.getByText('Choose your portal to continue')).toBeInTheDocument();

    // 2. Administrator option
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Institutional management')).toBeInTheDocument();

    // 3. Teacher / Faculty option
    expect(screen.getByText('Teacher / Faculty')).toBeInTheDocument();
    expect(screen.getByText('Manage classes and attendance')).toBeInTheDocument();

    // 4. Student option
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Access attendance and timetable')).toBeInTheDocument();

    // 5. Close button
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Welcome to AttendX')).not.toBeInTheDocument();
  });

  it('navigates to /admin/login when clicking Administrator', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const adminOption = screen.getByText('Administrator').closest('button');
    expect(adminOption).not.toBeNull();
    fireEvent.click(adminOption!);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('navigates to /teacher/login when clicking Teacher / Faculty', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const teacherOption = screen.getByText('Teacher / Faculty').closest('button');
    expect(teacherOption).not.toBeNull();
    fireEvent.click(teacherOption!);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/teacher/login');
  });

  it('navigates to /student/login when clicking Student', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const studentOption = screen.getByText('Student').closest('button');
    expect(studentOption).not.toBeNull();
    fireEvent.click(studentOption!);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/student/login');
  });

  it('triggers onClose when clicking Close button, top X, or clicking backdrop', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    // Click Close button
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Click top-right X button
    const xBtn = screen.getByLabelText('Close modal');
    fireEvent.click(xBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);

    // Click backdrop
    const backdrop = container.querySelector('[role="dialog"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(3);
  });

  it('closes on Escape key press and locks/unlocks body scroll', () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <MemoryRouter>
        <PortalSelectionModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    // Body scroll locked
    expect(document.body.style.overflow).toBe('hidden');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Unmount restores scroll
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('opens modal from Navbar Login button without navigating away', () => {
    const onOpenPortalModal = vi.fn();
    render(
      <AuthProvider>
        <MemoryRouter>
          <Navbar onOpenPortalModal={onOpenPortalModal} />
        </MemoryRouter>
      </AuthProvider>
    );

    const loginBtns = screen.getAllByRole('button', { name: /Login/i });
    expect(loginBtns.length).toBeGreaterThan(0);
    fireEvent.click(loginBtns[0]);

    expect(onOpenPortalModal).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalledWith('/get-started');
  });
});
