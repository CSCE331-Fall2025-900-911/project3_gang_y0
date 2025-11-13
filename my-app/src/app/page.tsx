'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Drink {
  name: string;
  price: string;
}

interface MenuSection {
  title: string;
  image: string;
  drinks: Drink[];
}

const menuData: MenuSection[] = [
  {
    title: 'Milk Tea',
    image: '/milktea.png',
    drinks: [
      { name: 'Classic Milk Tea', price: '$5.50' },
      { name: 'Taro Milk Tea', price: '$6.00' },
      { name: 'Thai Milk Tea', price: '$5.75' },
      { name: 'Matcha Milk Tea', price: '$6.25' },
      { name: 'Honey Milk Tea', price: '$5.50' },
      { name: 'Brown Sugar Milk Tea', price: '$6.50' },
    ],
  },
  {
    title: 'Fruit Tea',
    image: '/fruitdrink.png',
    drinks: [
      { name: 'Passion Fruit Tea', price: '$5.75' },
      { name: 'Mango Green Tea', price: '$6.00' },
      { name: 'Strawberry Tea', price: '$5.75' },
      { name: 'Peach Oolong Tea', price: '$6.25' },
      { name: 'Lychee Tea', price: '$5.75' },
      { name: 'Grapefruit Tea', price: '$6.00' },
    ],
  },
  {
    title: 'Blended Drinks',
    image: '/blendeddrink.png',
    drinks: [
      { name: 'Mango Smoothie', price: '$6.50' },
      { name: 'Strawberry Smoothie', price: '$6.50' },
      { name: 'Taro Smoothie', price: '$6.75' },
      { name: 'Chocolate Smoothie', price: '$6.50' },
      { name: 'Matcha Smoothie', price: '$6.75' },
      { name: 'Avocado Smoothie', price: '$7.00' },
    ],
  },
  {
    title: 'Specialty Drinks',
    image: '/specialdrink.png',
    drinks: [
      { name: 'Bubble Waffle Drink', price: '$7.50' },
      { name: 'Rainbow Boba', price: '$6.75' },
      { name: 'Lava Flow', price: '$7.00' },
      { name: 'Sunset Paradise', price: '$6.75' },
      { name: 'Coconut Cloud', price: '$7.25' },
      { name: 'Purple Dream', price: '$6.75' },
    ],
  },
];

export default function Home() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-center text-5xl font-bold text-gray-800">
          Boba Shop Menu
        </h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {menuData.map((section, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105"
            >
              <h2 className="mb-4 text-center text-3xl font-semibold text-gray-800">
                {section.title}
              </h2>
              
              <div className="mb-6 flex justify-center">
                <div className="relative h-48 w-48 overflow-hidden rounded-full bg-white">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {section.drinks.map((drink, drinkIndex) => (
                  <div
                    key={drinkIndex}
                    className="flex items-center justify-between rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 p-3 transition-colors hover:from-pink-100 hover:to-purple-100"
                  >
                    <span className="text-lg font-medium text-gray-700">
                      {drink.name}
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {drink.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
