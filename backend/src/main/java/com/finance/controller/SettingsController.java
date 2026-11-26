package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * SettingsController - Handles /api/settings REST endpoint.
 * Supports GET (Read settings) and POST/PUT (Write settings).
 */
public class SettingsController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public SettingsController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            switch (exchange.getRequestMethod().toUpperCase()) {
                case "GET" -> sendResponse(exchange, 200, financeService.getSettings());
                case "POST", "PUT" -> {
                    String body = readRequestBody(exchange);
                    sendSaveResult(exchange, financeService.saveSettings(body));
                }
                default -> sendError(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
