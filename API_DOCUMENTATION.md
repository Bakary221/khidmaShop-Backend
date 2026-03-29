# 📘 KhidmaShop API Documentation

## Summary

Complete REST API for KhidmaShop e-commerce platform with authentication, product management, and order processing.

**Base URL**: `http://localhost:3001`
**Swagger UI**: `http://localhost:3001/api/docs`

---

## 🔐 Authentication

### Auth Response Format (ONLY tokens, NO user data)

All successful auth endpoints return:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

### Headers

All authenticated requests require:
```
Authorization: Bearer <accessToken>
```

---

## 📡 Endpoints

### 🔑 Authentication

#### POST `/auth/send-otp`
Send OTP code to phone number (SMS)

**Request**:
```json
{
  "phone": "+22500000001",
  "role": "CLIENT"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "requestId": "otp_xxxx"
  },
  "error": null
}
```

**Status**: 200 OK

---

#### POST `/auth/verify-otp`
Verify OTP code and get JWT tokens

**Request**:
```json
{
  "phone": "+22500000001",
  "role": "CLIENT",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "error": null
}
```

**Errors**:
- `400 Bad Request`: Invalid OTP
- `400 Bad Request`: OTP expired
- `400 Bad Request`: Max attempts exceeded

---

#### POST `/auth/admin-login`
Admin login with email and password

**Request**:
```json
{
  "email": "admin@khidma.shop",
  "password": "khidma123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "error": null
}
```

**Status**: 200 OK
**Errors**: `401 Unauthorized`: Invalid credentials

---

#### POST `/auth/refresh`
Refresh access token using refresh token

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "error": null
}
```

---

### 📦 Products

#### GET `/products`
Get products with optional filters

**Query Parameters**:
- `search` (string): Search in name, description, brand
- `categoryId` (string): Filter by category
- `brand` (string): Filter by brand
- `maxPrice` (number): Maximum price filter
- `includeInactive` (boolean): Include inactive products

**Example**:
```
GET /products?categoryId=cat-001&maxPrice=50000&search=chemise
```

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "prd-001",
      "name": "Chemise Oxford Premium",
      "slug": "chemise-oxford-premium",
      "price": 18000,
      "images": ["..."],
      "categoryId": "cat-001",
      "brand": "Khidma",
      "description": "...",
      "sizes": ["S", "M", "L", "XL"],
      "colors": ["Noir", "Blanc"],
      "featured": true,
      "stock": 24,
      "rating": 4.8,
      "active": true,
      "createdAt": "2026-03-28T10:00:00Z",
      "updatedAt": "2026-03-28T10:00:00Z"
    }
  ],
  "error": null
}
```

**Status**: 200 OK

---

#### GET `/products/featured`
Get featured products only

**Response**: Array of featured products (same structure as `/products`)

---

#### GET `/products/brands`
Get all available brands

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": ["Khidma", "Nova", "Studio", "Soundly"],
  "error": null
}
```

---

#### GET `/products/:id`
Get product details

**Params**: `id` (string): Product ID

**Response**: Single product object

---

#### POST `/products` ⚙️ (Admin only)
Create new product

**Headers**: `Authorization: Bearer <adminToken>`

**Request**:
```json
{
  "name": "New Product",
  "slug": "new-product",
  "price": 25000,
  "images": ["url1", "url2"],
  "categoryId": "cat-001",
  "brand": "Brand Name",
  "description": "Product description",
  "sizes": ["S", "M", "L"],
  "colors": ["Noir", "Blanc"],
  "featured": true,
  "stock": 50,
  "rating": 0,
  "active": true
}
```

**Response**: Created product object

---

#### PUT `/products/:id` ⚙️ (Admin only)
Update product

**Headers**: `Authorization: Bearer <adminToken>`

**Request**: Any subset of product fields

**Response**: Updated product object

---

#### PATCH `/products/:id/toggle` ⚙️ (Admin only)
Toggle product active status

**Request**:
```json
{
  "active": false
}
```

---

#### DELETE `/products/:id` ⚙️ (Admin only)
Delete product

**Response**: `{ "message": "Product deleted successfully" }`

---

#### GET `/products/stats` ⚙️ (Admin only)
Get product statistics

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "total": 10,
    "featured": 3,
    "categories": 3
  },
  "error": null
}
```

---

### 🏷️ Categories

#### GET `/categories`
Get all categories

**Query**:
- `includeInactive` (boolean): Include inactive categories

**Response**: Array of categories

---

#### GET `/categories/:id`
Get category details

**Response**: Category object

---

#### POST `/categories` ⚙️ (Admin only)
Create category

**Request**:
```json
{
  "name": "Category Name",
  "slug": "category-slug",
  "image": "https://...",
  "active": true
}
```

---

#### PUT `/categories/:id` ⚙️ (Admin only)
Update category

---

