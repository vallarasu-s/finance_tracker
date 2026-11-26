package com.finance.service;

import com.finance.repository.TransactionRepository;
import com.finance.repository.UserRepository;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * FinanceService - Unified Business Logic & Data Coordination Layer.
 * Coordinates transactions, goals, investments, user profiles, settings, and bidirectional sync.
 */
public class FinanceService {
    private static FinanceService instance;

    private final MongoDBService mongoService;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AuthService authService;
    private final TransactionService transactionService;
    private final DashboardService dashboardService;

    private FinanceService() {
        this.mongoService = MongoDBService.getInstance();
        this.storageService = StorageService.getInstance();
        this.userRepository = new UserRepository(mongoService, storageService);
        this.transactionRepository = new TransactionRepository(mongoService, storageService);
        this.authService = new AuthService(userRepository);
        this.transactionService = new TransactionService(transactionRepository);
        this.dashboardService = new DashboardService(transactionService, storageService, mongoService);
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

    public AuthService getAuthService() {
        return authService;
    }

    public TransactionService getTransactionService() {
        return transactionService;
    }

    public DashboardService getDashboardService() {
        return dashboardService;
    }

    public record SaveResult(boolean success, boolean cloudSynced, String message) {}

    // =========================================================================
    // TRANSACTIONS DELEGATION
    // =========================================================================

    public String getTransactions() {
        return transactionService.getTransactionsJson();
    }

    public SaveResult saveTransactions(String body) {
        return transactionService.saveTransactions(body);
    }

    public boolean deleteTransaction(String id) {
        return transactionService.deleteTransaction(id);
    }

    // =========================================================================
    // GOALS BUSINESS LOGIC
    // =========================================================================

    public String getGoals() {
        if (mongoService.isConnected()) {
            String mongoData = mongoService.getGoalsJson();
            if (mongoData != null && !"[]".equals(mongoData)) {
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
        List<Document> docs = TransactionRepository.parsePayloadDocuments(body);
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
            if (cloudData != null && !"[]".equals(cloudData)) {
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
        List<Document> docs = TransactionRepository.parsePayloadDocuments(body);
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
    // USER DELEGATION
    // =========================================================================

    public String getUser(String userId) {
        return authService.getUserJson(userId);
    }

    public SaveResult saveUser(String body) {
        if (body == null || body.isBlank()) {
            return new SaveResult(false, false, "Empty payload");
        }
        boolean cloudSaved = authService.saveUserJson(body);
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
        return new SyncResult(
            true,
            mongoService.isConnected(),
            System.currentTimeMillis(),
            mongoService.isConnected() ? "Retrieved data from MongoDB Atlas" : "Retrieved data from Java local storage",
            getTransactions(),
            getGoals(),
            getInvestments(),
            getUser("default_user"),
            getSettings()
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

        return new SyncResult(
            true,
            cloudSynced,
            serverTime,
            cloudSynced ? "Synced successfully with MongoDB Atlas!" : "Synced locally with Java backend",
            getTransactions(),
            getGoals(),
            getInvestments(),
            getUser("default_user"),
            getSettings()
        );
    }
}
