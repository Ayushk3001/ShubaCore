# Product Requirements Document (PRD)

# Custom Return Gift --- Internal Business Management System

**Version:** 1.0\
**Date:** August 2026\
**Status:** MVP Planning

## 1. Executive Summary

Build a secure internal web application for a three-partner customizable
return-gift business.

Customers currently place enquiries and orders manually through WhatsApp
and Instagram. The MVP will not replace those channels. The internal
application becomes the single source of truth for leads, customers,
orders, customization requirements, payments, expenses, partner
transactions, inventory, suppliers, deadlines, profitability, reports,
and audit history.

### Technology

-   Next.js + TypeScript
-   Clerk for authentication
-   PostgreSQL as the source of truth
-   Prisma ORM for database access
-   Zod for server-side validation

## 2. Problem Statement

The business currently receives orders through WhatsApp and Instagram,
making it difficult to centrally track enquiries, customization details,
payments, deadlines, partner ownership, expenses, and profitability.

## 3. Product Goal

Create a secure internal business-management system that manages the
complete operational and financial lifecycle of an order.

**Core workflow:**

WhatsApp / Instagram → Lead → Quote → Confirmed Order → Advance Payment
→ Designing → Production → Ready → Delivered → Final Payment → Completed

## 4. Goals

-   Centralize customer and order information.
-   Track enquiries from WhatsApp and Instagram.
-   Convert successful leads into orders.
-   Track order status from enquiry to completion.
-   Track advance and final payments.
-   Track income and expenses.
-   Track partner investments, withdrawals, reimbursements, and business
    expenses.
-   Calculate order-level profitability.
-   Provide a business dashboard.
-   Maintain an audit trail for sensitive operations.
-   Provide secure authentication and authorization.
-   Keep PostgreSQL as the single source of truth.

## 5. Non-Goals for MVP

-   Public ecommerce storefront
-   Customer login
-   Online checkout
-   Payment gateway
-   Direct WhatsApp API integration
-   Direct Instagram API integration
-   Automated customer messaging
-   Complex accounting/tax software
-   Automatic profit distribution
-   Advanced AI features

## 6. Users and Roles

### Partner

All three partners have full internal-system access.

### Staff --- Future

Staff may manage operational tasks but should not automatically have
access to partner withdrawals, investments, or sensitive financial
configuration.

Roles:

-   `PARTNER`
-   `STAFF`

For MVP, all three partners are `PARTNER`.

## 7. Authentication

Use **Clerk** for authentication.

Do not implement custom authentication or password storage.

Clerk handles authentication, password management, sessions, email
verification, and MFA where enabled.

PostgreSQL must never store user passwords.

## 8. User Identity Architecture

Authentication identity belongs to Clerk. Business identity belongs to
PostgreSQL.

The Prisma `User` model must contain a unique `clerkUserId`.

Example:

``` text
Clerk
  |
  | clerkUserId
  v
Prisma User
  |
  +-- name
  +-- email
  +-- role
  +-- business information
```

## 9. Authorization

Authorization must be enforced server-side.

Do not rely on hidden buttons or frontend role checks.

Every protected operation must verify:

1.  User authentication
2.  Required role
3.  Resource-level authorization where applicable

Recommended helpers:

-   `requireUser()`
-   `requirePartner()`
-   `requireRole()`

## 10. Security Requirements

-   Use Clerk for authentication.
-   Never store passwords in PostgreSQL.
-   Never store authentication tokens in localStorage.
-   Protect all internal routes.
-   Use least-privilege authorization.
-   Validate all mutations server-side with Zod.
-   Keep Prisma/database access server-side.
-   Never expose `DATABASE_URL` to the browser.
-   Store secrets only in environment variables/secret management.
-   Use HTTPS in production.
-   Use Decimal/NUMERIC for money.
-   Use transactions for multi-record financial operations.
-   Do not silently overwrite important financial history.
-   Audit sensitive financial and permission changes.
-   Restrict file uploads by size/type/authorization.
-   Prefer object storage for uploaded files.
-   Back up PostgreSQL and test restoration.
-   Apply rate limiting/brute-force protection to
    authentication-sensitive operations.

## 11. Core Business Workflow

``` text
WhatsApp / Instagram
        |
        v
      Lead
        |
        v
     Quotation
        |
        v
 Customer Confirms
        |
        v
      Order
        |
        v
 Advance Payment
        |
        v
    Designing
        |
        v
    Production
        |
        v
      Ready
        |
        v
    Delivered
        |
        v
 Final Payment
        |
        v
    Completed
```

