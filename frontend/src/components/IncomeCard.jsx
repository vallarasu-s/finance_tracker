import React from 'react';
import TransactionSummaryCard from './TransactionSummaryCard';

/**
 * Reusable income entry card component.
 */
export default function IncomeCard(props) {
  return <TransactionSummaryCard {...props} variant="income" />;
}
