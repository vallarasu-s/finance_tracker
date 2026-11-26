package com.finance.repository;

import com.finance.model.Transaction;
import com.finance.service.MongoDBService;
import com.finance.service.StorageService;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * TransactionRepository - Unified data-access layer for Transactions
 * across MongoDB Atlas (primary) and local JSON fallback.
 */
public class TransactionRepository {
    private final MongoDBService mongoService;
    private final StorageService storageService;

    public TransactionRepository(MongoDBService mongoService, StorageService storageService) {
        this.mongoService = mongoService;
        this.storageService = storageService;
    }

    public String findAllJson() {
        if (mongoService.isConnected()) {
            String mongoData = mongoService.getTransactionsJson();
            if (mongoData != null && !"[]".equals(mongoData)) {
                return mongoData;
            }
        }
        return storageService.readTransactions();
    }

    public List<Transaction> findAll() {
        List<Document> docs = StorageService.parseDocumentList(findAllJson());
        List<Transaction> result = new ArrayList<>(docs.size());
        for (Document doc : docs) {
            result.add(Transaction.fromDocument(doc));
        }
        return result;
    }

    public boolean saveJson(String body) {
        List<Document> docs = parsePayloadDocuments(body);
        boolean cloudSaved = false;
        if (mongoService.isConnected() && !docs.isEmpty()) {
            cloudSaved = mongoService.saveTransactions(docs);
        }
        storageService.writeTransactions(body);
        return cloudSaved;
    }

    public boolean deleteById(String id) {
        boolean cloudDeleted = false;
        if (mongoService.isConnected()) {
            cloudDeleted = mongoService.deleteTransaction(id);
        }
        storageService.deleteTransaction(id);
        return cloudDeleted;
    }

    public static List<Document> parsePayloadDocuments(String body) {
        List<Document> docs = new ArrayList<>();
        if (body == null) return docs;
        String trimmed = body.trim();
        if (trimmed.startsWith("[")) {
            docs = StorageService.parseDocumentList(trimmed);
        } else if (trimmed.startsWith("{")) {
            try {
                docs.add(Document.parse(trimmed));
            } catch (Exception ignored) {}
        }
        return docs;
    }
}
