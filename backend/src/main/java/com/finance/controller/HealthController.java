package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.MongoDBService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * HealthController - Handles /api/health REST endpoint.
 * Returns backend service status, Java 21 info, and MongoDB Atlas connectivity status.
 */
public class HealthController extends BaseController implements HttpHandler {
    private final MongoDBService mongoService;

    public HealthController(MongoDBService mongoService) {
        this.mongoService = mongoService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            long now = System.currentTimeMillis();
            boolean connected = mongoService.isConnected();
            String statusMsg = connected
                ? "Connected to MongoDB Atlas"
                : (mongoService.getLastConnectionError() != null ? mongoService.getLastConnectionError() : "Offline fallback");

            String json = """
                {
                    "status": "UP",
                    "timestamp": %d,
                    "service": "Finance Tracker Java 21 Backend",
                    "version": "1.0.0",
                    "javaVersion": "%s",
                    "mongodb": {
                        "connected": %b,
                        "cluster": "cluster0.bkqubnl.mongodb.net",
                        "database": "finance_tracker",
                        "status": "%s"
                    }
                }
                """.formatted(
                    now,
                    System.getProperty("java.version"),
                    connected,
                    escapeJson(statusMsg)
                );

            sendResponse(exchange, 200, json);
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
