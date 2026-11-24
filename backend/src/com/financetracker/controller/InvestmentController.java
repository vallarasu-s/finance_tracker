package com.financetracker.controller;

import com.financetracker.service.FinanceService;
import com.financetracker.service.StorageService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * InvestmentController - Handles /api/investments REST endpoint
 * Supports GET (Read), POST/PUT (Write), DELETE (Remove)
 */
public class InvestmentController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public InvestmentController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();

        switch (method) {
            case "GET" -> {
                String data = financeService.getInvestments();
                sendResponse(exchange, 200, data);
            }
            case "POST", "PUT" -> {
                String body = readRequestBody(exchange);
                FinanceService.SaveResult result = financeService.saveInvestments(body);
                int status = result.success() ? 200 : 400;
                String response = """
                    {"success":%b,"cloudSynced":%b,"message":"%s"}
                    """.formatted(result.success(), result.cloudSynced(), escapeJson(result.message()));
                sendResponse(exchange, status, response);
            }
            case "DELETE" -> {
                String id = getQueryParam(exchange, "id");
                if (id == null) {
                    String body = readRequestBody(exchange);
                    id = StorageService.extractJsonValue(body, "id");
                }
                if (id != null && !id.isBlank()) {
                    boolean cloudDeleted = financeService.deleteInvestment(id);
                    String response = """
                        {"success":true,"cloudDeleted":%b,"message":"Investment holding deleted successfully"}
                        """.formatted(cloudDeleted);
                    sendResponse(exchange, 200, response);
                } else {
                    sendResponse(exchange, 400, "{\"error\":\"Missing investment id\"}");
                }
            }
            default -> sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
        }
    }
}
