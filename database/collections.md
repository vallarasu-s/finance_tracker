# Finance Tracker Database Schema (`finance_tracker`)

The Finance Tracker backend persists data primarily to **MongoDB Atlas** (`finance_tracker` database) with an automatic offline-first JSON mirror in `backend/data/`.

---

## Collections

### 1. `users`
Stores registered user profiles synced across browser and server.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique user ID (e.g. `ft_default_user`, `usr_1795...`) |
| `name` | `string` | Full display name |
| `username` | `string` | Normalized lowercase handle |
| `email` | `string` | User email address |
| `role` | `string` | Account label (`Primary Account`, `Personal Account`) |
| `avatar` | `string` | 2-letter monogram (`FT`, `AM`) |
| `joinedDate` | `string` | ISO date string (`YYYY-MM-DD`) |
| `updatedAt` | `string` | ISO timestamp of last profile sync |

---

### 2. `transactions`
Stores daily income and expense entries (offline mirror: `backend/data/transactions.json`).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique transaction ID (`tx_...`) |
| `type` | `string` | `"income"` or `"expense"` |
| `amount` | `number` | Monetary amount (double precision) |
| `recipient` | `string` | Merchant, employer, or source name |
| `category` | `string` | Category ID (`salary`, `food`, `transport`, `housing`, etc.) |
| `paymentMethod` | `string` | Payment channel (`cash`, `upi`, `bank`, `card`, `wallet`) |
| `date` | `string` | Date (`YYYY-MM-DD`) |
| `time` | `string` | 24h time (`HH:MM`) |
| `note` | `string` | Optional memo or description |
| `createdAt` | `string` | ISO creation timestamp |
| `updatedAt` | `number\|string` | Last update epoch ms or ISO timestamp |

---

### 3. `goals`
Stores savings targets and deposit/withdrawal history (`backend/data/goals.json`).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique goal ID (`goal_...`) |
| `title` | `string` | Goal name (e.g. `Emergency Rainy Day Fund`) |
| `targetAmount` | `number` | Target savings amount |
| `currentAmount` | `number` | Saved balance so far |
| `targetDate` | `string` | Target completion date (`YYYY-MM-DD`) |
| `category` | `string` | Goal category (`emergency`, `tech`, `travel`, `home`, etc.) |
| `icon` | `string` | Emoji icon |
| `notes` | `string` | Optional notes |
| `history` | `array` | Array of `{ id, amount, type, date, time, note, createdAt }` |

---

### 4. `investments`
Stores portfolio holdings across Mutual Funds, Stocks, FDs, PPF, Gold, Crypto, and Real Estate (`backend/data/investments.json`).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique holding ID (`inv_...`) |
| `name` | `string` | Asset or scheme name |
| `symbol` | `string` | Ticker or folio code (e.g. `PPFC-DIR`, `TCS.NS`) |
| `category` | `string` | Asset class (`mutual_funds`, `stocks`, `fixed_deposits`, `govt_schemes`, `gold`, `crypto`, `real_estate`) |
| `investmentMode` | `string` | `Monthly SIP`, `Lumpsum`, `Fixed Deposit (Term)`, `Govt Scheme` |
| `units` | `number` | Quantity or units held |
| `buyPrice` | `number` | Average purchase NAV/price |
| `currentPrice` | `number` | Current market NAV/price |
| `dividendYield` | `number` | Annual return / yield percentage |
| `interestRate` | `number` | Annual interest rate percentage (FD/PPF/SGB) |
| `date` | `string` | Purchase / SIP start date (`YYYY-MM-DD`) |
| `maturityDate` | `string` | Optional maturity date (`YYYY-MM-DD`) |
| `notes` | `string` | Folio number or strategy notes |

---

### 5. `settings`
Stores global preferences (`id: "user_settings"`, offline mirror: `backend/data/settings.json`).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Constant key `"user_settings"` |
| `currency` | `string` | ISO currency code (`USD`, `INR`, `EUR`, etc.) |
| `currencySymbol` | `string` | Currency symbol (`$`, `₹`, `€`, etc.) |
| `monthlyBudget` | `number` | Monthly spending budget cap |
| `theme` | `string` | `"light"` or `"dark"` |
| `compactNumbers` | `boolean` | Compact notation (`K`, `L`, `c`, `M`, `B`) |
| `numberFormat` | `string` | `"auto"`, `"indian"`, `"international"`, or `"standard"` |
