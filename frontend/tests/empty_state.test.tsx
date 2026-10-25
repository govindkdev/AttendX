import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../src/components/common/EmptyState';
import { CalendarCheck } from 'lucide-react';

describe('EmptyState Component', () => {
  it('renders title and description properly for zero-data states', () => {
    render(
      <EmptyState
        title="No attendance records found"
        description="Records will appear here when teachers conduct sessions."
        icon={CalendarCheck}
      />
    );

    expect(screen.getByText('No attendance records found')).toBeInTheDocument();
    expect(
      screen.getByText('Records will appear here when teachers conduct sessions.')
    ).toBeInTheDocument();
  });

  it('renders optional action button when provided', () => {
    let clicked = false;
    render(
      <EmptyState
        title="No students found"
        description="Register students first."
        actionText="Add Student"
        onAction={() => {
          clicked = true;
        }}
      />
    );

    const btn = screen.getByText('Add Student');
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(clicked).toBe(true);
  });
});
