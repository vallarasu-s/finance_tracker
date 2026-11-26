package com.finance.config;

import com.sun.net.httpserver.HttpExchange;

/**
 * SecurityConfig - Centralizes HTTP CORS headers, allowed methods, and request security policies.
 */
public final class SecurityConfig {
    public static final String ALLOWED_ORIGIN = "*";
    public static final String ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
    public static final String ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With";
    public static final String CONTENT_TYPE_JSON = "application/json; charset=UTF-8";

    private SecurityConfig() {}

    /**
     * Applies standard CORS and JSON content-type headers onto the HTTP exchange response.
     */
    public static void applyCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", ALLOWED_METHODS);
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
        exchange.getResponseHeaders().set("Content-Type", CONTENT_TYPE_JSON);
    }
}
