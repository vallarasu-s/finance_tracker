package com.finance.service;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import com.mongodb.client.model.Sorts;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * MongoDBService - Manages connection and CRUD persistence to MongoDB Atlas
 * Cluster: cluster0.bkqubnl.mongodb.net
 * Database: finance_tracker
 * Collections: users, transactions, goals, settings
 */
public class MongoDBService {
    private static final String DEFAULT_DATABASE = "finance_tracker";
    private static final String DEFAULT_URI_TEMPLATE = "mongodb+srv://vallarasu3701_db_user:<db_password>@cluster0.bkqubnl.mongodb.net/finance_tracker?retryWrites=true&w=majority&compressors=zlib";

    private static MongoDBService instance;

    private MongoClient mongoClient;
    private MongoDatabase database;
    private String currentUri;
    private String databaseName = DEFAULT_DATABASE;
    private final AtomicBoolean isConnected = new AtomicBoolean(false);
    private String lastConnectionError = "Database password not configured yet.";

    private MongoCollection<Document> usersCollection;
    private MongoCollection<Document> transactionsCollection;
    private MongoCollection<Document> goalsCollection;
    private MongoCollection<Document> investmentsCollection;
    private MongoCollection<Document> settingsCollection;

    private MongoDBService() {
        loadConfigAndConnect();
    }

    public static synchronized MongoDBService getInstance() {
        if (instance == null) {
            instance = new MongoDBService();
        }
        return instance;
    }

    public void loadConfigAndConnect() {
        Properties props = new Properties();
        Path configPath = findConfigFile();

        if (configPath != null && Files.exists(configPath)) {
            try (InputStream in = Files.newInputStream(configPath)) {
                props.load(in);
            } catch (IOException e) {
                System.err.println("[MongoDBService] Failed to read application.properties: " + e.getMessage());
            }
        } else {
            try (InputStream in = MongoDBService.class.getResourceAsStream("/application.properties")) {
                if (in != null) {
                    props.load(in);
                }
            } catch (IOException ignored) {}
        }

        String envUri = System.getenv("MONGODB_URI");
        String envPassword = System.getenv("MONGODB_PASSWORD");

        String rawUri = envUri != null && !envUri.isBlank() 
            ? envUri 
            : props.getProperty("mongodb.uri", DEFAULT_URI_TEMPLATE);

        String password = envPassword != null && !envPassword.isBlank()
            ? envPassword
            : props.getProperty("mongodb.password", "").trim();

        this.databaseName = props.getProperty("mongodb.database", DEFAULT_DATABASE).trim();

        String finalUri = rawUri;
        if (!password.isEmpty() && finalUri.contains("<db_password>")) {
            finalUri = finalUri.replace("<db_password>", password);
        }

        connect(finalUri);
    }

