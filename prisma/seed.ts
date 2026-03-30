import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.$executeRaw`DELETE FROM "refresh_tokens"`;
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Vêtements homme',
        slug: 'vetements-homme',
        image: '/assets/categories/men.jpg',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Chaussures',
        slug: 'chaussures',
        image: '/assets/categories/shoes.jpg',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Électronique',
        slug: 'electronique',
        image: '/assets/categories/tech.jpg',
        active: true,
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.length);

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Chemise Oxford Premium',
        slug: 'chemise-oxford-premium',
        price: 18000,
        images: [
          '/assets/products/chemise-1.jpg',
          '/assets/products/chemise-2.jpg',
        ],
        categoryId: categories[0].id,
        brand: 'Khidma',
        description:
          'Chemise premium en coton, coupe nette, finition minimaliste et durable.',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Noir', 'Blanc'],
        featured: true,
        stock: 24,
        rating: 4.8,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sneakers Urbaines',
        slug: 'sneakers-urbaines',
        price: 32000,
        images: [
          '/assets/products/sneakers-1.jpg',
          '/assets/products/sneakers-2.jpg',
        ],
        categoryId: categories[1].id,
        brand: 'Khidma',
        description:
          'Sneakers sobres et confortables pour un usage quotidien.',
        sizes: ['39', '40', '41', '42', '43', '44'],
        colors: ['Noir', 'Gris'],
        featured: true,
        stock: 18,
        rating: 4.7,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Smartwatch Minimal',
        slug: 'smartwatch-minimal',
        price: 45000,
        images: [
          '/assets/products/watch-1.jpg',
          '/assets/products/watch-2.jpg',
        ],
        categoryId: categories[2].id,
        brand: 'Nova',
        description:
          'Montre connectée avec suivi d\'activité et autonomie fiable.',
        sizes: ['Unique'],
        colors: ['Noir', 'Argent'],
        featured: true,
        stock: 13,
        rating: 4.6,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Polo Premium',
        slug: 'polo-premium',
        price: 15000,
        images: ['/assets/products/polo-1.jpg'],
        categoryId: categories[0].id,
        brand: 'Studio',
        description:
          'Polo structuré, facile à porter, avec une silhouette propre.',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blanc', 'Noir', 'Gris'],
        featured: true,
        stock: 32,
        rating: 4.5,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Casque Audio Pro',
        slug: 'casque-audio-pro',
        price: 38000,
        images: ['/assets/products/headphone-1.jpg'],
        categoryId: categories[2].id,
        brand: 'Soundly',
        description:
          'Casque sans fil au son équilibré et au design discret.',
        sizes: ['Unique'],
        colors: ['Noir'],
        featured: false,
        stock: 11,
        rating: 4.4,
        active: true,
      },
    }),
  ]);

  console.log('✅ Products created:', products.length);

  // Create Users (Clients)
  const hashedPassword = await bcrypt.hash('khidma123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Aminata Koné',
        phone: '0700000001',
        role: 'CLIENT',
        address: 'Cocody, Abidjan',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sara Diabaté',
        phone: '0700000003',
        role: 'CLIENT',
        address: 'Marcory, Abidjan',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ousmane Kouassi',
        phone: '0700000004',
        role: 'CLIENT',
        address: 'Yopougon, Abidjan',
      },
    }),
  ]);

  console.log('✅ Client users created:', users.length);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'Moussa Traoré',
      phone: '0700000002',
      email: 'admin@khidma.shop',
      password: hashedPassword,
      role: 'ADMIN',
      address: 'Plateau, Abidjan',
    },
  });

  console.log('✅ Admin user created');

  // Create Sample Orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        userId: users[0].id,
        customerName: users[0].name,
        phone: users[0].phone,
        address: users[0].address,
        latitude: 5.3509,
        longitude: -4.0031,
        status: 'CONFIRMED',
        total: 50000,
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 2,
              size: 'M',
              color: 'Noir',
              productSnapshot: {
                name: products[0].name,
                price: products[0].price,
                image: products[0].images[0],
                brand: products[0].brand,
              },
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[1].id,
        customerName: users[1].name,
        phone: users[1].phone,
        address: users[1].address,
        latitude: 5.3202,
        longitude: -4.0165,
        status: 'PENDING',
        total: 77000,
        items: {
          create: [
            {
              productId: products[1].id,
              quantity: 1,
              size: '42',
              color: 'Noir',
              productSnapshot: {
                name: products[1].name,
                price: products[1].price,
                image: products[1].images[0],
                brand: products[1].brand,
              },
            },
            {
              productId: products[2].id,
              quantity: 1,
              productSnapshot: {
                name: products[2].name,
                price: products[2].price,
                image: products[2].images[0],
                brand: products[2].brand,
              },
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Sample orders created:', orders.length);

  console.log('✨ Seed completed successfully!');
  console.log('');
  console.log('Demo Credentials:');
  console.log('  Client Phone: 0700000001');
  console.log('  Admin Email: admin@khidma.shop');
  console.log('  Admin Password: khidma123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
