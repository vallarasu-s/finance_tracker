package com.finance.service;

import com.finance.model.Transaction;

import java.util.List;

/**
 * DashboardService - Aggregates summary KPIs across transactions, goals, and investments.
 */
public class DashboardService {
    private final TransactionService transactionService;
    private final StorageService storageService;
    private final MongoDBService mongoService;

    public DashboardService(TransactionService transactionService, StorageService storageService, MongoDBService mongoService) {
        this.transactionService = transactionService;
        this.storageService = storageService;
        this.mongoService = mongoService;
    }

    public DashboardSummary getSummary() {
        List<Transaction> transactions = transactionService.getAllTransactions();
        double totalIncome = 0.0;
        double totalExpense = 0.0;

        for (Transaction tx : transactions) {
            if ("income".equalsIgnoreCase(tx.getType())) {
                totalIncome += tx.getAmount();
            } else {
                totalExpense += tx.getAmount();
            }
        }

        double netBalance = totalIncome - totalExpense;
        int txCount = transactions.size();
        int goalCount = StorageService.parseDocumentList(storageService.readGoals()).size();
        int investmentCount = StorageService.parseDocumentList(storageService.readInvestments()).size();

        return new DashboardSummary(
            totalIncome,
            totalExpense,
            netBalance,
            txCount,
            goalCount,
            investmentCount,
            mongoService.isConnected()
        );
    }

    public record DashboardSummary(
        double totalIncome,
        double totalExpense,
        double netBalance,
        int transactionCount,
        int goalCount,
        int investmentCount,
        boolean cloudConnected
    ) {
        public String toJson() {
            return """
                {
                    "success": true,
                    "totalIncome": %.2f,
                    "totalExpense": %.2f,
                    "netBalance": %.2f,
                    "transactionCount": %d,
                    "goalCount": %d,
                    "investmentCount": %d,
                    "cloudConnected": %b
                }
                """.formatted(totalIncome, totalExpense, netBalance, transactionCount, goalCount, investmentCount, cloudConnected);
        }
    }
}
