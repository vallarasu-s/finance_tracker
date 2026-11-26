package com.finance;

import com.finance.dto.LoginRequest;
import com.finance.dto.RegisterRequest;
import com.finance.model.Transaction;
import com.finance.model.User;
import com.finance.service.StorageService;
import org.bson.Document;

import java.util.List;

/**
 * Self-contained smoke test suite verifying backend DTOs, domain models, and JSON parsing.
 * Run with: java -ea -cp "lib/*;out" com.finance.FinanceApplicationTest
 */
public class FinanceApplicationTest {

    public static void main(String[] args) {
        testTransactionModelMapping();
        testUserModelAndDtos();
        testJsonListParsing();
        System.out.println("[PASS] All FinanceApplicationTest checks passed.");
    }

    private static void testTransactionModelMapping() {
        Document doc = new Document()
            .append("id", "tx_test_1")
            .append("type", "income")
            .append("amount", 4500.50)
            .append("category", "salary")
            .append("paymentMethod", "bank")
            .append("date", "2026-11-26");

        Transaction tx = Transaction.fromDocument(doc);
        assert tx != null : "Transaction should parse from Document";
        assert "tx_test_1".equals(tx.getId()) : "ID mismatch";
        assert "income".equals(tx.getType()) : "Type mismatch";
        assert Math.abs(tx.getAmount() - 4500.50) < 0.001 : "Amount mismatch";
        assert "salary".equals(tx.getCategory()) : "Category mismatch";
    }

    private static void testUserModelAndDtos() {
        LoginRequest login = LoginRequest.fromJson("{\"identifier\":\"alex@example.com\",\"password\":\"secret\",\"rememberMe\":true}");
        assert login.isValid() : "LoginRequest should be valid";
        assert "alex@example.com".equals(login.identifier()) : "Login identifier mismatch";

        RegisterRequest register = RegisterRequest.fromJson("{\"name\":\"Alex Morgan\",\"email\":\"alex@example.com\"}");
        assert register.isValid() : "RegisterRequest should be valid";

        User user = new User("usr_1", "Alex Morgan", "alexmorgan", "alex@example.com", "Personal Account", "AM", "2026-11-26");
        User roundTrip = User.fromJson(user.toJson());
        assert roundTrip != null && "Alex Morgan".equals(roundTrip.getName()) : "User JSON round-trip failed";
    }

    private static void testJsonListParsing() {
        String sampleArray = "[{\"id\":\"1\",\"amount\":120},{\"id\":\"2\",\"amount\":250}]";
        List<Document> docs = StorageService.parseDocumentList(sampleArray);
        assert docs.size() == 2 : "Expected 2 documents";
        assert "2".equals(docs.get(1).getString("id")) : "Second document ID mismatch";
    }
}
