package com.finance.repository;

import com.finance.service.MongoDBService;
import com.finance.service.StorageService;

/**
 * UserRepository - Unified data-access layer for User profiles
 * across MongoDB Atlas (primary) and local JSON fallback.
 */
public class UserRepository {
    private final MongoDBService mongoService;
    private final StorageService storageService;

    public UserRepository(MongoDBService mongoService, StorageService storageService) {
        this.mongoService = mongoService;
        this.storageService = storageService;
    }

    public String findById(String userId) {
        if (mongoService.isConnected()) {
            String userJson = mongoService.getUser(userId);
            if (userJson != null) {
                return userJson;
            }
        }
        return storageService.readUser(userId);
    }

    public boolean save(String userJson) {
        boolean cloudSaved = false;
        if (mongoService.isConnected()) {
            cloudSaved = mongoService.saveUser(userJson);
        }
        storageService.writeUser(userJson);
        return cloudSaved;
    }
}
