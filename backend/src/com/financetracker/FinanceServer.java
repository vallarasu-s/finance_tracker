package com.financetracker;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * High-performance Java 21 REST API Server for Offline-First Finance Tracker.
 * Operates without external Maven/Gradle dependencies, compiling instantly with JDK 21.
 */
public class FinanceServer {
    private static final int PORT = 8080;
    private static final Path DATA_DIR = Paths.get("data");
    private static final Path TRANSACTIONS_FILE = DATA_DIR.resolve("transactions.json");
    private static final Path GOALS_FILE = DATA_DIR.resolve("goals.json");
    private static final Path SETTINGS_FILE = DATA_DIR.resolve("settings.json");

    private static final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public static void main(String[] args) throws IOException {
        initStorage();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        // Leverage Java 21 Virtual Threads for lightweight, high-throughput request handling
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/transactions", new TransactionsHandler());
        server.createContext("/api/goals", new GoalsHandler());
        server.createContext("/api/sync", new SyncHandler());

        server.start();
        System.out.println("==================================================");
        System.out.println(" Finance Tracker Java 21 Backend Started!");
        System.out.println(" URL: http://localhost:" + PORT + "/api/health");
        System.out.println(" Storage Directory: " + DATA_DIR.toAbsolutePath());
        System.out.println(" Ready for online synchronization and REST API requests.");
        System.out.println("==================================================");
    }

    private static void initStorage() {
        try {
            if (!Files.exists(DATA_DIR)) {
                Files.createDirectories(DATA_DIR);
            }
            if (!Files.exists(TRANSACTIONS_FILE)) {
                Files.writeString(TRANSACTIONS_FILE, "[]", StandardCharsets.UTF_8);
            }
            if (!Files.exists(GOALS_FILE)) {
                Files.writeString(GOALS_FILE, "[]", StandardCharsets.UTF_8);
            }
            if (!Files.exists(SETTINGS_FILE)) {
                Files.writeString(SETTINGS_FILE, "{}", StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            System.err.println("Failed to initialize storage: " + e.getMessage());
        }
    }

    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        setCorsHeaders(exchange);
        byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int n;
            while ((n = is.read(buffer)) != -1) {
                bos.write(buffer, 0, n);
            }
            return bos.toString(StandardCharsets.UTF_8);
        }
    }

    // --- Handlers ---

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 204, "");
                return;
            }
            long now = System.currentTimeMillis();
            String json = """
                {
                    "status": "UP",
                    "timestamp": %d,
                    "service": "Finance Tracker Java Backend",
                    "version": "1.0.0",
                    "javaVersion": "%s"
                }
                """.formatted(now, System.getProperty("java.version"));
            sendResponse(exchange, 200, json);
        }
    }

    static class TransactionsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if ("GET".equals(method)) {
                lock.readLock().lock();
                try {
                    String data = Files.readString(TRANSACTIONS_FILE, StandardCharsets.UTF_8);
                    sendResponse(exchange, 200, data.isBlank() ? "[]" : data);
                } finally {
                    lock.readLock().unlock();
                }
                return;
            }

            if ("POST".equals(method) || "PUT".equals(method)) {
                String body = readRequestBody(exchange);
                if (body.isBlank()) {
                    sendResponse(exchange, 400, "{\"error\":\"Empty payload\"}");
                    return;
                }

                lock.writeLock().lock();
                try {
                    Files.writeString(TRANSACTIONS_FILE, body, StandardCharsets.UTF_8);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Transactions saved successfully\"}");
                } finally {
                    lock.writeLock().unlock();
                }
                return;
            }

            sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
        }
    }

    static class GoalsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if ("GET".equals(method)) {
                lock.readLock().lock();
                try {
                    String data = Files.readString(GOALS_FILE, StandardCharsets.UTF_8);
                    sendResponse(exchange, 200, data.isBlank() ? "[]" : data);
                } finally {
                    lock.readLock().unlock();
                }
                return;
            }

            if ("POST".equals(method) || "PUT".equals(method)) {
                String body = readRequestBody(exchange);
                if (body.isBlank()) {
                    sendResponse(exchange, 400, "{\"error\":\"Empty payload\"}");
                    return;
                }

                lock.writeLock().lock();
                try {
                    Files.writeString(GOALS_FILE, body, StandardCharsets.UTF_8);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Goals saved successfully\"}");
                } finally {
                    lock.writeLock().unlock();
                }
                return;
            }

            sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
        }
    }

    static class SyncHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                long serverTime = System.currentTimeMillis();

                lock.writeLock().lock();
                try {
                    String clientTx = extractJsonArray(body, "transactions");
                    String clientGoals = extractJsonArray(body, "goals");

                    if (clientTx != null && !clientTx.isBlank()) {
                        Files.writeString(TRANSACTIONS_FILE, clientTx, StandardCharsets.UTF_8);
                    }
                    if (clientGoals != null && !clientGoals.isBlank()) {
                        Files.writeString(GOALS_FILE, clientGoals, StandardCharsets.UTF_8);
                    }

                    String currentTx = Files.readString(TRANSACTIONS_FILE, StandardCharsets.UTF_8);
                    String currentGoals = Files.readString(GOALS_FILE, StandardCharsets.UTF_8);

                    if (currentTx.isBlank()) currentTx = "[]";
                    if (currentGoals.isBlank()) currentGoals = "[]";

                    String response = """
                        {
                            "success": true,
                            "serverTimestamp": %d,
                            "message": "Synced successfully with Java backend",
                            "transactions": %s,
                            "goals": %s
                        }
                        """.formatted(serverTime, currentTx, currentGoals);

                    sendResponse(exchange, 200, response);
                } finally {
                    lock.writeLock().unlock();
                }
                return;
            }

            sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
        }

        private String extractJsonArray(String json, String key) {
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
    }
}
