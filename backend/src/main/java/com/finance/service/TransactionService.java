package com.finance.service;

import com.finance.model.Transaction;
import com.finance.repository.TransactionRepository;

import java.util.List;

/**
 * TransactionService - Business logic for recording, querying, and deleting income/expense transactions.
 */
public class TransactionService {
    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public String getTransactionsJson() {
        return transactionRepository.findAllJson();
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public FinanceService.SaveResult saveTransactions(String body) {
        if (body == null || body.isBlank()) {
            return new FinanceService.SaveResult(false, false, "Empty payload");
        }
        boolean cloudSaved = transactionRepository.saveJson(body);
        String msg = cloudSaved
            ? "Transactions and amounts saved to MongoDB Atlas & local storage"
            : "Transactions saved to local storage (MongoDB offline)";
        return new FinanceService.SaveResult(true, cloudSaved, msg);
    }

    public boolean deleteTransaction(String id) {
        if (id == null || id.isBlank()) return false;
        return transactionRepository.deleteById(id);
    }
}
