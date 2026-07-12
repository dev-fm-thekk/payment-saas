# Frontend Requirement & API Documentation

## Overview
This document outlines the frontend requirements and API specifications for the Payment Gateway SDK dashboard. The system allows users to manage companies, services (projects), and configure payment providers (e.g., Stripe, Razorpay) to process payments securely.

## 1. Application Structure & Recommended Pages

Based on the backend architecture, the frontend should include the following views:

- **Authentication Module**
  - **Login Page:** Standard email/password login.
  - **Registration Page:** Sign up a new user.

- **Dashboard / Home**
  - High-level overview of user's companies and quick links.

- **Company Management**
  - **Company List:** Display all companies owned by the authenticated user.
  - **Create/Edit Company Modal/Page:** Form to manage company details.

- **Service Management (Per Company)**
  - **Service List:** Display all services (projects/apps) under a selected company.
  - **Create/Edit Service Modal/Page:** Manage service name and base currency.

- **Provider Configuration (Per Service)**
  - **Provider Settings:** Add or update payment provider credentials (e.g., Stripe Secret Key, Razorpay Keys) for a specific service.

- **Transactions & API Keys**
  - View list of transactions (payments, refunds) for a service.
  - *Note: Payment APIs are authenticated via API Key (`req.companyId`), typically requiring an API Key management section on the frontend.*

---

## 2. Authentication Strategy

- **Tokens:** The API uses Access Tokens and Refresh Tokens.
- **Storage:** 
  - `accessToken` should be stored in memory or local storage and sent in the `Authorization: Bearer <token>` header for protected routes.
  - `refreshToken` is automatically set as an `httpOnly`, `secure` cookie by the backend, but can also be passed via the `x-refresh-token` header or request body.
- **Error Handling:** If a protected route returns a `401 Unauthorized` or `403 Forbidden`, the frontend should attempt to call `/auth/refresh` to get a new `accessToken`. If that fails, redirect to Login.

---

## 3. API Documentation

### 3.1 Authentication (`/auth`)

#### Login
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Success Response (200 OK):**
  ```typescript
  {
    status: "success",
    accessToken: string,
    refreshToken: string, // Also set as an httpOnly cookie
    user: {
      id: string,
      email: string,
      name: string,
      role: string,
      // ...
    }
  }
  ```

#### Logout
- **Endpoint:** `POST /auth/logout`
- **Auth Required:** No (Requires refresh token via cookie or header)
- **Success Response (200 OK):** Clears the refresh token cookie.
  ```typescript
  {
    status: "success",
    message: "Logged out successfully"
  }
  ```

#### Refresh Token
- **Endpoint:** `POST /auth/refresh`
- **Auth Required:** No (Requires valid refresh token)
- **Success Response (200 OK):**
  ```typescript
  {
    status: "success",
    accessToken: string,
    refreshToken: string
  }
  ```

---

### 3.2 User (`/user`)

#### Register User
- **Endpoint:** `POST /user/register`
- **Auth Required:** No
- **Request Body:**
  ```typescript
  {
    email: string;
    passwordHash: string; // The backend expects this field (frontend should send password mapped to this, or adjust backend schema)
    name: string;
    role: string;
  }
  ```
- **Success Response (201 Created):** Returns user payload.

#### Get Current User
- **Endpoint:** `GET /user/:id`
- **Auth Required:** Yes (Bearer Token)
- **Description:** Get user details. Only admins or the owner can fetch this.

#### Update User
- **Endpoint:** `PATCH /user/:id`
- **Auth Required:** Yes (Bearer Token)
- **Request Body:**
  ```typescript
  {
    email?: string; // Must be valid email
    name?: string;  // Min length 1
    role?: string;
    isVerified?: boolean;
  }
  ```

#### Delete User
- **Endpoint:** `DELETE /user/:id`
- **Auth Required:** Yes (Bearer Token)

---

### 3.3 Company (`/company`)

#### Create Company
- **Endpoint:** `POST /company`
- **Auth Required:** Yes (Bearer Token)
- **Request Body:**
  ```typescript
  {
    name: string; // Min length 1
  }
  ```
  *(Note: `userId` is automatically inferred from the authenticated user token on the backend).*