## 12. Lead Management

A lead represents a customer enquiry before it becomes a confirmed
order.

Fields:

-   Lead ID
-   Customer
-   Source
-   Stage
-   Event type
-   Event date
-   Estimated quantity
-   Estimated budget
-   Quote amount
-   Assigned partner
-   Requirements
-   Notes
-   Reference images/files
-   Created date
-   Updated date

Sources:

-   `WHATSAPP`
-   `INSTAGRAM`
-   `OTHER`

Stages:

-   `NEW`
-   `CONTACTED`
-   `QUOTED`
-   `NEGOTIATION`
-   `WON`
-   `LOST`

## 13. Lead Conversion

A `WON` lead can be converted into an order.

When converting:

-   Reuse the existing customer.
-   Preserve relevant lead information.
-   Generate a unique Order ID.
-   Preserve the assigned partner.
-   Preserve customization information.
-   Avoid duplicate customer records.

Example:

``` text
LEAD-2026-0018
      |
      v
ORD-2026-0042
```

## 14. Customer Management

Customer fields:

-   Customer ID
-   Name
-   Phone
-   Email
-   Notes
-   Created date
-   Updated date

Features:

-   Create
-   Edit
-   Search
-   View
-   Order history
-   Outstanding payments
-   Previous events/orders

## 15. Order Management

Orders are the central operational entity.

Fields:

-   Order ID
-   Order number
-   Customer
-   Source
-   Assigned partner
-   Event type
-   Event date
-   Delivery date
-   Status
-   Subtotal
-   Discount
-   Total
-   Advance paid
-   Balance
-   Delivery address
-   Notes
-   Created date
-   Updated date

Statuses:

-   `NEW`
-   `QUOTED`
-   `CONFIRMED`
-   `ADVANCE_PAID`
-   `DESIGNING`
-   `PRODUCTION`
-   `READY`
-   `DELIVERED`
-   `COMPLETED`
-   `CANCELLED`

Status transitions should be controlled by business rules.

## 16. Order Items

An order may contain one or more products/items.

Fields:

-   Order item ID
-   Order ID
-   Product ID (optional in MVP)
-   Description
-   Quantity
-   Unit price
-   Customization details

## 17. Customization and Files

An order can contain:

-   Theme
-   Customer name/message
-   Colors
-   Design requirements
-   Special instructions
-   Reference images
-   Approved designs
-   Other documents

File metadata should be stored in PostgreSQL while actual files should
preferably use object storage.

## 18. Payments

Payment types:

-   `ADVANCE`
-   `PARTIAL`
-   `FINAL`
-   `REFUND`

Payment methods:

-   `UPI`
-   `BANK_TRANSFER`
-   `CASH`
-   `OTHER`

Fields:

-   Payment ID
-   Order ID
-   Amount
-   Type
-   Method
-   Reference
-   Received by
-   Payment date
-   Notes

Balance:

`Balance = Order Total - Valid Payments`

## 19. Finance

Finance contains:

-   Income
-   Expenses
-   Payments
-   Profit/Loss

Expense categories:

-   `MATERIALS`
-   `PACKAGING`
-   `PRINTING`
-   `DELIVERY`
-   `MARKETING`
-   `SOFTWARE`
-   `EQUIPMENT`
-   `SUPPLIER_PAYMENT`
-   `MISCELLANEOUS`

Expense fields:

-   Expense ID
-   Category
-   Amount
-   Description
-   Order (optional)
-   Supplier (optional)
-   Paid by
-   Payment method
-   Expense date
-   Created by
-   Created at

## 20. Order-Level Profitability

Example:

``` text
Order Total          ₹8,000
Product Cost         ₹3,000
Packaging              ₹400
Printing               ₹500
Delivery               ₹200
                     -------
Total Cost           ₹4,100
Order Profit         ₹3,900
```

The cost-inclusion rule must be clearly defined and consistently
applied.

## 21. Partner Management

Track for each of the three partners:

-   Initial investment
-   Additional investment
-   Business expenses paid personally
-   Reimbursement
-   Withdrawal
-   Other approved partner transactions

Do not automatically calculate profit distribution until the partners
define the exact ownership/distribution rule.

## 22. Inventory --- Phase 2

Track:

-   Product/material
-   SKU
-   Unit
-   Current stock
-   Minimum stock
-   Purchase cost
-   Supplier
-   Active/inactive state

Stock movements:

-   `PURCHASE`
-   `SALE/CONSUMPTION`
-   `ADJUSTMENT`
-   `RETURN`

