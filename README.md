# Finance Tracker — Offline-First Full-Stack Personal Finance App

A personal finance tracker web application with a **React frontend** and a **Java 21 backend**. Built with an **offline-first architecture**, it persists all data locally in the browser immediately and synchronizes with the Java backend whenever an online link is active.

---

## Key Features

1. **Daily Expense & Income Tracking**:
   - Quick-add modal with segmented type toggle (Income / Expense).
   - Category picker with vivid icons and colors (Food, Transport, Groceries, Housing, Salary, Freelance, etc.).
   - Payment method tagging (Cash, Credit/Debit Card, Bank Transfer / UPI, Digital Wallet).
   - Grouped daily timeline showing day-by-day inflow, outflow, and net daily balance.
   - Quick date filters: Today, Yesterday, Last 7 Days, This Month, or All Time.
   - Live search by note, merchant, category, or amount.
   - Edit, duplicate, and delete actions.

2. **Financial Goals ("Financely Gole") Tracker**:
   - Create custom savings targets (Emergency Fund, New Laptop, Vacation, Car, Wealth, etc.).
   - Circular progress rings showing percentage achieved.
   - Remaining amount and target completion date.
   - Automated projected daily and monthly savings pace needed to reach the goal on time!
   - Quick "+ Deposit" and "- Withdraw" modal with preset amounts (+25, +50, +100, +250, +500).
   - Milestone celebration: Particle confetti animation triggers when a goal reaches 100%!

3. **100% Offline-First Durability & Future Online Sync**:
   - Operates completely without internet connection using browser storage.
   - Full bidirectional synchronization with the Java 21 REST backend (`/api/sync`).
   - Online / Offline badge indicator with real-time health checks.
   - One-click "Sync Now" button to merge offline changes with the server.
   - Complete Data Backup: Export to `.json` snapshot, restore from `.json`, and export to `.csv` for Excel & Google Sheets.
   - One-click "Load Sample Data" button to test with realistic multi-day records.

4. **Analytics & Budget Health**:
   - Zero-dependency responsive SVG Bar Chart for Daily Income vs Expense comparison.
   - Category spending breakdown with multi-color segmented progress and percentage distribution.
   - Monthly budget tracker with automated visual warning alerts at 80% and over-budget thresholds.

5. **Fintech Design & Aesthetics**:
   - Curated typography (*Plus Jakarta Sans* and *JetBrains Mono* for tabular numbers).
   - Dark mode & Light mode toggle with local persistence.
   - Multi-currency selector ($, €, £, ₹, ¥, C$, A$).
   - Keyboard shortcuts:
     - `N` — New transaction modal
     - `G` — New financial goal modal
     - `Esc` — Close any open modal

---

## Project Structure

```
Finance_tracker/
│
├── frontend/                            # React 19 + Vite Application
│   ├── public/                          # Static assets, vite.svg, PWA manifest
│   ├── src/
│   │   ├── assets/                      # Images, icons, logos
│   │   ├── components/                  # Reusable UI (Navbar, Sidebar, Footer, ExpenseCard, IncomeCard, Modals)
│   │   ├── pages/                       # Workspace & auth pages (Dashboard, Transactions, Reports, Goals, Investing, Login, Register, AddExpense, AddIncome, Profile)
│   │   ├── services/                    # Backend API & persistence (api.js, authService.js, transactionService.js, storage.js)
│   │   ├── context/                     # Global state management (AuthContext.jsx)
│   │   ├── hooks/                       # Custom React hooks (useTabSwipe.js, useTheme.js)
│   │   ├── utils/                       # Helper functions (formatCurrency.js)
│   │   ├── styles/                      # Theme tokens & responsive CSS
│   │   ├── App.jsx                      # Main app coordinator
│   │   ├── main.jsx                     # React entrypoint
│   │   └── App.css
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── backend/                             # Java 21 REST API & MongoDB Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/finance/
│   │   │   │   ├── config/              # SecurityConfig.java
│   │   │   │   ├── controller/          # AuthController, TransactionController, DashboardController, Goal/Investment/Sync/Settings/Health Controllers
│   │   │   │   ├── service/             # AuthService, TransactionService, DashboardService, FinanceService, MongoDBService, StorageService
│   │   │   │   ├── repository/          # UserRepository, TransactionRepository
│   │   │   │   ├── model/               # User, Transaction
│   │   │   │   ├── dto/                 # LoginRequest, RegisterRequest
│   │   │   │   ├── exception/           # GlobalExceptionHandler
│   │   │   │   └── FinanceApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/com/finance/        # FinanceApplicationTest.java
│   ├── data/                            # Local JSON fallback storage
│   ├── lib/                             # MongoDB Java driver JARs
│   ├── pom.xml                          # Maven project metadata
│   ├── run.bat                          # One-click javac compile & run launcher
│   └── .gitignore
│
├── database/                            # Database documentation & seed data
│   ├── collections.md
│   └── sample-data.json
│
├── start-all.bat                        # Launch BOTH frontend & backend
├── start-frontend.bat                   # Launch frontend on http://localhost:3000
├── start-backend.bat                    # Launch backend on http://localhost:8080
├── package.json                         # Root workspace scripts
├── README.md
└── .gitignore
```

---

## How to Run

### Option A: One-Click Startup (Windows)
Double-click any of the launcher files in the root folder:
- **`start-all.bat`**: Starts both the Java backend (port 8080) and React frontend (port 3000) simultaneously in separate command windows.
- **`start-frontend.bat`**: Starts only the React frontend on `http://localhost:3000`.
- **`start-backend.bat`**: Compiles and runs only the Java backend on `http://localhost:8080`.

### Option B: Command Line (npm)
From the root folder:
```bash
# Start frontend
npm run dev

# Start backend
npm run backend

# Build frontend for production
npm run build
```

Or from inside the `frontend/` directory:
```bash
cd frontend
npm run dev
```

### 3. Running 100% Offline
Even if the Java backend is not running or there is no internet connection, the app runs offline:
- Every transaction and goal is saved instantly in your browser.
- When you start the Java server later, simply click the **Sync** button in the top navbar to synchronize your offline changes.