#### PATCH `/categories/:id/toggle` ⚙️ (Admin only)
Toggle active status

---

#### DELETE `/categories/:id` ⚙️ (Admin only)
Delete category

**Errors**: `409 Conflict`: Category has products

---

### 🛒 Orders

#### GET `/orders`
Get orders

- **Clients**: Own orders only
- **Admins**: All orders

**Response**: Array of orders with items

---

#### GET `/orders/:id`
Get order details

**Params**: `id` (string): Order ID

**Response**: Order object with items and product details

---

#### POST `/orders`
Create new order (clients only)

**Request**:
```json
{
  "customerName": "John Doe",
  "phone": "+22500000001",
  "address": "123 Main St",
  "latitude": 5.3509,
  "longitude": -4.0031,
  "items": [
    {
      "productId": "prd-001",
      "quantity": 2,
      "size": "M",
      "color": "Noir"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "ord-001",
    "userId": "usr-001",
    "customerName": "John Doe",
    "phone": "+22500000001",
    "address": "123 Main St",
    "latitude": 5.3509,
    "longitude": -4.0031,
    "status": "PENDING",
    "total": 50000,
    "items": [
      {
        "id": "oi-001",
        "productId": "prd-001",
        "quantity": 2,
        "size": "M",
        "color": "Noir",
        "productSnapshot": {
          "name": "...",
          "price": 25000,
          "image": "...",
          "brand": "..."
        }
      }
    ],
    "createdAt": "2026-03-28T10:00:00Z",
    "updatedAt": "2026-03-28T10:00:00Z"
  },
  "error": null
}
```

---

#### PATCH `/orders/:id/status` ⚙️ (Admin only)
Update order status

**Request**:
```json
{
  "status": "CONFIRMED"
}
```

**Allowed values**: `PENDING`, `CONFIRMED`, `DELIVERED`

---

#### GET `/orders/stats` ⚙️ (Admin only)
Get order statistics

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "total": 50,
    "pending": 10,
    "confirmed": 35,
    "delivered": 5
  },
  "error": null
}
```

---

### 👤 Users

#### GET `/users` ⚙️ (Admin only)
Get all users

**Response**: Array of user objects

---

#### GET `/users/:id`
Get user details

**Params**: `id` (string): User ID

---

#### POST `/users`
Create new user

**Request**:
```json
{
  "name": "User Name",
  "phone": "+225xxxxxxxxx",
  "email": "user@example.com",
  "address": "Address",
  "avatar": "https://..."
}
```

---

#### PUT `/users/:id`
Update user profile

**Request**: Any subset of user fields

---

#### DELETE `/users/:id` ⚙️ (Admin only)
Delete user

---

#### GET `/users/stats` ⚙️ (Admin only)
Get user statistics

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    { "role": "CLIENT", "_count": 150 },
    { "role": "ADMIN", "_count": 2 }
  ],
  "error": null
}
```

---

## 🚨 Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "User-friendly error message",
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "details": "Technical details"
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `AUTH_INVALID_CREDENTIALS` | 400 | Wrong email/password |
| `AUTH_OTP_INVALID` | 400 | Wrong OTP code |
| `AUTH_OTP_EXPIRED` | 400 | OTP expired |
| `AUTH_OTP_MAX_ATTEMPTS` | 400 | Too many OTP attempts |
| `USER_NOT_FOUND` | 404 | User not found |
| `PRODUCT_NOT_FOUND` | 404 | Product not found |
| `PRODUCT_OUT_OF_STOCK` | 400 | Insufficient stock |
| `CATEGORY_NOT_FOUND` | 404 | Category not found |
| `CATEGORY_NOT_EMPTY` | 409 | Category has products |
| `ORDER_NOT_FOUND` | 404 | Order not found |
| `ORDER_EMPTY` | 400 | Order has no items |
| `AUTH_UNAUTHORIZED` | 401 | Missing token |
| `AUTH_FORBIDDEN` | 403 | Insufficient permissions |

---

## ⚡ Best Practices

### 1. Always use Bearer token

```
Authorization: Bearer eyJhbGci...
```

### 2. Check response success field

```typescript
if (response.data.success) {
  // Process data.data
} else {
  // Handle error using data.error.code
}
```

### 3. Handle token expiration

Tokens expire after 15 minutes. Use refresh endpoint:

```typescript
const response = await fetch('/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});

const newTokens = response.data.data;
```

---

## 🧪 Testing

### Example: Create Order

```bash
# 1. Get tokens
curl -X POST http://localhost:3001/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+22500000001",
    "role": "CLIENT",
    "otp": "123456"
  }'

# Extract accessToken from response

# 2. Create order
curl -X POST http://localhost:3001/orders \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John",
    "phone": "+22500000001",
    "items": [
      {
        "productId": "prd-001",
        "quantity": 1
      }
    ]
  }'
```

---

**Last Updated**: March 28, 2026
