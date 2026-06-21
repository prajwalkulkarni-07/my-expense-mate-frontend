

# Prajwal Expense Tracker — Frontend Only

A mobile-first personal expense tracking app using React + TypeScript with local storage for data persistence. No backend or authentication needed.

---

## 1. Layout & Navigation
- **Bottom navigation bar** on mobile with 4 tabs: Dashboard, Transactions, Insights, Settings
- **Sidebar navigation** on desktop/laptop
- **Floating "+" button** on mobile for quick expense entry
- Light and dark mode toggle
- Clean fintech aesthetic: soft shadows, rounded corners, minimal color palette

## 2. Add Expense (Optimized for Speed)
- Fast-entry drawer/sheet triggered by the floating "+" button
- Fields: Amount (large number input), Category (preset + custom), Payment Method (preset list), Date (defaults to today), optional Note, optional Merchant name
- Pre-built categories: Food, Travel, Shopping, Bills, Health, Entertainment, Others
- Payment methods: UPI, Credit Card, Debit Card, Cash, Net Banking, Wallet, Others
- Ability to add custom categories (saved to local storage)
- Instant toast feedback on save, auto-return to dashboard

## 3. Dashboard
- **Summary cards**: Today's spending, This Month, This Year
- **Charts** (using Recharts):
  - Pie chart: spending by category
  - Pie chart: spending by payment method
  - Line chart: daily spending trend (current month)
  - Bar chart: monthly comparison

## 4. Transactions Page
- Scrollable list of all expenses, newest first
- Each item shows: amount, category, merchant, date, payment method
- **Filters**: date range, category dropdown, payment method dropdown
- **Search** by note or merchant name
- Edit and delete actions
- Card layout on mobile, table on desktop

## 5. Insights / Analytics Page
- Highest spending category this month
- Average daily spending
- Biggest single expense
- Smart text summaries (e.g., "You spend most on Food")

## 6. Budget Tracking
- Set monthly budget per category in Settings
- Progress bars on dashboard showing budget usage
- Color warnings: yellow at 80%, red at 100%

## 7. Export to CSV
- Export filtered or all transactions as CSV from Transactions page

## 8. Settings Page
- Dark/light mode toggle
- Manage custom categories
- Set/edit category budgets

## 9. Data Storage
- All data persisted in **localStorage** (expenses, categories, budgets, preferences)
- Seed with demo data on first visit so the app isn't empty
- Data structure ready to migrate to a backend later

