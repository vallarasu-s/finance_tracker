package com.financetracker.controller;

import com.financetracker.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * SyncController - Handles /api/sync REST endpoint
 * Supports GET (Unified Read All) and POST (Unified Bidirectional Sync)
 */
public class SyncController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public SyncController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();

        switch (method) {
            case "GET" -> {
                FinanceService.SyncResult result = financeService.getAllData();
                String response = """
                    {
                        "success": true,
                        "cloudSynced": %b,
                        "serverTimestamp": %d,
                        "message": "%s",
                        "transactions": %s,
                        "goals": %s,
                        "investments": %s,
                        "user": %s,
                        "settings": %s
                    }
                    """.formatted(
                        result.cloudSynced(),
                        result.serverTimestamp(),
                        escapeJson(result.message()),
                        result.transactions(),
                        result.goals(),
                        result.investments(),
                        result.user(),
                        result.settings()
                    );
                sendResponse(exchange, 200, response);
            }
            case "POST" -> {
                String body = readRequestBody(exchange);
                FinanceService.SyncResult result = financeService.syncAllData(body);
                String response = """
                    {
                        "success": true,
                        "cloudSynced": %b,
                        "serverTimestamp": %d,
                        "message": "%s",
                        "transactions": %s,
                        "goals": %s,
                        "investments": %s,
                        "user": %s,
                        "settings": %s
                    }
                    """.formatted(
                        result.cloudSynced(),
                        result.serverTimestamp(),
                        escapeJson(result.message()),
                        result.transactions(),
                        result.goals(),
                        result.investments(),
                        result.user(),
                        result.settings()
                    );
                sendResponse(exchange, 200, response);
            }
            default -> sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
        }
    }
}
