package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.FinanceService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * InvestmentController - Handles /api/investments REST endpoint.
 * Supports GET (Read), POST/PUT (Write), DELETE (Remove).
 */
public class InvestmentController extends BaseController implements HttpHandler {
    private final FinanceService financeService;

    public InvestmentController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            switch (exchange.getRequestMethod().toUpperCase()) {
                case "GET" -> sendResponse(exchange, 200, financeService.getInvestments());
                case "POST", "PUT" -> {
                    String body = readRequestBody(exchange);
                    sendSaveResult(exchange, financeService.saveInvestments(body));
                }
                case "DELETE" -> {
                    String id = resolveIdParamOrBody(exchange);
                    if (id != null && !id.isBlank()) {
                        boolean cloudDeleted = financeService.deleteInvestment(id);
                        String response = """
                            {"success":true,"cloudDeleted":%b,"message":"Investment holding deleted successfully"}
                            """.formatted(cloudDeleted);
                        sendResponse(exchange, 200, response);
                    } else {
                        sendError(exchange, 400, "Missing investment id");
                    }
                }
                default -> sendError(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
