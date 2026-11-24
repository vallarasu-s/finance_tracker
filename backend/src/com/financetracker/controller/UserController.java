package com.financetracker.controller;

import com.financetracker.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * UserController - Handles /api/user REST endpoint
 * Supports GET (Read user profile), POST/PUT (Write user profile)
 */
public class UserController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public UserController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();

        switch (method) {
            case "GET" -> {
                String userId = getQueryParam(exchange, "userId");
                if (userId == null || userId.isBlank()) {
                    userId = "default_user";
                }
                String data = financeService.getUser(userId);
                sendResponse(exchange, 200, data);
            }
            case "POST", "PUT" -> {
                String body = readRequestBody(exchange);
                FinanceService.SaveResult result = financeService.saveUser(body);
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
