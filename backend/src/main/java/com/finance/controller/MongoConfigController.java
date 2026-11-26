package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.MongoDBService;
import com.finance.service.StorageService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * MongoConfigController - Handles /api/config/mongodb REST endpoint.
 * Allows checking MongoDB status and configuring credentials from the web UI.
 */
public class MongoConfigController extends BaseController implements HttpHandler {
    private final MongoDBService mongoService;

    public MongoConfigController(MongoDBService mongoService) {
        this.mongoService = mongoService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            switch (exchange.getRequestMethod().toUpperCase()) {
                case "GET" -> {
                    String response = """
                        {
                            "connected": %b,
                            "cluster": "cluster0.bkqubnl.mongodb.net",
                            "database": "finance_tracker",
                            "maskedUri": "%s",
                            "error": %s
                        }
                        """.formatted(
                            mongoService.isConnected(),
                            mongoService.getMaskedUri(),
                            mongoService.getLastConnectionError() != null ? "\"" + escapeJson(mongoService.getLastConnectionError()) + "\"" : "null"
                        );
                    sendResponse(exchange, 200, response);
                }
                case "POST" -> {
                    String body = readRequestBody(exchange);
                    String password = StorageService.extractJsonValue(body, "password");
                    String uri = StorageService.extractJsonValue(body, "uri");

                    boolean connected = false;
                    if (password != null && !password.isBlank()) {
                        connected = mongoService.updatePasswordAndReconnect(password);
                    } else if (uri != null && !uri.isBlank()) {
                        connected = mongoService.connect(uri);
                    }

                    String response = """
                        {
                            "success": %b,
                            "connected": %b,
                            "message": "%s",
                            "maskedUri": "%s"
                        }
                        """.formatted(
                            connected,
                            mongoService.isConnected(),
                            connected ? "Connected successfully to MongoDB Atlas!" : ("Connection failed: " + (mongoService.getLastConnectionError() != null ? escapeJson(mongoService.getLastConnectionError()) : "Unknown error")),
                            mongoService.getMaskedUri()
                        );
                    sendResponse(exchange, 200, response);
                }
                default -> sendError(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
