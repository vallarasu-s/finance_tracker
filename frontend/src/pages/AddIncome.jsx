import React from 'react';
import TransactionEntryPage from '../components/TransactionEntryPage';

/**
 * Dedicated page for recording income transactions.
 */
export default function AddIncome(props) {
  return <TransactionEntryPage {...props} type="income" />;
}
