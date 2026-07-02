import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the header correctly', () => {
    render(<App />);
    const headerElement = screen.getByText(/CloudCorp/i);
    expect(headerElement).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    const { container } = render(<App />);
    // Our App component renders a loader while fetching data
    const loader = container.querySelector('.loader-container');
    expect(loader).toBeInTheDocument();
  });
});
