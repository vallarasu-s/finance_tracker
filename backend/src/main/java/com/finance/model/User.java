package com.finance.model;

import org.bson.Document;

/**
 * User domain model persisted in MongoDB (users collection) and local JSON fallback.
 */
public class User {
    private String id;
    private String name;
    private String username;
    private String email;
    private String role;
    private String avatar;
    private String joinedDate;

    public User() {}

    public User(String id, String name, String username, String email, String role, String avatar, String joinedDate) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.role = role;
        this.avatar = avatar;
        this.joinedDate = joinedDate;
    }

    public static User fromDocument(Document doc) {
        if (doc == null) return null;
        return new User(
            doc.getString("id"),
            doc.getString("name"),
            doc.getString("username"),
            doc.getString("email"),
            doc.getString("role"),
            doc.getString("avatar"),
            doc.getString("joinedDate")
        );
    }

    public static User fromJson(String json) {
        if (json == null || json.isBlank()) return null;
        return fromDocument(Document.parse(json));
    }

    public Document toDocument() {
        Document doc = new Document();
        if (id != null) doc.put("id", id);
        if (name != null) doc.put("name", name);
        if (username != null) doc.put("username", username);
        if (email != null) doc.put("email", email);
        if (role != null) doc.put("role", role);
        if (avatar != null) doc.put("avatar", avatar);
        if (joinedDate != null) doc.put("joinedDate", joinedDate);
        return doc;
    }

    public String toJson() {
        return toDocument().toJson();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getJoinedDate() { return joinedDate; }
    public void setJoinedDate(String joinedDate) { this.joinedDate = joinedDate; }
}
