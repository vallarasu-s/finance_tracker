package com.finance.controller;

import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.DashboardService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * DashboardController - Handles /api/dashboard REST endpoint for aggregated KPI summaries.
 */
public class DashboardController extends BaseController implements HttpHandler {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "Method Not Allowed");
                return;
            }
            DashboardService.DashboardSummary summary = dashboardService.getSummary();
            sendResponse(exchange, 200, summary.toJson());
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