    public synchronized boolean connect(String connectionUri) {
        this.currentUri = connectionUri;

        if (connectionUri == null || connectionUri.isBlank() || connectionUri.contains("<db_password>")) {
            isConnected.set(false);
            lastConnectionError = "MongoDB password is required. Replace <db_password> in backend/config.properties or via Settings in the UI.";
            System.out.println("[MongoDBService] Offline Mode: " + lastConnectionError);
            return false;
        }

        try {
            if (mongoClient != null) {
                try {
                    mongoClient.close();
                } catch (Exception ignored) {}
            }

            ConnectionString connString = new ConnectionString(connectionUri);
            MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connString)
                .applyToSocketSettings(builder -> builder.connectTimeout(5, TimeUnit.SECONDS).readTimeout(8, TimeUnit.SECONDS))
                .applyToClusterSettings(builder -> builder.serverSelectionTimeout(5, TimeUnit.SECONDS))
                .build();

            mongoClient = MongoClients.create(settings);
            
            String dbNameToUse = connString.getDatabase() != null && !connString.getDatabase().isBlank()
                ? connString.getDatabase()
                : this.databaseName;

            this.database = mongoClient.getDatabase(dbNameToUse);
            this.usersCollection = database.getCollection("users");
            this.transactionsCollection = database.getCollection("transactions");
            this.goalsCollection = database.getCollection("goals");
            this.investmentsCollection = database.getCollection("investments");
            this.settingsCollection = database.getCollection("settings");

            // Ping database to verify connection
            database.runCommand(new Document("ping", 1));

            isConnected.set(true);
            lastConnectionError = null;
            System.out.println("==================================================");
            System.out.println(" [MongoDBService] Connected successfully to MongoDB Atlas!");
            System.out.println(" Database: " + dbNameToUse);
            System.out.println(" Collections: users, transactions, goals, investments, settings");
            System.out.println("==================================================");
            return true;
        } catch (Exception e) {
            isConnected.set(false);
            lastConnectionError = e.getMessage();
            System.err.println("[MongoDBService] Connection attempt failed: " + e.getMessage());
            System.err.println("[MongoDBService] Falling back to local offline JSON storage in backend/data/.");
            return false;
        }
    }

    public boolean isConnected() {
        return isConnected.get();
    }

    public String getLastConnectionError() {
        return lastConnectionError;
    }

    public String getMaskedUri() {
        if (currentUri == null) return "";
        return currentUri.replaceAll("(?<=:)[^/@]+(?=@)", "******");
    }

    public synchronized boolean updatePasswordAndReconnect(String newPassword) {
        if (newPassword == null || newPassword.isBlank()) return false;

        Path configPath = findConfigFile();
        if (configPath != null) {
            try {
                Properties props = new Properties();
                if (Files.exists(configPath)) {
                    try (InputStream in = Files.newInputStream(configPath)) {
                        props.load(in);
                    }
                }
                props.setProperty("mongodb.password", newPassword.trim());
                String baseUri = props.getProperty("mongodb.uri", DEFAULT_URI_TEMPLATE);
                if (!baseUri.contains("<db_password>")) {
                    baseUri = DEFAULT_URI_TEMPLATE;
                    props.setProperty("mongodb.uri", baseUri);
                }
                try (OutputStream out = Files.newOutputStream(configPath)) {
                    props.store(out, "Finance Tracker MongoDB Atlas Configuration");
                }
            } catch (IOException e) {
                System.err.println("[MongoDBService] Failed to save config: " + e.getMessage());
            }
        }

        String finalUri = DEFAULT_URI_TEMPLATE.replace("<db_password>", newPassword.trim());
        return connect(finalUri);
    }

    // --- User Operations ---

    public boolean saveUser(String jsonStr) {
        if (!isConnected.get() || usersCollection == null) return false;
        try {
            Document doc = Document.parse(jsonStr);
            String userId = doc.getString("id");
            if (userId == null || userId.isBlank()) {
                userId = doc.getString("email");
            }
            if (userId == null || userId.isBlank()) {
                userId = "default_user";
                doc.put("id", userId);
            }
            doc.put("updatedAt", java.time.Instant.now().toString());

            Bson filter = Filters.or(Filters.eq("id", userId), Filters.eq("email", userId));
            usersCollection.replaceOne(filter, doc, new ReplaceOptions().upsert(true));
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error saving user: " + e.getMessage());
            return false;
        }
    }

    public String getUser(String userId) {
        if (!isConnected.get() || usersCollection == null) return null;
        try {
            Bson filter = userId != null && !userId.isBlank() 
                ? Filters.or(Filters.eq("id", userId), Filters.eq("email", userId))
                : new Document();
            Document userDoc = usersCollection.find(filter).first();
            if (userDoc != null) {
                userDoc.remove("_id");
                return userDoc.toJson();
            }
            return null;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error getting user: " + e.getMessage());
            return null;
        }
    }

    // --- Transactions Operations ---

    public boolean saveTransactions(List<Document> transactionsList) {
        if (!isConnected.get() || transactionsCollection == null) return false;
        try {
            for (Document tx : transactionsList) {
                String txId = tx.getString("id");
                if (txId == null || txId.isBlank()) {
                    txId = UUID.randomUUID().toString();
                    tx.put("id", txId);
                }
                Object amountObj = tx.get("amount");
                if (amountObj != null) {
                    try {
                        tx.put("amount", Double.parseDouble(String.valueOf(amountObj)));
                    } catch (Exception ignored) {}
                }
                tx.put("updatedAt", System.currentTimeMillis());
                transactionsCollection.replaceOne(Filters.eq("id", txId), tx, new ReplaceOptions().upsert(true));
            }
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error saving transactions batch: " + e.getMessage());
            return false;
        }
    }

    public String getTransactionsJson() {
        if (!isConnected.get() || transactionsCollection == null) return null;
        try {
            List<Document> list = new ArrayList<>();
            transactionsCollection.find()
                .sort(Sorts.descending("date", "time"))
                .into(list);

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                Document doc = list.get(i);
                doc.remove("_id");
                sb.append(doc.toJson());
            }
            sb.append("]");
            return sb.toString();
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error retrieving transactions: " + e.getMessage());
            return null;
        }
    }

    public boolean deleteTransaction(String id) {
        if (!isConnected.get() || transactionsCollection == null) return false;
        try {
            transactionsCollection.deleteOne(Filters.eq("id", id));
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error deleting transaction: " + e.getMessage());
            return false;
        }
    }

    // --- Goals Operations ---

    public boolean saveGoals(List<Document> goalsList) {
        if (!isConnected.get() || goalsCollection == null) return false;
        try {
            for (Document goal : goalsList) {
                String goalId = goal.getString("id");
                if (goalId == null || goalId.isBlank()) {
                    goalId = UUID.randomUUID().toString();
                    goal.put("id", goalId);
                }
                goal.put("updatedAt", System.currentTimeMillis());
                goalsCollection.replaceOne(Filters.eq("id", goalId), goal, new ReplaceOptions().upsert(true));
            }
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error saving goals batch: " + e.getMessage());
            return false;
        }
    }

    public String getGoalsJson() {
        if (!isConnected.get() || goalsCollection == null) return null;
        try {
            List<Document> list = new ArrayList<>();
            goalsCollection.find().into(list);

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                Document doc = list.get(i);
                doc.remove("_id");
                sb.append(doc.toJson());
            }
            sb.append("]");
            return sb.toString();
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error retrieving goals: " + e.getMessage());
            return null;
        }
    }

    public boolean deleteGoal(String id) {
        if (!isConnected.get() || goalsCollection == null) return false;
        try {
            goalsCollection.deleteOne(Filters.eq("id", id));
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error deleting goal: " + e.getMessage());
            return false;
        }
    }

    // --- Investments Operations ---

    public boolean saveInvestments(List<Document> investmentsList) {
        if (!isConnected.get() || investmentsCollection == null) return false;
        try {
            for (Document inv : investmentsList) {
                String invId = inv.getString("id");
                if (invId == null || invId.isBlank()) {
                    invId = "inv_" + System.currentTimeMillis() + "_" + Math.abs(inv.hashCode());
                    inv.put("id", invId);
                }
                investmentsCollection.replaceOne(Filters.eq("id", invId), inv, new ReplaceOptions().upsert(true));
            }
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error saving investments batch: " + e.getMessage());
            return false;
        }
    }

    public String getInvestmentsJson() {
        if (!isConnected.get() || investmentsCollection == null) return null;
        try {
            List<Document> list = new ArrayList<>();
            investmentsCollection.find().into(list);

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                Document doc = list.get(i);
                doc.remove("_id");
                sb.append(doc.toJson());
            }
            sb.append("]");
            return sb.toString();
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error retrieving investments: " + e.getMessage());
            return null;
        }
    }

    public boolean deleteInvestment(String id) {
        if (!isConnected.get() || investmentsCollection == null) return false;
        try {
            investmentsCollection.deleteOne(Filters.eq("id", id));
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error deleting investment: " + e.getMessage());
            return false;
        }
    }

    // --- Settings Operations ---

    public boolean saveSettings(String jsonStr) {
        if (!isConnected.get() || settingsCollection == null) return false;
        try {
            Document doc = Document.parse(jsonStr);
            doc.put("id", "user_settings");
            doc.put("updatedAt", System.currentTimeMillis());
            settingsCollection.replaceOne(Filters.eq("id", "user_settings"), doc, new ReplaceOptions().upsert(true));
            return true;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error saving settings: " + e.getMessage());
            return false;
        }
    }

    public String getSettingsJson() {
        if (!isConnected.get() || settingsCollection == null) return null;
        try {
            Document doc = settingsCollection.find(Filters.eq("id", "user_settings")).first();
            if (doc != null) {
                doc.remove("_id");
                return doc.toJson();
            }
            return null;
        } catch (Exception e) {
            System.err.println("[MongoDBService] Error getting settings: " + e.getMessage());
            return null;
        }
    }

    private Path findConfigFile() {
        Path p1 = Paths.get("src/main/resources/application.properties"); if (Files.exists(p1)) return p1; Path p2 = Paths.get("backend/src/main/resources/application.properties"); if (Files.exists(p2)) return p2; Path p3 = Paths.get("application.properties"); if (Files.exists(p3)) return p3; Path p4 = Paths.get("config.properties"); if (Files.exists(p4)) return p4; Path p5 = Paths.get("backend/config.properties"); if (Files.exists(p5)) return p5; return p1;
    }
}
