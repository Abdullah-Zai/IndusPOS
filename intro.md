# 🏨 Indus Hotel POS — Complete System Guide

> **Indus Hotel POS** is a full-stack, modern, web-based Point-of-Sale and Restaurant Management System purpose-built for Pakistani restaurants and hospitality venues. It runs on Docker, works on any device (mobile, tablet, desktop), and is designed to handle every operational need of a multi-role restaurant team in real time.

---

## 📋 Table of Contents

- [System Overview](#-system-overview)
- [Technology Stack](#-technology-stack)
- [User Roles & Access Control](#-user-roles--access-control)
- [Admin Dashboard](#-admin-dashboard)
- [Waiter / Order Taking](#-waiter--order-taking)
- [Kitchen Display System (KDS)](#-kitchen-display-system-kds)
- [Cashier Terminal](#-cashier-terminal)
- [Restaurant Seating Areas](#-restaurant-seating-areas)
- [Menu Management](#-menu-management)
- [Inventory Stash](#-inventory-stash)
- [Billing & Receipts](#-billing--receipts)
- [Financial Hub & Analytics](#-financial-hub--analytics)
- [System-Wide Validation](#-system-wide-validation)
- [Advantages & Key Benefits](#-advantages--key-benefits)
- [How to Run the System](#-how-to-run-the-system)
- [Default Login Credentials](#-default-login-credentials)

---

## 🌟 System Overview

Indus Hotel POS is an all-in-one digital management platform that replaces paper-based order tracking and manual billing with a streamlined, real-time digital workflow. The system supports the complete restaurant lifecycle:

```
Guest Arrives → Waiter Takes Order → Kitchen Sees It Instantly
    → Food Ready → Served to Table → Cashier Bills → Admin Analyzes
```

Every step is tracked, every role is secured, and every screen is responsive — from a mobile phone to a wide-screen display.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Vanilla CSS, localStorage sync |
| **Backend** | Python FastAPI (async) |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **Authentication** | JWT Bearer Tokens, role-based access |
| **File Storage** | Local uploads with Docker volume mounts |
| **Containerization** | Docker + Docker Compose |
| **Version Control** | Git → GitHub (`Abdullah-Zai/IndusPOS`) |

---

## 👥 User Roles & Access Control

The system supports **4 distinct user roles**, each with carefully enforced permissions:

| Role | Description | Key Restrictions |
|---|---|---|
| **Admin** | Full system control | No restrictions |
| **Waiter** | Takes table orders, tracks food status | Cannot access billing or admin panels |
| **Kitchen** | Views and updates food order statuses | Cannot see financials, billing, or management |
| **Cashier** | Billing, POS, read-only views | Cannot edit/delete records — admin-only actions |

### Role-Based Sidebar Navigation

- **Admin**: Dashboard, Menu, Tables, Users, Billing, Inventory, Financial Hub, Settings
- **Waiter**: Tables Status, Take Order
- **Kitchen**: Kitchen Display System (KDS)
- **Cashier**: Dashboard, Takeaway POS, Settle Bills, Menu List, Tables Status, Inventory Stash, Sales & Ledger

---

## 🖥 Admin Dashboard

The Admin Dashboard provides a real-time at-a-glance overview of the entire restaurant operation:

- **📊 Revenue Cards**: Today's revenue, total bills paid, pending orders
- **📈 Live Sales Stats**: Average order value, total completed transactions
- **🔝 Top Selling Items**: Ranked by revenue generated
- **📋 Recent Transactions**: Last 10+ bills with table numbers and amounts
- **🏃 Active Table Orders**: Live view of all open dining orders
- **📅 Monthly Summary**: Total revenue and order counts for the current month

---

## 🪑 Waiter / Order Taking

Waiters have access to a dedicated POS-style interface for dine-in orders:

### Tables Status View
- Displays all active table orders in a **live card grid**
- Color-coded order status: `Pending` → `In Progress` → `Ready` → `Served`
- Refresh button to pull the latest kitchen updates

### Take New Order (POS Screen)
- **Split-panel layout**: Menu grid on the left, Order cart on the right
- **Category filter tabs** to browse menu by food type
- **Search bar** to quickly find any dish by name or variant
- **Visual Table Selector**: Area tabs (`Family Hall`, `Rooftop`, `Mens Section`, `Main Hall`) + clickable table grid cards showing real-time availability status
- Each table card shows:
  - Table code (e.g., `FH 1`, `RF 2`)
  - Seating capacity (👤 6)
  - Status color: 🟢 Green = Available, 🔴 Red = Occupied, 🟡 Yellow = Reserved
- Orders are sent directly to the **Kitchen Display System** in one click

---

## 🍳 Kitchen Display System (KDS)

The Kitchen screen is a live, auto-refreshing display designed for kitchen staff:

- **Order Cards**: Each card shows the table number, order time, and list of items to prepare
- **Status Controls**: Kitchen staff can mark orders as `In Progress` → `Ready`
- **Auto-Refresh**: Polls every 8 seconds so cooks always see new orders without refreshing manually
- **Priority Sorting**: Oldest orders shown first so nothing goes cold

---

## 💳 Cashier Terminal

The Cashier has two primary workflows:

### 1. Takeaway POS
- Full menu browsing with category and search filters
- Cart management with item quantities
- Quick-order submission for takeaway customers
- No table required — takeaway flow is direct

### 2. Settle Bills (Dine-In Billing)
- Lists all active table orders awaiting payment
- Supports **Discount %** and **Tax %** adjustments per bill
- Shows itemized order breakdown before confirming payment
- Payment methods: Cash, Card, or Digital Wallet
- After payment, generates a **printable receipt** with:
  - Restaurant name and bill number
  - Table, date, time
  - All items, quantities, prices
  - Subtotal, discount, tax, and grand total
- Option to **Print Receipt** or **Save Only**

### Cashier Read-Only Modules
Cashiers can also browse (but not modify):
- **Menu List**: View all food items, categories, prices, and availability
- **Tables Status**: See seating layout and occupancy per area
- **Inventory Stash**: View and **add** stock logs (cannot edit or delete)
- **Sales & Ledger**: View daily/monthly sales charts and profit summaries

---

## 🏠 Restaurant Seating Areas

The system manages 4 distinct seating zones, each with unique table codes:

| Area | Code Prefix | Example Tables |
|---|---|---|
| Family Hall | `FH` | FH 1, FH 2, FH 3 |
| Rooftop | `RF` | RF 1, RF 2, RF 3 |
| Mens Section | `MS` | MS 1, MS 2 |
| Main Hall | `G` | G 1, G 2 |

### Admin Table Management Features
- Add tables with a custom name, area, and seating capacity (1–50 guests)
- Edit any table's details at any time
- Toggle tables between **Active** and **Disabled** states
- Mark tables as **Available**, **Occupied**, or **Reserved**
- Filter table grid by seating area
- Changes sync immediately to the waiter POS

---

## 🍽️ Menu Management

The admin can manage the restaurant's full digital menu:

- **Categories**: Create named food categories (e.g., Grills, Karahi, Beverages, Desserts)
- **Menu Items**: Each item has:
  - Name and Category
  - Optional Variant (e.g., Half, Full, 4 pcs)
  - Price in PKR (Rs.)
  - Dish image (upload from disk)
  - Availability toggle (Available / Out of Stock)
- **Category Filter Tabs**: Browse items by category
- **Search**: Find any item by name or variant instantly
- **Edit & Delete** controls (Admin only)

---

## 📦 Inventory Stash

Track all raw materials and stock purchases for the restaurant storeroom:

- Log stock batches with:
  - Product name and category (Dry Ingredients, Meat & Poultry, Vegetables, etc.)
  - Quantity + unit (kg, litre, pack, etc.)
  - Purchase price (Rs.)
  - Purchase date
  - Optional description/notes
- **Monthly Expense Tracking**: Filter by month to see total spending
- **Category Filter**: View stock by ingredient type
- **Search**: Find any product instantly
- **Profit Insight**: Cross-reference inventory costs with sales revenue to calculate net profit
- **Role Restriction**: Cashiers can add new stock entries but cannot edit or delete existing ones

---

## 🧾 Billing & Receipts

The billing module provides a complete payment workflow:

- **Pending Orders Queue**: Lists all dine-in orders ready for billing
- **Bill Preview Modal**: Full itemized breakdown before payment
- **Adjustments**:
  - Discount percentage (e.g., 10% off)
  - Tax percentage (e.g., 5% GST)
- **Grand Total Calculation**: Automatic and real-time
- **Multiple Payment Methods**: Cash, Card, Digital Wallet
- **Receipt Options**:
  - 🖨️ Print thermal/browser receipt
  - 💾 Save to records without printing
- **Billing History**: View all past bills with date, table, items, and amount

---

## 💰 Financial Hub & Analytics

The Financial Hub is the nerve centre for the restaurant's financial health:

### Sales Analytics Tab
- Total gross revenue (all time and filtered by date range)
- Total orders settled
- Average order value
- Top-selling items by revenue
- Recent bills list

### Monthly Profit & Loss Tab
- Month-by-month breakdown of:
  - 📈 Total Sales Revenue
  - 💸 Operating Costs (utilities, rent, miscellaneous)
  - 👔 Payroll (staff salaries)
  - 📊 Net Profit = Revenue − (Operating + Payroll)
- Trend view across multiple months

### Operating Costs & Payroll Tab *(Admin Only)*
- Log and track recurring expenses (electricity, gas, rent, etc.)
- Log staff salary disbursements per month
- Categorized expense tracking
- Historical records for auditing

> **Note**: The Operating Costs & Payroll tab is hidden from Cashiers to protect sensitive payroll data.

---

## 🔒 System-Wide Validation

Every form in the system enforces strict client-side validation before any data is saved:

| Form | Validation Rules Applied |
|---|---|
| Add/Edit Table | Name ≥ 2 chars, capacity 1–50, no duplicate names |
| Add Menu Item | Name required, price > Rs. 0 and ≤ Rs. 99,999, category required |
| Add Inventory Stock | Qty > 0, price > 0, date required, name ≥ 2 chars |
| Take Order (Waiter) | Table must be selected, cart must not be empty, total > Rs. 0 |
| Cashier Shift Open | Float amount required before shift starts |
| Operating Expenses | Amount > 0, date required, category required |
| User Management | Role must be selected, username and password required |

All validation messages are shown with clear ⚠️ alerts so users know exactly what to fix.

---

## ✨ Advantages & Key Benefits

### 1. 🚀 Zero Paper — Fully Digital
Eliminates paper order slips, manual KOT books, and handwritten bills. All records are stored digitally and instantly accessible from any device.

### 2. 📱 Works on Any Device
Fully responsive design adapts from a small mobile screen to a full desktop monitor — no app installation required. Runs in any modern browser.

### 3. 🔄 Real-Time Kitchen Updates
Orders appear on the Kitchen Display System the moment a waiter submits them. The kitchen auto-refreshes every 8 seconds, so no order is ever missed or delayed.

### 4. 👥 Multi-Role Security
Every user role is strictly scoped. Cashiers cannot modify admin data. Waiters cannot access financials. This prevents unauthorized changes and protects sensitive information.

### 5. 💡 Smart Table Management
The visual seating grid with area tabs and color-coded availability makes it effortless for waiters to select tables and for admins to monitor restaurant occupancy at a glance.

### 6. 📊 Powerful Financial Reporting
Built-in monthly profit & loss reports, sales analytics, and inventory cost tracking give restaurant owners a complete financial picture without needing external spreadsheets.

### 7. 🏷️ Shorthand Table Codes
Table codes like `FH 1`, `RF 2`, `MS 1`, and `G 2` are compact and clear. Staff can communicate table locations quickly and unambiguously.

### 8. 🧾 Professional Receipts
Customers receive clean, detailed printed receipts that include restaurant branding, itemized orders, discounts, taxes, and grand totals — raising the dining experience.

### 9. 📦 Integrated Inventory → Profit Tracking
By logging stock purchases against sales revenue, owners can directly calculate net profit margins and identify high-cost or low-margin areas of the business.

### 10. 🐳 Easy Deployment with Docker
The entire application — frontend, backend, and database — runs with a single command (`docker compose up --build`). No complex server setup required.

### 11. 🌐 Open Source & Version Controlled
All code is pushed to GitHub, enabling easy backups, rollbacks, team collaboration, and future upgrades.

### 12. ⚡ Fast & Reliable
Built with React (Vite) for lightning-fast page loads and FastAPI on the backend for high-performance async API responses.

---

## 🚀 How to Run the System

### Prerequisites
- Docker Desktop installed and running

### Start the System
```bash
# Clone the repository
git clone https://github.com/Abdullah-Zai/IndusPOS.git
cd IndusPOS

# Start all services (frontend + backend + database)
docker compose up --build

# The system will be available at:
# http://localhost:3000
```

### Stop the System
```bash
docker compose down
```

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Waiter | `waiter` | `waiter123` |
| Kitchen | `kitchen` | `kitchen123` |
| Cashier | `cashier` | `cashier123` |

> ⚠️ **Security Note**: Change all default passwords immediately before deploying to a production environment.

---

## 📁 Project Structure

```
IndusPOS/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point & API routes registration
│   ├── models.py             # SQLAlchemy database models
│   ├── database.py           # Database connection & session management
│   ├── seed.py               # Default data seeder (users, menu items)
│   ├── routers/              # API route modules
│   │   ├── auth_router.py    # Login / JWT token issuance
│   │   ├── menu_router.py    # Menu items & categories CRUD
│   │   ├── orders_router.py  # Dine-in & takeaway orders
│   │   ├── billing_router.py # Bill settlement & receipt generation
│   │   ├── reports_router.py # Sales summaries & analytics
│   │   └── users_router.py   # User management
│   └── Dockerfile            # Backend Docker image definition
│
├── frontend/                 # React Vite frontend
│   ├── src/
│   │   ├── App.jsx           # Main routing & role-based view rendering
│   │   ├── index.css         # Global design system & responsive styles
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # JWT token management & auth state
│   │   │   └── ThemeContext.jsx # Light/dark mode toggle
│   │   ├── components/
│   │   │   ├── Sidebar.jsx   # Role-aware navigation sidebar
│   │   │   ├── Navbar.jsx    # Top bar with user profile & theme toggle
│   │   │   ├── Modal.jsx     # Reusable modal component
│   │   │   └── OrderCard.jsx # Kitchen & waiter order status card
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── admin/        # AdminDashboard, MenuManager, TablesManager,
│   │       │                 # Billing, FinancialHub, InventoryManager,
│   │       │                 # UsersManager, Settings
│   │       ├── waiter/       # WaiterDashboard, NewOrder
│   │       ├── kitchen/      # KitchenDashboard
│   │       └── cashier/      # CashierDashboard, Pos
│   └── Dockerfile            # Frontend Docker image definition
│
├── docker-compose.yml        # Orchestrates all services
├── progress.md               # Development changelog
└── intro.md                  # This document — system overview & guide
```

---

## 🤝 Contributing & Support

This project is maintained by **Abdullah Zai** and hosted at:
📦 **GitHub**: [https://github.com/Abdullah-Zai/IndusPOS](https://github.com/Abdullah-Zai/IndusPOS)

For any bug reports, feature requests, or questions, please open an issue on the GitHub repository.

---

*Built with ❤️ for Indus Hotel — delivering a premium dining management experience.*
