import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StudentProfile } from '../src/pages/student/StudentProfile';
import * as AuthContext from '../src/features/authentication/AuthContext';

describe('Student Profile — ID, Course, Branch, Gmail & Parent Details Display', () => {
  it('renders student name, issued student ID, course, branch, phone, email, and parent details', () => {
    const mockStudent = {
      id: 10,
      user_code: 'STU-2026-0042',
      full_name: 'Aditya Verma',
      email: 'aditya.verma@example.com',
      phone_number: '+91 9876543210',
      role: 'STUDENT' as const,
      is_active: true,
      must_change_password: false,
      created_at: new Date().toISOString(),
      details: {
        roll_number: '210052010042',
        semester: 4,
        course_name: 'B.Tech Computer Science',
        course_code: 'CS-BT',
        branch_name: 'Artificial Intelligence & Machine Learning',
        branch_code: 'AIML',
        department_name: 'Computer Science & Engineering',
        parent_name: 'Rajesh Verma',
        parent_phone: '+91 9876500000',
        parent_email: 'rajesh.verma@parent.com',
        address: 'House No. 12, Chandrika Devi Marg, Lucknow, UP',
      },
    };

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockStudent,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <StudentProfile />
      </BrowserRouter>
    );

    // 1. Student Name & Issued ID
    expect(screen.getAllByText('Aditya Verma').length).toBeGreaterThan(0);
    expect(screen.getAllByText('STU-2026-0042').length).toBeGreaterThan(0);

    // 2. Course & Branch
    expect(screen.getByText('B.Tech Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence & Machine Learning')).toBeInTheDocument();

    // 3. Gmail & Phone Number
    expect(screen.getByText('aditya.verma@example.com')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();

    // 4. Parent Details (Name, Phone, Email, Address)
    expect(screen.getByText('Rajesh Verma')).toBeInTheDocument();
    expect(screen.getByText('+91 9876500000')).toBeInTheDocument();
    expect(screen.getByText('rajesh.verma@parent.com')).toBeInTheDocument();
    expect(screen.getByText('House No. 12, Chandrika Devi Marg, Lucknow, UP')).toBeInTheDocument();
  });
});
