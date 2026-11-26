package com.finance;

import com.finance.controller.*;
import com.finance.service.FinanceService;
import com.finance.service.MongoDBService;
import com.finance.service.StorageService;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;
import java.util.concurrent.Executors;

/**
 * FinanceApplication - Main Application Bootstrap & HTTP Router.
 * Starts the HTTP server using Java 21 Virtual Threads and registers all REST API controllers.
 */
public class FinanceApplication {
    public static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) throws IOException {
        int port = resolveServerPort();

        System.out.println("==================================================");
        System.out.println(" Initializing Finance Tracker Services...");
        System.out.println("==================================================");

        // 1. Initialize Service Layer (Business Logic, Repositories & Database Connections)
        FinanceService financeService = FinanceService.getInstance();
        StorageService storageService = financeService.getStorageService();
        MongoDBService mongoService = financeService.getMongoService();

        // 2. Create HTTP Server using Java 21 Virtual Threads
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        // 3. Register Controllers to API Endpoints
        server.createContext("/api/health", new HealthController(mongoService));
        server.createContext("/api/auth", new AuthController(financeService.getAuthService()));
        server.createContext("/api/dashboard", new DashboardController(financeService.getDashboardService()));
        server.createContext("/api/transactions", new TransactionController(financeService));
        server.createContext("/api/goals", new GoalController(financeService));
        server.createContext("/api/investments", new InvestmentController(financeService));
        server.createContext("/api/user", new UserController(financeService));
        server.createContext("/api/settings", new SettingsController(financeService));
        server.createContext("/api/sync", new SyncController(financeService));
        server.createContext("/api/config/mongodb", new MongoConfigController(mongoService));

        // 4. Start Server
        server.start();

        System.out.println("==================================================");
        System.out.println(" Finance Tracker Java 21 + MongoDB Backend Started!");
        System.out.println(" URL: http://localhost:" + port + "/api/health");
        System.out.println(" Storage Directory: " + storageService.getDataDir().toAbsolutePath());
        System.out.println(" MongoDB Atlas Status: " + (mongoService.isConnected() ? "CONNECTED" : "OFFLINE / LOCAL FALLBACK"));
        if (!mongoService.isConnected()) {
            System.out.println(" Note: Set your MongoDB password in backend/src/main/resources/application.properties or UI Settings.");
        }
        System.out.println(" Endpoints Registered:");
        System.out.println("   - /api/auth/login    [POST]");
        System.out.println("   - /api/auth/register [POST]");
        System.out.println("   - /api/dashboard     [GET]");
        System.out.println("   - /api/transactions  [GET, POST, PUT, DELETE]");
        System.out.println("   - /api/goals         [GET, POST, PUT, DELETE]");
        System.out.println("   - /api/investments   [GET, POST, PUT, DELETE]");
        System.out.println("   - /api/user          [GET, POST, PUT]");
        System.out.println("   - /api/settings      [GET, POST, PUT]");
        System.out.println("   - /api/sync          [GET, POST]");
        System.out.println("   - /api/health        [GET]");
        System.out.println("   - /api/config/mongodb [GET, POST]");
        System.out.println("==================================================");
    }

    private static int resolveServerPort() {
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.isBlank()) {
            try {
                return Integer.parseInt(envPort.trim());
            } catch (NumberFormatException ignored) {}
        }

        Properties props = new Properties();
        for (String candidate : new String[]{
            "src/main/resources/application.properties",
            "backend/src/main/resources/application.properties",
            "application.properties",
            "config.properties"
        }) {
            Path p = Paths.get(candidate);
            if (Files.exists(p)) {
                try (InputStream in = Files.newInputStream(p)) {
                    props.load(in);
                    String portStr = props.getProperty("server.port");
                    if (portStr != null && !portStr.isBlank()) {
                        return Integer.parseInt(portStr.trim());
                    }
                } catch (Exception ignored) {}
            }
        }
        return DEFAULT_PORT;
    }
}