#### List Companies
- **Endpoint:** `GET /company`
- **Auth Required:** Yes (Bearer Token)
- **Success Response (200 OK):**
  ```typescript
  {
    status: "success",
    data: Array<{
      id: string,
      name: string,
      createdAt: string,
      userId: string
    }>
  }
  ```

#### Get / Update / Delete Company
- **Endpoints:** 
  - `GET /company/:id`
  - `PATCH /company/:id`
  - `DELETE /company/:id`
- **Auth Required:** Yes (Bearer Token)
- **Update Request Body:**
  ```typescript
  {
    name?: string;
  }
  ```

---

### 3.4 Company Service (`/service`)

*Services represent individual apps or projects under a company that will process payments.*

#### Create Service
- **Endpoint:** `POST /service`
- **Auth Required:** Yes (Bearer Token)
- **Request Body:**
  ```typescript
  {
    companyId: string; // UUID of the parent company
    name: string;      // Min length 1
    currency: string;  // Exactly 3 characters (e.g., 'USD', 'INR')
  }
  ```

#### List Services by Company
- **Endpoint:** `GET /service/company/:companyId`
- **Auth Required:** Yes (Bearer Token)
- **Success Response (200 OK):** Array of service objects.

#### Get / Update / Delete Service
- **Endpoints:** 
  - `GET /service/:id`
  - `PATCH /service/:id`
  - `DELETE /service/:id`
- **Auth Required:** Yes (Bearer Token)
- **Update Request Body:**
  ```typescript
  {
    name?: string;
    currency?: string; // Exactly 3 characters
  }
  ```

---

### 3.5 Provider Configuration (`/provider`)

*Configures the payment gateways (Stripe, Razorpay) for a specific service.*

#### Add Provider Config
- **Endpoint:** `POST /provider`
- **Auth Required:** Yes (Bearer Token)
- **Request Body:**
  ```typescript
  {
    serviceId: string; // UUID of the service
    provider: "stripe" | "razorpay";
    credentialsEncrypted: string; // The raw credentials string (JSON stringified) to be stored securely
  }
  ```

#### List Providers by Service
- **Endpoint:** `GET /provider/service/:serviceId`
- **Auth Required:** Yes (Bearer Token)
- **Success Response (200 OK):** Array of provider configurations attached to the service.

#### Get / Update / Delete Provider
- **Endpoints:**
  - `GET /provider/:id`
  - `PATCH /provider/:id`
  - `DELETE /provider/:id`
- **Auth Required:** Yes (Bearer Token)
- **Update Request Body:**
  ```typescript
  {
    // Record of strings for updated credentials
    credentialsEncrypted?: Record<string, any>; 
  }
  ```

---

### 3.6 Payments (`/payment`)

*Note: These endpoints are protected by API Key authentication, not standard Bearer tokens. The API Key must be sent via the `x-api-key` header.*

#### Process Payment
- **Endpoint:** `POST /payment/pay`
- **Auth Required:** API Key (`x-api-key` header)
- **Request Body:**
  ```typescript
  {
    serviceId: string; // UUID of the service
    amount: number;    // Positive number (smallest currency unit, e.g., cents/paise)
    currency: string;  // Exactly 3 characters (e.g., 'USD')
    description?: string;
    receipt?: string;
    metadata?: Record<string, string>;
  }
  ```

#### Process Refund
- **Endpoint:** `POST /payment/refund`
- **Auth Required:** API Key (`x-api-key` header)
- **Request Body:**
  ```typescript
  {
    serviceId: string; // UUID of the service
    paymentId: string; // Internal UUID of the payment record
    amount?: number;   // Positive number (partial refund if provided, full refund if omitted)
    reason?: string;
    metadata?: Record<string, string>;
  }
  ```

#### List Transactions
- **Endpoint:** `GET /payment/list-transactions`
- **Auth Required:** API Key (`x-api-key` header)
- **Query Parameters:**
  ```typescript
  {
    serviceId: string; // UUID of the service (Required)
    from?: string;     // ISO date string
    to?: string;       // ISO date string
    status?: string;   // Filter by status string
    limit?: number;    // Default 20, max 100
    cursor?: string;   // Pagination cursor
  }
  ```