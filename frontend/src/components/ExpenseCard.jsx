import React from 'react';
import TransactionSummaryCard from './TransactionSummaryCard';

/**
 * Reusable expense entry card component.
 */
export default function ExpenseCard(props) {
  return <TransactionSummaryCard {...props} variant="expense" />;
}
