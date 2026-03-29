# 🗄️ Database Schema & Relations

## ERD (Entity Relationship Diagram)

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ id (PK)          │
│ name             │
│ phone (UQ)       │
│ email (UQ)       │
│ password         │
│ role: enum       │◄─────────┐
│ address          │          │
│ avatar           │          │
│ createdAt        │          │
├──────────────────┤          │
│ orders (1:N)     │          │
│ otps (1:N)       │          │
└──────────────────┘          │
         │                     │
         │ (Cascade)           │
         │                     │
    ┌────▼─────────┐          │
    │   Order      │          │
    ├──────────────┤          │
    │ id (PK)      │          │
    │ userId (FK)──┼──────────┘
    │ status: enum │
    │ total        │
    │ phone        │
    │ address      │
    │ lat/long     │
    ├──────────────┤
    │ items (1:N)  │
    └────┬─────────┘
         │
         │ (Cascade)
         │
    ┌────▼──────────────┐
    │   OrderItem       │
    ├───────────────────┤
    │ id (PK)           │
    │ orderId (FK)──────┼──►Order
    │ productId (FK)────┼──────┐
    │ quantity          │      │
    │ size              │      │
    │ color             │      │
    │ productSnapshot   │ (JSON)
    └───────────────────┘      │
                               │
    ┌──────────────────┐       │
    │    Category      │       │
    ├──────────────────┤       │
    │ id (PK)          │       │
    │ name (UQ)        │       │
    │ slug (UQ)        │       │
    │ image            │       │
    │ active           │       │
    ├──────────────────┤       │
    │ products (1:N)   │       │
    └────▲─────────────┘       │
         │                     │
         │ (Restrict)          │
         │                     │
    ┌────┴──────────────┐      │
    │    Product        │      │
    ├───────────────────┤      │
    │ id (PK)           │      │
    │ name              │      │
    │ slug (UQ)         │      │
    │ price             │      │
    │ images []         │      │
    │ categoryId (FK)───┼──────┘
    │ brand             │
    │ description       │
    │ sizes []          │
    │ colors []         │
    │ featured          │
    │ stock             │
    │ rating            │
    │ active            │
    ├───────────────────┤
    │ orderItems (1:N)  │
    └───────────────────┘

    ┌──────────────────┐
    │      OTP         │
    ├──────────────────┤
    │ id (PK)          │
    │ userId (FK)      │
    │ code             │
    │ expiresAt        │
    │ attempts         │
    │ createdAt        │
    ├──────────────────┤
    │ user (FK) ──────►User
    └──────────────────┘
```

---

## Detailed Schema

### User
```sql
TABLE users {
  id          String @id @default(cuid())
  name        String
  phone       String @unique
  email       String @unique
  password    String (hashed with bcrypt)
  role        enum(CLIENT, ADMIN) @default(CLIENT)
  address     String
  avatar      String (URL)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  INDEXES: [role], [phone]
}
```

**Constraints**:
- `phone`: Unique, must be valid phone
- `email`: Unique (nullable)
- `password`: Hashed with bcrypt (min 10 rounds)
- `role`: Must be CLIENT or ADMIN

---

### Category
```sql
TABLE categories {
  id        String @id @default(cuid())
  name      String @unique
  slug      String @unique
  image     String (URL)
  active    Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  INDEXES: [slug], [active]
}
```

**Constraints**:
- `name`: Unique max 100 chars
- `slug`: Unique, automatically generated from name
- `image`: Must be valid URL

---

### Product
```sql
TABLE products {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  price       Float (min: 0)
  images      String[] (URLs)
  categoryId  String @fk(Category.id) ON DELETE RESTRICT
  brand       String
  description String (TEXT)
  sizes       String[] (e.g., ["S", "M", "L", "XL"])
  colors      String[] (e.g., ["Noir", "Blanc"])
  featured    Boolean @default(false)
  stock       Int (min: 0)
  rating      Float @default(0) (range: 0-5)
  active      Boolean @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  INDEXES: [slug], [categoryId], [active]
}
```

**Constraints**:
- `categoryId`: Foreign key, RESTRICT delete (must be empty to delete category)
- `slug`: Unique, auto-generated
- `price`: Must be > 0
- `stock`: Must be >= 0
- `images`: Array of URLs

---

### Order
```sql
TABLE orders {
  id            String @id @default(cuid())
  userId        String @fk(User.id) ON DELETE CASCADE
  customerName  String
  phone         String
  address       String
  latitude      Float
  longitude     Float
  status        enum(PENDING, CONFIRMED, DELIVERED) @default(PENDING)
  total         Float (calculated from items)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  INDEXES: [userId], [status], [phone]
}
```

**Constraints**:
- `userId`: CASCADE delete (if user deleted, order deleted)
- `status`: Can be PENDING, CONFIRMED, or DELIVERED
- `total`: Calculated sum of all items

---

### OrderItem
```sql
TABLE order_items {
  id                String @id @default(cuid())
  orderId           String @fk(Order.id) ON DELETE CASCADE
  productId         String @fk(Product.id) ON DELETE RESTRICT
  quantity          Int (min: 1)
  size              String (nullable)
  color             String (nullable)
  productSnapshot   JSON {
                      name: String,
                      price: Float,
                      image: String (URL),
                      brand: String
                    }
  
  createdAt         DateTime @default(now())
  
  INDEXES: [orderId], [productId]
}
```

**Constraints**:
- `productSnapshot`: Immutable JSON snapshot of product at purchase time
- `orderId`: CASCADE delete
- `productId`: RESTRICT delete (prevent product deletion if in orders)
- Purpose: Historical record of product details at purchase

---

### OTP
```sql
TABLE otps {
  id        String @id @default(cuid())
  userId    String @fk(User.id) ON DELETE CASCADE
  code      String (6 digits)
  expiresAt DateTime
  attempts  Int @default(0)
  
  createdAt DateTime @default(now())
}
```

**Constraints**:
- `code`: 6 random digits
- `expiresAt`: 5-10 minutes from creation
- `attempts`: Incremented on failed verification
- Max 5 attempts before deletion

---

## Migrations Strategy

### Migration 1: Initial Schema
- Create all tables
- Add indexes
- Add foreign keys
- Add constraints

### Migration 2: Seed Data (optional)
- Insert demo categories
- Insert demo products
- Insert demo users (admin + clients)

### Management

```bash
# Create new migration
npm run prisma:migrate -- --name <migration-name>

