package com.finance.dto;

import org.bson.Document;

/**
 * Request payload DTO for /api/auth/register.
 */
public record RegisterRequest(String name, String username, String email, String password) {

    public static RegisterRequest fromJson(String json) {
        if (json == null || json.isBlank()) {
            return new RegisterRequest(null, null, null, null);
        }
        Document doc = Document.parse(json);
        return new RegisterRequest(
            doc.getString("name"),
            doc.getString("username"),
            doc.getString("email"),
            doc.getString("password")
        );
    }

    public boolean isValid() {
        return name != null && !name.isBlank();
    }
}
