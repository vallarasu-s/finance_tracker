package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * TransactionController - Handles /api/transactions REST endpoint.
 * Supports GET (Read), POST/PUT (Write), DELETE (Remove).
 */
public class TransactionController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public TransactionController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            switch (exchange.getRequestMethod().toUpperCase()) {
                case "GET" -> sendResponse(exchange, 200, financeService.getTransactions());
                case "POST", "PUT" -> {
                    String body = readRequestBody(exchange);
                    sendSaveResult(exchange, financeService.saveTransactions(body));
                }
                case "DELETE" -> {
                    String id = resolveIdParamOrBody(exchange);
                    if (id != null && !id.isBlank()) {
                        boolean cloudDeleted = financeService.deleteTransaction(id);
                        String response = """
                            {"success":true,"cloudDeleted":%b,"message":"Transaction deleted successfully"}
                            """.formatted(cloudDeleted);
                        sendResponse(exchange, 200, response);
                    } else {
                        sendError(exchange, 400, "Missing transaction id");
                    }
                }
                default -> sendError(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
