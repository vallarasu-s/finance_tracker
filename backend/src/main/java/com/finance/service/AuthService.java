package com.finance.service;

import com.finance.dto.LoginRequest;
import com.finance.dto.RegisterRequest;
import com.finance.model.User;
import com.finance.repository.UserRepository;

import java.time.LocalDate;

/**
 * AuthService - Handles user authentication, registration, and profile retrieval/persistence.
 */
public class AuthService {
    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String getUserJson(String userId) {
        return userRepository.findById(userId);
    }

    public boolean saveUserJson(String body) {
        return userRepository.save(body);
    }

    /**
     * Authenticates an existing local/cloud user or provisions a profile when offline.
     */
    public AuthResult login(LoginRequest request) {
        if (request == null || !request.isValid()) {
            throw new IllegalArgumentException("Identifier (username or email) is required.");
        }
        String identifier = request.identifier().trim();
        String existingJson = userRepository.findById(identifier);
        if (existingJson != null && !existingJson.isBlank() && !"{}".equals(existingJson.trim())) {
            User existing = User.fromJson(existingJson);
            if (existing != null && existing.getName() != null) {
                return new AuthResult(true, false, existing, "Signed in successfully.");
            }
        }

        User created = buildProfile(identifier, null, null);
        boolean cloudSaved = userRepository.save(created.toJson());
        return new AuthResult(true, cloudSaved, created, "Profile signed in.");
    }

    /**
     * Registers a new user profile and mirrors it to local/cloud storage.
     */
    public AuthResult register(RegisterRequest request) {
        if (request == null || !request.isValid()) {
            throw new IllegalArgumentException("Display name is required.");
        }
        User created = buildProfile(request.name().trim(), request.username(), request.email());
        boolean cloudSaved = userRepository.save(created.toJson());
        return new AuthResult(true, cloudSaved, created, "Account registered successfully.");
    }

    private User buildProfile(String displayName, String username, String email) {
        String cleanUsername = (username != null && !username.isBlank())
            ? username.trim().toLowerCase().replaceAll("\\s+", "")
            : displayName.toLowerCase().replaceAll("\\s+", "");
        String cleanEmail = (email != null && !email.isBlank())
            ? email.trim()
            : (displayName.contains("@") ? displayName : cleanUsername + "@financetracker.local");

        StringBuilder initials = new StringBuilder();
        for (String part : displayName.split("\\s+")) {
            if (!part.isEmpty() && initials.length() < 2) {
                initials.append(Character.toUpperCase(part.charAt(0)));
            }
        }
        String avatar = initials.length() > 0 ? initials.toString() : "FT";

        return new User(
            "usr_" + System.currentTimeMillis(),
            displayName,
            cleanUsername,
            cleanEmail,
            "Personal Account",
            avatar,
            LocalDate.now().toString()
        );
    }

    public record AuthResult(boolean success, boolean cloudSynced, User user, String message) {}
}