## 23. Suppliers and Purchases --- Phase 2

Supplier fields:

-   Supplier ID
-   Name
-   Phone
-   Email
-   Notes

Purchase fields:

-   Purchase ID
-   Supplier
-   Total
-   Paid amount
-   Outstanding amount
-   Status
-   Purchase date
-   Created by

Purchase items:

-   Product
-   Quantity
-   Unit cost
-   Total

## 24. Calendar --- Phase 2

Show:

-   Event dates
-   Delivery dates
-   Upcoming deadlines
-   Overdue orders
-   Orders by partner
-   Orders by status

## 25. Dashboard

The dashboard must use real PostgreSQL data.

Metrics:

-   Total sales
-   Total expenses
-   Net profit
-   Active orders
-   Completed orders
-   Pending payments
-   Upcoming deliveries
-   Low stock
-   Recent orders
-   Recent financial transactions

Filters:

-   Today
-   This Week
-   This Month
-   Custom Range

## 26. Reports

MVP reports:

### Sales

-   Revenue by date
-   Revenue by order
-   Revenue by partner
-   Revenue by source

### Expenses

-   Expenses by date
-   Expenses by category
-   Expenses by order
-   Expenses by partner

### Orders

-   Total orders
-   Completed
-   Pending
-   Cancelled
-   Orders by source

### Profit

-   Revenue
-   Expenses
-   Profit
-   Profit margin

## 27. Audit Logging

Sensitive actions must create audit records.

Examples:

``` text
Partner 1
created
Order ORD-2026-0042
```

``` text
Partner 2
changed Order status
DESIGNING → PRODUCTION
```

Audit fields:

-   Actor
-   Action
-   Entity type
-   Entity ID
-   Metadata
-   Timestamp

Financial records should not be silently deleted.

## 28. Database Architecture

Use:

**PostgreSQL + Prisma ORM**

MVP entities:

-   `User`
-   `Customer`
-   `Lead`
-   `Order`
-   `OrderItem`
-   `Payment`
-   `Expense`
-   `PartnerTransaction`
-   `AuditLog`

Phase 2:

-   `Product`
-   `StockMovement`
-   `Supplier`
-   `Purchase`
-   `PurchaseItem`
-   `OrderFile`

## 29. Database Rules

-   Money must use Decimal/NUMERIC.
-   Order numbers must be unique.
-   Clerk user IDs must be unique.
-   Use foreign keys for relational integrity.
-   Use appropriate indexes.
-   Avoid destructive cascades for financial records.
-   Use transactions for multi-record financial operations.
-   Preserve financial history.

## 30. Recommended Indexes

Consider indexes for:

``` text
Customer.phone
Customer.name

Lead.source
Lead.stage
Lead.assignedPartnerId
Lead.eventDate

Order.orderNumber
Order.status
Order.customerId
Order.assignedPartnerId
Order.eventDate
Order.deliveryDate

Payment.orderId
Payment.paidAt

Expense.orderId
Expense.expenseDate
Expense.category

AuditLog.actorId
AuditLog.entityType
AuditLog.entityId
AuditLog.createdAt
```

## 31. Application Architecture

``` text
Browser
   |
   v
Next.js UI
   |
   +---- Clerk Authentication
   |
   +---- Server Authorization
   |
   +---- Zod Validation
   |
   v
Business Logic
   |
   v
Prisma
   |
   v
PostgreSQL
```

Database access must remain server-side.

## 32. Suggested Project Structure

``` text
return-gift-manager/
│
├── docs/
│   └── PRD.md
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── leads/
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   ├── finance/
│   │   │   ├── partners/
│   │   │   ├── inventory/
│   │   │   └── reports/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── finance/
│   │   └── customers/
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   └── validations/
│   │
│   └── server/
│       ├── orders/
│       ├── finance/
│       └── customers/
│
├── public/
├── .env.local
├── .gitignore
├── package.json
└── README.md
```

## 33. UI/UX Requirements

-   Professional internal SaaS interface
-   Responsive desktop-first design
-   Usable on mobile
-   Clean navigation
-   Fast search
-   Filtering
-   Pagination
-   Sorting
-   Clear status badges
-   Confirmation dialogs for sensitive actions
-   Loading states
-   Error states
-   Empty states
-   Accessible forms
-   Avoid excessive animations
-   Avoid unnecessary visual complexity
-   Do not use fake production statistics

## 34. Main Navigation