# Apply migrations
npm run prisma:migrate:deploy

# View pending migrations
npm run prisma:migrate -- --dry-run

# Reset database (WARNING: DESTRUCTIVE)
npm run prisma:reset

# Browser database
npm run prisma:studio
```

---

## Data Integrity Rules

### Cascading Deletes
- **User deleted** → Orders deleted → OrderItems deleted
- **Order deleted** → OrderItems deleted

### Restricted Deletes
- **Category deleted** → Error if products exist
- **Product deleted** → Error if order items exist

### Unique Constraints
- `User.phone`: Globally unique
- `User.email`: Globally unique (nullable)
- `Product.slug`: Globally unique
-  `Category.slug`: Globally unique
- `Category.name`: Globally unique

### Indexes
- **User**: `[role]`, `[phone]`
- **Product**: `[slug]`, `[categoryId]`, `[active]`
- **Order**: `[userId]`, `[status]`, `[phone]`
- **OrderItem**: `[orderId]`, `[productId]`
- **Category**: `[slug]`, `[active]`

---

## Snapshot Data Strategy

### Why ProductSnapshot?

Product details change over time:
- Prices update
- Stock changes
- Product get archive/deleted
- Images update

**Solution**: Store immutable snapshot of product at purchase time

```json
// OrderItem.productSnapshot
{
  "name": "Chemise Oxford Premium",
  "price": 18000,
  "image": "/assets/products/chemise-1.jpg",
  "brand": "Khidma"
}
```

This keeps order history accurate even if product is deleted or changed!

---

## Query Examples

### Frequent Queries

```sql
-- Get all products in category, active only
SELECT * FROM products 
WHERE categoryId = $1 AND active = true
ORDER BY createdAt DESC;

-- Get user's orders with items
SELECT o.*, oi.* FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = $1
ORDER BY o.created_at DESC;

-- Get featured products
SELECT * FROM products 
WHERE featured = true AND active = true;

-- Order stats
SELECT status, COUNT(*) FROM orders 
GROUP BY status;

-- User stats
SELECT role, COUNT(*) FROM users 
GROUP BY role;
```

---

## Performance Considerations

### Indexes

All foreign keys should be indexed:
```
User(phone) - High cardinality lookup
Product(categoryId) - Filter by category
Product(slug) - URL lookup
Order(userId) - User's orders
Order(status) - Order filtering
OrderItem(orderId) - Fetch order items
```

### N+1 Query Prevention

Always use `include` in Prisma:

```typescript
// ❌ BAD - N+1 queries
const orders = await prisma.order.findMany();
for (const order of orders) {
  const items = await prisma.orderItem.findMany({ ...});
}

// ✅ GOOD - Single query
const orders = await prisma.order.findMany({
  include: { items: true }
});
```

---

## Backup & Recovery

### Automated Backups

```bash
# Dump database
pg_dump khidmashop > backup.sql

# Restore
psql khidmashop < backup.sql
```

### Docker Volumes

PostgreSQL data persists in `postgres_data` volume:
```bash
docker volume ls
docker volume inspect khidmashop_postgres_data
```

---

**Last Updated**: March 28, 2026
