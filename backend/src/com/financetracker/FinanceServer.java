package com.financetracker;

import com.financetracker.app.FinanceApp;

import java.io.IOException;

/**
 * FinanceServer - Application Entrypoint Forwarder
 * Delegates execution to com.financetracker.app.FinanceApp
 */
public class FinanceServer {
    public static void main(String[] args) throws IOException {
        FinanceApp.main(args);
    }
}
