import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryPage from './HistoryPage';

describe('<HistoryPage />', () => {
  test('it should mount', () => {
    render(<HistoryPage />);

    const historyPage = screen.getByTestId('HistoryPage');

    expect(historyPage).toBeInTheDocument();
  });
});