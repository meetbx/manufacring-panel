import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Upsert Main Category
  const mainCategory = await prisma.category.upsert({
    where: { slug: 'sports-goods-games-toys-accessories' },
    update: {
      name: 'Sports Goods, Games, Toys & Accessories',
    },
    create: {
      id: 'cmv6vcmay001atsxsmne4fhp5',
      name: 'Sports Goods, Games, Toys & Accessories',
      slug: 'sports-goods-games-toys-accessories',
    },
  });

  // 2. Upsert Subcategory: Educational & Learning Toys
  const subCategory = await prisma.category.upsert({
    where: { slug: 'educational-learning-toys' },
    update: {
      name: 'Educational & Learning Toys',
      parentId: mainCategory.id,
    },
    create: {
      name: 'Educational & Learning Toys',
      slug: 'educational-learning-toys',
      parentId: mainCategory.id,
    },
  });

  // 3. Upsert Child Category: Building Blocks & Construction Toys
  await prisma.category.upsert({
    where: { slug: 'building-blocks-construction-toys' },
    update: {
      name: 'Building Blocks & Construction Toys',
      parentId: subCategory.id,
    },
    create: {
      name: 'Building Blocks & Construction Toys',
      slug: 'building-blocks-construction-toys',
      parentId: subCategory.id,
    },
  });

  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });