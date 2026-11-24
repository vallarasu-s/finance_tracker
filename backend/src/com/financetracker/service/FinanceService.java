package com.financetracker.service;

import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * FinanceService - Business Logic & Data Coordination Layer
 * Coordinates read and write operations between MongoDB Atlas and local storage fallback.
 */
public class FinanceService {
    private static FinanceService instance;

    private final MongoDBService mongoService;
    private final StorageService storageService;

    private FinanceService() {
        this.mongoService = MongoDBService.getInstance();
        this.storageService = StorageService.getInstance();
    }

    public static synchronized FinanceService getInstance() {
        if (instance == null) {
            instance = new FinanceService();
        }
        return instance;
    }

    public MongoDBService getMongoService() {
        return mongoService;
    }

    public StorageService getStorageService() {
        return storageService;
    }

    // =========================================================================
    // TRANSACTIONS BUSINESS LOGIC
    // =========================================================================

    public String getTransactions() {
        if (mongoService.isConnected()) {
            String mongoData = mongoService.getTransactionsJson();
            if (mongoData != null && !mongoData.equals("[]")) {
                return mongoData;
            }
        }
        return storageService.readTransactions();
    }

    public record SaveResult(boolean success, boolean cloudSynced, String message) {}

    public SaveResult saveTransactions(String body) {
        if (body == null || body.isBlank()) {
            return new SaveResult(false, false, "Empty payload");
        }

        boolean cloudSaved = false;
        List<Document> docs = new ArrayList<>();
        String trimmed = body.trim();
        if (trimmed.startsWith("[")) {
            docs = StorageService.parseDocumentList(trimmed);
        } else if (trimmed.startsWith("{")) {
            try {
                docs.add(Document.parse(trimmed));
            } catch (Exception ignored) {}
        }

        if (mongoService.isConnected() && !docs.isEmpty()) {
            cloudSaved = mongoService.saveTransactions(docs);
        }

        storageService.writeTransactions(body);
        String msg = cloudSaved 
            ? "Transactions and amounts saved to MongoDB Atlas & local storage" 
            : "Transactions saved to local storage (MongoDB offline)";

        return new SaveResult(true, cloudSaved, msg);
    }

    public boolean deleteTransaction(String id) {
        if (id == null || id.isBlank()) return false;
        boolean cloudDeleted = false;
        if (mongoService.isConnected()) {
            cloudDeleted = mongoService.deleteTransaction(id);
        }
        storageService.deleteTransaction(id);
        return cloudDeleted;
    }

    // =========================================================================
    // GOALS BUSINESS LOGIC
    // =========================================================================

    public String getGoals() {
        if (mongoService.isConnected()) {
            String mongoData = mongoService.getGoalsJson();
            if (mongoData != null && !mongoData.equals("[]")) {
                return mongoData;
            }
        }
        return storageService.readGoals();
    }

    public SaveResult saveGoals(String body) {
        if (body == null || body.isBlank()) {
            return new SaveResult(false, false, "Empty payload");
        }

        boolean cloudSaved = false;
        List<Document> docs = new ArrayList<>();
        String trimmed = body.trim();
        if (trimmed.startsWith("[")) {
            docs = StorageService.parseDocumentList(trimmed);
        } else if (trimmed.startsWith("{")) {
            try {
                docs.add(Document.parse(trimmed));
            } catch (Exception ignored) {}
        }

        if (mongoService.isConnected() && !docs.isEmpty()) {
            cloudSaved = mongoService.saveGoals(docs);
        }

        storageService.writeGoals(body);
        return new SaveResult(true, cloudSaved, "Goals saved successfully");
    }

    public boolean deleteGoal(String id) {
        if (id == null || id.isBlank()) return false;
        boolean cloudDeleted = false;
        if (mongoService.isConnected()) {
            cloudDeleted = mongoService.deleteGoal(id);
        }
        storageService.deleteGoal(id);
        return cloudDeleted;
    }

    // =========================================================================
    // INVESTMENTS BUSINESS LOGIC
    // =========================================================================

    public String getInvestments() {
        if (mongoService.isConnected()) {
            String cloudData = mongoService.getInvestmentsJson();
            if (cloudData != null && !cloudData.equals("[]")) {
                storageService.writeInvestments(cloudData);
                return cloudData;
            }
        }
        return storageService.readInvestments();
    }

    public SaveResult saveInvestments(String body) {
        if (body == null || body.isBlank()) {
            return new SaveResult(false, false, "Request body cannot be empty");
        }

        boolean cloudSaved = false;
        List<Document> docs = new ArrayList<>();
        String trimmed = body.trim();
        if (trimmed.startsWith("[")) {
            docs = StorageService.parseDocumentList(trimmed);
        } else if (trimmed.startsWith("{")) {
            try {
                docs.add(Document.parse(trimmed));
            } catch (Exception ignored) {}
        }

        if (mongoService.isConnected() && !docs.isEmpty()) {
            cloudSaved = mongoService.saveInvestments(docs);
        }

        storageService.writeInvestments(body);
        return new SaveResult(true, cloudSaved, "Investments saved successfully");
    }

    public boolean deleteInvestment(String id) {
        if (id == null || id.isBlank()) return false;
        boolean cloudDeleted = false;
        if (mongoService.isConnected()) {
            cloudDeleted = mongoService.deleteInvestment(id);
        }
        storageService.deleteInvestment(id);
        return cloudDeleted;
    }

    // =========================================================================
    // USER BUSINESS LOGIC
    // =========================================================================

    public String getUser(String userId) {
        if (mongoService.isConnected()) {
            String userJson = mongoService.getUser(userId);
            if (userJson != null) {
                return userJson;
            }
        }
        return storageService.readUser(userId);
    }

    public SaveResult saveUser(String body) {
        if (body == null || body.isBlank()) {
            return new SaveResult(false, false, "Empty payload");
        }

        boolean cloudSaved = false;
        if (mongoService.isConnected()) {
            cloudSaved = mongoService.saveUser(body);
        }

        storageService.writeUser(body);
        return new SaveResult(true, cloudSaved, "User information saved successfully");
    }

    // =========================================================================
    // SETTINGS BUSINESS LOGIC
    // =========================================================================

    public String getSettings() {
        if (mongoService.isConnected()) {
            String settingsJson = mongoService.getSettingsJson();
            if (settingsJson != null && !settingsJson.isBlank()) {
                return settingsJson;
            }
        }
        return storageService.readSettings();
    }

    public SaveResult saveSettings(String body) {
        if (body == null || body.isBlank()) {
            return new SaveResult(false, false, "Empty payload");
        }

        boolean cloudSaved = false;
        if (mongoService.isConnected()) {
            cloudSaved = mongoService.saveSettings(body);
        }

        storageService.writeSettings(body);
        return new SaveResult(true, cloudSaved, "Settings saved successfully");
    }

    // =========================================================================
    // FULL SYNC BUSINESS LOGIC
    // =========================================================================

    public record SyncResult(
        boolean success,
        boolean cloudSynced,
        long serverTimestamp,
        String message,
        String transactions,
        String goals,
        String investments,
        String user,
        String settings
    ) {}

    public SyncResult getAllData() {
        String currentTx = getTransactions();
        String currentGoals = getGoals();
        String currentInv = getInvestments();
        String currentUser = getUser("default_user");
        String currentSettings = getSettings();

        return new SyncResult(
            true,
            mongoService.isConnected(),
            System.currentTimeMillis(),
            mongoService.isConnected() ? "Retrieved data from MongoDB Atlas" : "Retrieved data from Java local storage",
            currentTx,
            currentGoals,
            currentInv,
            currentUser,
            currentSettings
        );
    }

    public SyncResult syncAllData(String body) {
        long serverTime = System.currentTimeMillis();

        String clientTx = StorageService.extractJsonArray(body, "transactions");
        String clientGoals = StorageService.extractJsonArray(body, "goals");
        String clientInv = StorageService.extractJsonArray(body, "investments");
        String clientUser = StorageService.extractJsonObject(body, "user");
        String clientSettings = StorageService.extractJsonObject(body, "settings");

        boolean cloudSynced = false;
        if (mongoService.isConnected()) {
            try {
                if (clientTx != null && !clientTx.isBlank()) {
                    List<Document> txDocs = StorageService.parseDocumentList(clientTx);
                    if (!txDocs.isEmpty()) mongoService.saveTransactions(txDocs);
                }
                if (clientGoals != null && !clientGoals.isBlank()) {
                    List<Document> goalDocs = StorageService.parseDocumentList(clientGoals);
                    if (!goalDocs.isEmpty()) mongoService.saveGoals(goalDocs);
                }
                if (clientInv != null && !clientInv.isBlank()) {
                    List<Document> invDocs = StorageService.parseDocumentList(clientInv);
                    if (!invDocs.isEmpty()) mongoService.saveInvestments(invDocs);
                }
                if (clientUser != null && !clientUser.isBlank()) {
                    mongoService.saveUser(clientUser);
                }
                if (clientSettings != null && !clientSettings.isBlank()) {
                    mongoService.saveSettings(clientSettings);
                }
                cloudSynced = true;
            } catch (Exception e) {
                System.err.println("[FinanceService] Cloud sync error: " + e.getMessage());
            }
        }

        if (clientTx != null && !clientTx.isBlank()) storageService.writeTransactions(clientTx);
        if (clientGoals != null && !clientGoals.isBlank()) storageService.writeGoals(clientGoals);
        if (clientInv != null && !clientInv.isBlank()) storageService.writeInvestments(clientInv);
        if (clientUser != null && !clientUser.isBlank()) storageService.writeUser(clientUser);
        if (clientSettings != null && !clientSettings.isBlank()) storageService.writeSettings(clientSettings);

        String currentTx = getTransactions();
        String currentGoals = getGoals();
        String currentInv = getInvestments();
        String currentUser = getUser("default_user");
        String currentSettings = getSettings();

        return new SyncResult(
            true,
            cloudSynced,
            serverTime,
            cloudSynced ? "Synced successfully with MongoDB Atlas!" : "Synced locally with Java backend",
            currentTx,
            currentGoals,
            currentInv,
            currentUser,
            currentSettings
        );
    }
}
