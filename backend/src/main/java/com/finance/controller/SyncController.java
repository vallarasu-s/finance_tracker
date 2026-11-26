package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * SyncController - Handles /api/sync REST endpoint.
 * Supports GET (Unified Read All) and POST (Unified Bidirectional Sync).
 */
public class SyncController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public SyncController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            String method = exchange.getRequestMethod().toUpperCase();
            FinanceService.SyncResult result;

            switch (method) {
                case "GET" -> result = financeService.getAllData();
                case "POST" -> {
                    String body = readRequestBody(exchange);
                    result = financeService.syncAllData(body);
                }
                default -> {
                    sendError(exchange, 405, "Method Not Allowed");
                    return;
                }
            }

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
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
