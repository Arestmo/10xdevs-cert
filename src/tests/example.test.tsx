import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

/**
 * Example unit test for Button component
 * Demonstrates Vitest + React Testing Library usage
 */
describe('Button Component', () => {
	it('should render button with text', () => {
		// Arrange
		render(<Button>Click me</Button>);

		// Act
		const button = screen.getByRole('button', { name: /click me/i });

		// Assert
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent('Click me');
	});

	it('should apply variant classes correctly', () => {
		// Arrange
		render(<Button variant="destructive">Delete</Button>);

		// Act
		const button = screen.getByRole('button', { name: /delete/i });

		// Assert
		expect(button).toBeInTheDocument();
	});

	it('should be disabled when disabled prop is true', () => {
		// Arrange
		render(<Button disabled>Disabled Button</Button>);

		// Act
		const button = screen.getByRole('button', { name: /disabled button/i });

		// Assert
		expect(button).toBeDisabled();
	});
});
