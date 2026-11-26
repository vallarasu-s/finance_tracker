import React from 'react';
import TransactionEntryPage from '../components/TransactionEntryPage';

/**
 * Dedicated page for recording expense transactions.
 */
export default function AddExpense(props) {
  return <TransactionEntryPage {...props} type="expense" />;
}
