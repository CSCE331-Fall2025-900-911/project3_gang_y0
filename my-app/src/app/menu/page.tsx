'use client';

import Image from 'next/image';
import { useTranslation, useTranslations } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTextSize } from '@/contexts/TextSizeContext';
import { filterSeasonalDrinks, type Season } from '@/lib/seasonalDrinks';

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
      { name: 'Caramel Milk Tea', price: '$6.25' },
      { name: 'Honeydew Milk Tea', price: '$5.50' },
      { name: 'Brown Sugar Milk Tea', price: '$6.50' },
    ],
  },
  {
    title: 'Fruit Tea',
    image: '/fruittea.png',
    drinks: [
      { name: 'Passion Fruit Tea', price: '$5.75' },
      { name: 'Mango Green Tea', price: '$6.00' },
      { name: 'Strawberry Tea', price: '$5.75' },
      { name: 'Peach Oolong Tea', price: '$6.25' },
      { name: 'Lychee Black Tea', price: '$5.75' },
      { name: 'Grapefruit Tea', price: '$6.00' },
    ],
  },
  {
    title: 'Blended Drinks',
    image: '/smoothie.png',
    drinks: [
      { name: 'Mango Smoothie', price: '$6.50' },
      { name: 'Strawberry Banana Smoothie', price: '$6.50' },
      { name: 'Taro Smoothie', price: '$6.75' },
      { name: 'Coconut Smoothie', price: '$6.50' },
      { name: 'Matcha Smoothie', price: '$6.75' },
      { name: 'Avocado Smoothie', price: '$7.00' },
    ],
  },
  {
    title: 'Specialty Drinks',
    image: '/specialty.png',
    drinks: [
      { name: 'Coffee Milk Tea', price: '$7.50' },
      { name: 'Oreo Milk Tea', price: '$6.75' },
      { name: 'Red Bean Milk Tea', price: '$7.00' },
      { name: 'Brown Sugar Boba Latte', price: '$6.75' },
      { name: 'Coconut Cloud', price: '$7.25' },
      { name: 'Jasmine Cheese Foam Tea', price: '$6.75' },
    ],
  },
];

export default function Home() {
  const router = useRouter();
  const { getTextSizeClass } = useTextSize();
  const bobaShopMenuText = useTranslation('Rigby\'s Boba Shop Menu');
  const seasonalTitleText = useTranslation('Seasonal');
  const [seasonalDrinks, setSeasonalDrinks] = useState<Drink[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season>('fall/spring');
  const [loadingSeasonal, setLoadingSeasonal] = useState(true);
  
  // Fetch weather and seasonal drinks
  useEffect(() => {
    const fetchSeasonalDrinks = async () => {
      try {
        // Fetch weather to determine season
        const weatherResponse = await fetch('/api/weather');
        let season: Season = 'fall/spring'; // Default
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          if (weatherData.success && weatherData.season) {
            season = weatherData.season as Season;
            setCurrentSeason(season);
          }
        }

        // Fetch seasonal drinks from database
        const menuResponse = await fetch('/api/menu');
        if (menuResponse.ok) {
          const menuDataResponse = await menuResponse.json();
          if (menuDataResponse.items) {
            // Filter seasonal drinks based on current season
            const filteredSeasonal = menuDataResponse.items
              .filter((item: any) => item.category === 'Seasonal')
              .filter((item: any) => {
                const itemName = item.item || item.name || '';
                return filterSeasonalDrinks([{ item: itemName }], season).length > 0;
              })
              .map((item: any) => ({
                name: item.item,
                price: `$${parseFloat(item.price).toFixed(2)}`
              }));
            
            setSeasonalDrinks(filteredSeasonal);
          }
        }
      } catch (error) {
        console.error('Error fetching seasonal drinks:', error);
      } finally {
        setLoadingSeasonal(false);
      }
    };

    fetchSeasonalDrinks();
  }, []);
  
  // Translate all section titles
  const sectionTitles = menuData.map(section => section.title);
  const translatedTitles = useTranslations(sectionTitles);
  
  // Translate all regular drink names
  const allRegularDrinkNames = menuData.flatMap(section => section.drinks.map(drink => drink.name));
  const translatedRegularDrinkNames = useTranslations(allRegularDrinkNames);
  
  // Translate seasonal drink names separately
  const seasonalDrinkNames = seasonalDrinks.map(drink => drink.name);
  const translatedSeasonalDrinkNames = useTranslations(seasonalDrinkNames);
  
  // Reconstruct menu data with translations and add seasonal section
  const [translatedMenuData, setTranslatedMenuData] = useState(menuData);
  
  useEffect(() => {
    // Translate regular menu sections
    const translated = menuData.map((section, sectionIndex) => ({
      ...section,
      title: translatedTitles[sectionIndex] || section.title,
      drinks: section.drinks.map((drink, drinkIndex) => {
        // Calculate the global index for this drink
        let globalDrinkIndex = 0;
        for (let i = 0; i < sectionIndex; i++) {
          globalDrinkIndex += menuData[i].drinks.length;
        }
        globalDrinkIndex += drinkIndex;
        
        return {
          ...drink,
          name: translatedRegularDrinkNames[globalDrinkIndex] || drink.name,
        };
      }),
    }));
    
    // Add seasonal section if there are seasonal drinks
    if (seasonalDrinks.length > 0 && !loadingSeasonal) {
      const translatedSeasonalDrinks = seasonalDrinks.map((drink, index) => {
        // Use translated name if available, otherwise use original name
        const translatedName = translatedSeasonalDrinkNames[index];
        return {
          ...drink,
          name: (translatedName && translatedName !== drink.name) ? translatedName : drink.name
        };
      });
      
      translated.push({
        title: seasonalTitleText || 'Seasonal',
        image: '/specialty.png',
        drinks: translatedSeasonalDrinks
      });
    }
    
    setTranslatedMenuData(translated);
  }, [translatedTitles, translatedRegularDrinkNames, translatedSeasonalDrinkNames, seasonalDrinks, loadingSeasonal, seasonalTitleText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className={`mb-8 text-center font-bold text-gray-800 ${getTextSizeClass('5xl')}`}>
          {bobaShopMenuText}
        </h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {translatedMenuData.map((section, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <h2 className={`mb-4 text-center font-semibold text-gray-800 ${getTextSizeClass('3xl')}`}>
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
                    className="flex items-center justify-between rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 p-3"
                  >
                    <span className={`font-medium text-gray-700 ${getTextSizeClass('lg')}`}>
                      {drink.name}
                    </span>
                    <span className={`font-bold text-purple-600 ${getTextSizeClass('lg')}`}>
                      {drink.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
