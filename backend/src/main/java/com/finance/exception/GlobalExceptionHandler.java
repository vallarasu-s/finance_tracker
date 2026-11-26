package com.finance.exception;

import com.finance.config.SecurityConfig;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * GlobalExceptionHandler - Standardized HTTP error serialization across all REST controllers.
 */
public final class GlobalExceptionHandler {

    private GlobalExceptionHandler() {}

    /**
     * Maps an unexpected exception to an appropriate HTTP status code and JSON error response.
     */
    public static void handle(HttpExchange exchange, Throwable error) throws IOException {
        if (error instanceof IllegalArgumentException) {
            sendError(exchange, 400, error.getMessage());
            return;
        }
        String message = error != null && error.getMessage() != null
            ? error.getMessage()
            : "Internal Server Error";
        sendError(exchange, 500, message);
    }

    /**
     * Sends a formatted JSON error payload with CORS headers.
     */
    public static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        SecurityConfig.applyCorsHeaders(exchange);
        String escaped = escapeJson(message != null ? message : "Request failed");
        String payload = "{\"success\":false,\"error\":\"%s\"}".formatted(escaped);
        byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
