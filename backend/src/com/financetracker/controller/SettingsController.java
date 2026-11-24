package com.financetracker.controller;

import com.financetracker.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * SettingsController - Handles /api/settings REST endpoint
 * Supports GET (Read settings), POST/PUT (Write settings)
 */
public class SettingsController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public SettingsController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();

        switch (method) {
            case "GET" -> {
                String data = financeService.getSettings();
                sendResponse(exchange, 200, data);
            }
            case "POST", "PUT" -> {
                String body = readRequestBody(exchange);
                FinanceService.SaveResult result = financeService.saveSettings(body);
                int status = result.success() ? 200 : 400;
                String response = """
                    {"success":%b,"cloudSynced":%b,"message":"%s"}
                    """.formatted(result.success(), result.cloudSynced(), escapeJson(result.message()));
                sendResponse(exchange, status, response);
            }
            default -> sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
        }
    }
}
