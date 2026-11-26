package com.finance.controller;

import com.finance.dto.LoginRequest;
import com.finance.dto.RegisterRequest;
import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.AuthService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

/**
 * AuthController - Handles /api/auth/login and /api/auth/register REST endpoints.
 */
public class AuthController extends BaseController implements HttpHandler {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleOptions(exchange)) return;

        try {
            String method = exchange.getRequestMethod().toUpperCase();
            String path = exchange.getRequestURI().getPath();

            if (!"POST".equals(method)) {
                sendError(exchange, 405, "Method Not Allowed");
                return;
            }

            String body = readRequestBody(exchange);
            AuthService.AuthResult result;
            if (path.endsWith("/register")) {
                RegisterRequest req = RegisterRequest.fromJson(body);
                result = authService.register(req);
            } else {
                LoginRequest req = LoginRequest.fromJson(body);
                result = authService.login(req);
            }

            String response = """
                {
                    "success": %b,
                    "cloudSynced": %b,
                    "message": "%s",
                    "user": %s
                }
                """.formatted(
                    result.success(),
                    result.cloudSynced(),
                    escapeJson(result.message()),
                    result.user().toJson()
                );
            sendResponse(exchange, 200, response);
        } catch (Exception e) {
            GlobalExceptionHandler.handle(exchange, e);
        }
    }
}
