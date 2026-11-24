package com.financetracker.app;

import com.financetracker.controller.*;
import com.financetracker.service.FinanceService;
import com.financetracker.service.MongoDBService;
import com.financetracker.service.StorageService;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

/**
 * FinanceApp - Main Application Bootstrap & Router
 * Starts the HTTP server on port 8080 using Java 21 Virtual Threads
 * and registers all API controllers.
 */
public class FinanceApp {
    public static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        System.out.println("==================================================");
        System.out.println(" Initializing Finance Tracker Services...");
        System.out.println("==================================================");

        // 1. Initialize Service Layer (Business Logic & Database Connections)
        StorageService storageService = StorageService.getInstance();
        FinanceService financeService = FinanceService.getInstance();
        MongoDBService mongoService = financeService.getMongoService();

        // 2. Create HTTP Server using Java 21 Virtual Threads
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        // 3. Register Controllers to API Endpoints
        server.createContext("/api/health", new HealthController(mongoService));
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
        System.out.println(" URL: http://localhost:" + PORT + "/api/health");
        System.out.println(" Storage Directory: " + storageService.getDataDir().toAbsolutePath());
        System.out.println(" MongoDB Atlas Status: " + (mongoService.isConnected() ? "CONNECTED" : "OFFLINE / LOCAL FALLBACK"));
        if (!mongoService.isConnected()) {
            System.out.println(" Note: Set your MongoDB password in backend/config.properties or in the UI Settings.");
        }
        System.out.println(" Endpoints Registered:");
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
}
