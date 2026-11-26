package com.finance.model;

import org.bson.Document;

/**
 * Transaction domain model representing an income or expense entry.
 */
public class Transaction {
    private String id;
    private String type;
    private double amount;
    private String recipient;
    private String category;
    private String paymentMethod;
    private String date;
    private String time;
    private String note;
    private String createdAt;
    private String updatedAt;

    public Transaction() {}

    public static Transaction fromDocument(Document doc) {
        if (doc == null) return null;
        Transaction tx = new Transaction();
        tx.id = doc.getString("id");
        tx.type = doc.getString("type");
        Object amt = doc.get("amount");
        if (amt instanceof Number n) {
            tx.amount = n.doubleValue();
        } else if (amt != null) {
            try {
                tx.amount = Double.parseDouble(String.valueOf(amt));
            } catch (NumberFormatException ignored) {
                tx.amount = 0.0;
            }
        }
        tx.recipient = doc.getString("recipient");
        tx.category = doc.getString("category");
        tx.paymentMethod = doc.getString("paymentMethod");
        tx.date = doc.getString("date");
        tx.time = doc.getString("time");
        tx.note = doc.getString("note");
        tx.createdAt = doc.getString("createdAt");
        Object updated = doc.get("updatedAt");
        tx.updatedAt = updated != null ? String.valueOf(updated) : null;
        return tx;
    }

    public Document toDocument() {
        Document doc = new Document();
        if (id != null) doc.put("id", id);
        if (type != null) doc.put("type", type);
        doc.put("amount", amount);
        if (recipient != null) doc.put("recipient", recipient);
        if (category != null) doc.put("category", category);
        if (paymentMethod != null) doc.put("paymentMethod", paymentMethod);
        if (date != null) doc.put("date", date);
        if (time != null) doc.put("time", time);
        if (note != null) doc.put("note", note);
        if (createdAt != null) doc.put("createdAt", createdAt);
        if (updatedAt != null) doc.put("updatedAt", updatedAt);
        return doc;
    }

    public String toJson() {
        return toDocument().toJson();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
