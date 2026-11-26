package com.finance.dto;

import org.bson.Document;

/**
 * Request payload DTO for /api/auth/login.
 */
public record LoginRequest(String identifier, String password, boolean rememberMe) {

    public static LoginRequest fromJson(String json) {
        if (json == null || json.isBlank()) {
            return new LoginRequest(null, null, true);
        }
        Document doc = Document.parse(json);
        String identifier = doc.getString("identifier");
        if (identifier == null || identifier.isBlank()) {
            identifier = doc.getString("email");
        }
        if (identifier == null || identifier.isBlank()) {
            identifier = doc.getString("username");
        }
        String password = doc.getString("password");
        Boolean remember = doc.getBoolean("rememberMe");
        return new LoginRequest(identifier, password, remember == null || remember);
    }

    public boolean isValid() {
        return identifier != null && !identifier.isBlank();
    }
}
