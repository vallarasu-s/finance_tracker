package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * UserController - Handles /api/user REST endpoint.
 * Supports GET (Read user profile) and POST/PUT (Write user profile).
 */
public class UserController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public UserController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            switch (exchange.getRequestMethod().toUpperCase()) {
                case "GET" -> {
                    String userId = getQueryParam(exchange, "userId");
                    if (userId == null || userId.isBlank()) {
                        userId = "default_user";
                    }
                    sendResponse(exchange, 200, financeService.getUser(userId));
                }
                case "POST", "PUT" -> {
                    String body = readRequestBody(exchange);
                    sendSaveResult(exchange, financeService.saveUser(body));
                }
                default -> sendError(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
