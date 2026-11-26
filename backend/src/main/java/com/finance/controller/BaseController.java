package com.finance.controller;

import com.finance.config.SecurityConfig;
import com.finance.exception.GlobalExceptionHandler;
import com.finance.service.FinanceService;
import com.finance.service.StorageService;
import com.sun.net.httpserver.HttpExchange;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * BaseController - Common utilities for all REST API HTTP Controllers.
 * Delegates CORS policy to SecurityConfig and error formatting to GlobalExceptionHandler.
 */
public abstract class BaseController {

    protected void setCorsHeaders(HttpExchange exchange) {
        SecurityConfig.applyCorsHeaders(exchange);
    }

    protected void sendResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        setCorsHeaders(exchange);
        byte[] bytes = (responseJson == null ? "" : responseJson).getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    protected void sendSaveResult(HttpExchange exchange, FinanceService.SaveResult result) throws IOException {
        int status = result.success() ? 200 : 400;
        String response = """
            {"success":%b,"cloudSynced":%b,"message":"%s"}
            """.formatted(result.success(), result.cloudSynced(), escapeJson(result.message()));
        sendResponse(exchange, status, response);
    }

    protected void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        GlobalExceptionHandler.sendError(exchange, statusCode, message);
    }

    protected boolean handleOptions(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendResponse(exchange, 204, "");
            return true;
        }
        return false;
    }

    protected String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int n;
            while ((n = is.read(buffer)) != -1) {
                bos.write(buffer, 0, n);
            }
            return bos.toString(StandardCharsets.UTF_8);
        }
    }

    protected String resolveIdParamOrBody(HttpExchange exchange) throws IOException {
        String id = getQueryParam(exchange, "id");
        if (id == null || id.isBlank()) {
            String body = readRequestBody(exchange);
            id = StorageService.extractJsonValue(body, "id");
        }
        return id;
    }

    protected String getQueryParam(HttpExchange exchange, String paramName) {
        String query = exchange.getRequestURI().getQuery();
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=");
            if (parts.length > 0 && parts[0].equals(paramName)) {
                return parts.length > 1 ? parts[1] : "";
            }
        }
        return null;
    }

    protected static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
