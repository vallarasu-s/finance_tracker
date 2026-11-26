package com.finance.service;

import org.bson.Document;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * StorageService - Manages local JSON file persistence in backend/data/
 * Provides resilient offline fallback when MongoDB Atlas is unavailable.
 */
public class StorageService {
    private static StorageService instance;

    private final Path dataDir;
    private final Path transactionsFile;
    private final Path goalsFile;
    private final Path investmentsFile;
    private final Path settingsFile;
    private final Path userFile;

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private StorageService() {
        this.dataDir = Files.isDirectory(Paths.get("backend/data")) 
            ? Paths.get("backend/data") 
            : Paths.get("data");
        this.transactionsFile = dataDir.resolve("transactions.json");
        this.goalsFile = dataDir.resolve("goals.json");
        this.investmentsFile = dataDir.resolve("investments.json");
        this.settingsFile = dataDir.resolve("settings.json");
        this.userFile = dataDir.resolve("user.json");
        initStorage();
    }

    public static synchronized StorageService getInstance() {
        if (instance == null) {
            instance = new StorageService();
        }
        return instance;
    }

    public void initStorage() {
        try {
            if (!Files.exists(dataDir)) {
                Files.createDirectories(dataDir);
            }
            if (!Files.exists(transactionsFile)) {
                Files.writeString(transactionsFile, "[]", StandardCharsets.UTF_8);
            }
            if (!Files.exists(goalsFile)) {
                Files.writeString(goalsFile, "[]", StandardCharsets.UTF_8);
            }
            if (!Files.exists(investmentsFile)) {
                Files.writeString(investmentsFile, "[]", StandardCharsets.UTF_8);
            }
            if (!Files.exists(settingsFile)) {
                Files.writeString(settingsFile, "{}", StandardCharsets.UTF_8);
            }
            if (!Files.exists(userFile)) {
                Files.writeString(userFile, "{}", StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            System.err.println("[StorageService] Failed to initialize storage: " + e.getMessage());
        }
    }

    public Path getDataDir() {
        return dataDir;
    }

    // --- Transactions Read & Write ---

    public String readTransactions() {
        lock.readLock().lock();
        try {
            if (!Files.exists(transactionsFile)) return "[]";
            String data = Files.readString(transactionsFile, StandardCharsets.UTF_8).trim();
            return data.isBlank() ? "[]" : data;
        } catch (IOException e) {
            return "[]";
        } finally {
            lock.readLock().unlock();
        }
    }

    public void writeTransactions(String json) {
        lock.writeLock().lock();
        try {
            Files.writeString(transactionsFile, json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[StorageService] Error writing transactions: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void deleteTransaction(String id) {
        deleteItemFromFile(transactionsFile, id);
    }

    // --- Goals Read & Write ---

    public String readGoals() {
        lock.readLock().lock();
        try {
            if (!Files.exists(goalsFile)) return "[]";
            String data = Files.readString(goalsFile, StandardCharsets.UTF_8).trim();
            return data.isBlank() ? "[]" : data;
        } catch (IOException e) {
            return "[]";
        } finally {
            lock.readLock().unlock();
        }
    }

    public void writeGoals(String json) {
        lock.writeLock().lock();
        try {
            Files.writeString(goalsFile, json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[StorageService] Error writing goals: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void deleteGoal(String id) {
        deleteItemFromFile(goalsFile, id);
    }

    // --- Investments Read & Write ---

    public String readInvestments() {
        lock.readLock().lock();
        try {
            if (!Files.exists(investmentsFile)) return "[]";
            String data = Files.readString(investmentsFile, StandardCharsets.UTF_8).trim();
            return data.isEmpty() ? "[]" : data;
        } catch (IOException e) {
            System.err.println("[StorageService] Error reading investments: " + e.getMessage());
            return "[]";
        } finally {
            lock.readLock().unlock();
        }
    }

    public void writeInvestments(String json) {
        lock.writeLock().lock();
        try {
            Files.writeString(investmentsFile, json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[StorageService] Error writing investments: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void deleteInvestment(String id) {
        deleteItemFromFile(investmentsFile, id);
    }

    // --- User Read & Write ---

    public String readUser(String userId) {
        lock.readLock().lock();
        try {
            if (!Files.exists(userFile)) return "{}";
            String data = Files.readString(userFile, StandardCharsets.UTF_8).trim();
            return data.isBlank() ? "{}" : data;
        } catch (IOException e) {
            return "{}";
        } finally {
            lock.readLock().unlock();
        }
    }

    public void writeUser(String json) {
        lock.writeLock().lock();
        try {
            Files.writeString(userFile, json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[StorageService] Error writing user: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    // --- Settings Read & Write ---

    public String readSettings() {
        lock.readLock().lock();
        try {
            if (!Files.exists(settingsFile)) return "{}";
            String data = Files.readString(settingsFile, StandardCharsets.UTF_8).trim();
            return data.isBlank() ? "{}" : data;
        } catch (IOException e) {
            return "{}";
        } finally {
            lock.readLock().unlock();
        }
    }

    public void writeSettings(String json) {
        lock.writeLock().lock();
        try {
            Files.writeString(settingsFile, json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[StorageService] Error writing settings: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    // --- Helper Methods ---

    public void deleteItemFromFile(Path file, String id) {
        if (id == null || id.isBlank() || !Files.exists(file)) return;
        lock.writeLock().lock();
        try {
            String content = Files.readString(file, StandardCharsets.UTF_8).trim();
            if (content.startsWith("[")) {
                List<Document> list = parseDocumentList(content);
                List<Document> remaining = new ArrayList<>();
                for (Document d : list) {
                    String docId = d.getString("id");
                    if (docId == null || !docId.equals(id)) {
                        remaining.add(d);
                    }
                }
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < remaining.size(); i++) {
                    if (i > 0) sb.append(",");
                    sb.append(remaining.get(i).toJson());
                }
                sb.append("]");
                Files.writeString(file, sb.toString(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            System.err.println("[StorageService] Error deleting item from " + file + ": " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public static List<Document> parseDocumentList(String jsonArrayStr) {
        List<Document> list = new ArrayList<>();
        if (jsonArrayStr == null) return list;
        String trimmed = jsonArrayStr.trim();
        if (!trimmed.startsWith("[")) return list;

        int depth = 0;
        int start = -1;
        boolean inStr = false;
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == '"' && (i == 0 || trimmed.charAt(i - 1) != '\\')) inStr = !inStr;
            if (!inStr) {
                if (c == '{') {
                    if (depth == 0) start = i;
                    depth++;
                } else if (c == '}') {
                    depth--;
                    if (depth == 0 && start != -1) {
                        try {
                            list.add(Document.parse(trimmed.substring(start, i + 1)));
                        } catch (Exception ignored) {}
                        start = -1;
                    }
                }
            }
        }
        return list;
    }

    public static String extractJsonValue(String json, String key) {
        if (json == null) return null;
        String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]*)\"";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    public static String extractJsonArray(String json, String key) {
        String search = "\"" + key + "\"";
        int keyIdx = json.indexOf(search);
        if (keyIdx == -1) return null;
        int startBracket = json.indexOf("[", keyIdx);
        if (startBracket == -1) return null;

        int depth = 0;
        boolean inString = false;
        boolean escape = false;

        for (int i = startBracket; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escape) {
                escape = false;
                continue;
            }
            if (c == '\\') {
                escape = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (c == '[') depth++;
                else if (c == ']') {
                    depth--;
                    if (depth == 0) {
                        return json.substring(startBracket, i + 1);
                    }
                }
            }
        }
        return null;
    }

    public static String extractJsonObject(String json, String key) {
        String search = "\"" + key + "\"";
        int keyIdx = json.indexOf(search);
        if (keyIdx == -1) return null;
        int startBrace = json.indexOf("{", keyIdx);
        if (startBrace == -1) return null;

        int depth = 0;
        boolean inString = false;
        boolean escape = false;

        for (int i = startBrace; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escape) {
                escape = false;
                continue;
            }
            if (c == '\\') {
                escape = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (c == '{') depth++;
                else if (c == '}') {
                    depth--;
                    if (depth == 0) {
                        return json.substring(startBrace, i + 1);
                    }
                }
            }
        }
        return null;
    }
}