``` text
Dashboard
Leads
Customers
Orders
Calendar
Finance
Partners
Inventory
Purchases & Suppliers
Reports
Settings
```

## 35. MVP Scope

1.  Clerk authentication
2.  Server-side authorization
3.  PostgreSQL
4.  Prisma ORM
5.  Database schema
6.  Dashboard
7.  Customer management
8.  Lead management
9.  Order management
10. Order status workflow
11. Payment tracking
12. Income/expense management
13. Partner transactions
14. Basic profit/loss reporting
15. Audit logging
16. Responsive UI

## 36. Phase 2

-   Inventory
-   Stock movements
-   Suppliers
-   Purchases
-   Order calendar
-   Low-stock alerts
-   Payment reminders
-   File/image storage
-   CSV/PDF reports
-   More granular staff permissions

## 37. Phase 3

-   Official WhatsApp integration where appropriate
-   Instagram integration where appropriate
-   Customer-facing product catalog
-   Customer enquiry form
-   Customer accounts
-   Online payments
-   Automated customer notifications
-   Advanced analytics
-   Forecasting

## 38. Acceptance Criteria

The MVP is successful when:

1.  A partner can securely sign in using Clerk.
2.  Unauthenticated users cannot access internal pages.
3.  Server-side authorization protects sensitive operations.
4.  A WhatsApp/Instagram enquiry can be recorded as a lead.
5.  A lead can be converted into an order.
6.  Every order receives a unique Order ID.
7.  Order status can be tracked from confirmation to completion.
8.  Advance and final payments can be recorded.
9.  Outstanding balance is calculated correctly.
10. Income and expenses can be recorded.
11. Partner investments and withdrawals are separately traceable.
12. Dashboard metrics use real database data.
13. Order profitability can be calculated.
14. Sensitive financial actions create audit records.
15. Database credentials are never exposed to the client.
16. Prisma is the database access layer.
17. Financial values use Decimal/NUMERIC.
18. Production build succeeds.
19. TypeScript checks succeed.
20. Core business workflows can be completed without manual database
    editing.

## 39. Development Strategy for Codex

Do not ask Codex to implement the entire PRD in one step.

Recommended sequence:

``` text
1. Project setup
2. Git
3. PRD
4. Dependencies
5. PostgreSQL
6. Prisma configuration
7. Prisma schema
8. Clerk authentication
9. Authorization
10. Application shell
11. Customers
12. Leads
13. Orders
14. Payments
15. Expenses
16. Partners
17. Dashboard
18. Reports
19. Audit logs
20. Security review
21. Testing
22. MVP deployment
```

After every meaningful feature:

``` text
Implement
→ Test
→ Review
→ Commit
→ Continue
```

## 40. Git Strategy

Use small, meaningful commits:

``` text
chore: initialize project
feat: configure prisma
feat: add database schema
feat: integrate clerk authentication
feat: add authorization helpers
feat: add application shell
feat: add customer management
feat: add lead management
feat: add order management
feat: add payment tracking
feat: add expense tracking
feat: add partner transactions
feat: add dashboard
feat: add audit logging
fix: correct order payment calculation
```

## 41. Critical Development Rule

Business rules must be enforced on the server, not only in the UI.

The required flow is:

``` text
Authentication
    ↓
Authorization
    ↓
Validation
    ↓
Business Rules
    ↓
Database Transaction
```

## 42. MVP Success Scenario

``` text
Customer sends WhatsApp message
          |
          v
Partner opens dashboard
          |
          v
Creates Lead
          |
          v
Enters quote
          |
          v
Customer confirms
          |
          v
Lead → Order
          |
          v
ORD-2026-0042 created
          |
          v
₹3,000 advance recorded
          |
          v
Designing
          |
          v
Production
          |
          v
Ready
          |
          v
Delivered
          |
          v
₹5,000 final payment
          |
          v
Completed
          |
          v
Revenue and costs calculated
          |
          v
Order profit displayed
```

## 43. Final Product Vision

The MVP is an internal operational and financial system.

The long-term architecture should allow a future customer-facing website
to reuse the existing Customer, Product, Lead, Order, Payment, and
Inventory domain models.

``` text
                  CUSTOMER
                     |
          ┌──────────┴──────────┐
          |                     |
       WhatsApp              Website
          |                     |
          └──────────┬──────────┘
                     |
                     v
               INTERNAL SYSTEM
                     |
        ┌────────────┼────────────┐
        |            |            |
      Orders       Finance     Inventory
        |            |            |
        └────────────┼────────────┘
                     |
                  PostgreSQL
```
