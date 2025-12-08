'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation, useTranslations } from '@/hooks/useTranslation';
import { useTextSize } from '@/contexts/TextSizeContext';
import { filterSeasonalDrinks, type Season } from '@/lib/seasonalDrinks';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  item?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  item?: string;
  quantity: number;
  ice?: 'hot' | 'cold';
  size?: 'small' | 'medium' | 'large';
  sugar?: string;
  toppings?: string[];
}

export default function Cashier() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<Season>('fall/spring');
  const { getTextSizeClass } = useTextSize();

  // Customization states
  const [showCustomization, setShowCustomization] = useState(false);
  const [customItem, setCustomItem] = useState<MenuItem | null>(null);
  const [iceLevel, setIceLevel] = useState<'hot' | 'cold'>('cold');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sugarLevel, setSugarLevel] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const allToppings = ['Boba', 'Pudding', 'Grass Jelly'];
  
  // Translate toppings
  const translatedToppings = useTranslations(allToppings);
  const toppingTranslationMap = useMemo(() => {
    const map: Record<string, string> = {};
    allToppings.forEach((topping, index) => {
      map[topping] = translatedToppings[index] || topping;
    });
    return map;
  }, [allToppings, translatedToppings]);

  // Translations
  const cashierText = useTranslation('Cashier');
  const currentOrderText = useTranslation('Current Order');
  const totalText = useTranslation('Total');
  const paymentMethodText = useTranslation('Payment Method');
  const cashText = useTranslation('Cash');
  const cardText = useTranslation('Card');
  const submitOrderText = useTranslation('Submit Order');
  const cancelOrderText = useTranslation('Cancel Order');
  const orderSubmittedText = useTranslation('Order Submitted Successfully!');
  const newOrderText = useTranslation('New Order');
  const selectPaymentMethodText = useTranslation('Select Payment Method');
  const emptyCartText = useTranslation('Cart is empty');
  const addItemsText = useTranslation('Add items to start an order');
  const loadingText = useTranslation('Loading menu...');
  const customizationText = useTranslation('Customization');
  const hotColdText = useTranslation('Hot / Cold');
  const hotText = useTranslation('Hot');
  const coldText = useTranslation('Cold');
  const sizeText = useTranslation('Size');
  const smallText = useTranslation('Small');
  const mediumText = useTranslation('Medium');
  const largeText = useTranslation('Large');
  const sugarLevelText = useTranslation('Sugar Level');
  const toppingsText = useTranslation('Toppings');
  const cancelText = useTranslation('Cancel');
  const addToCartText = useTranslation('Add to Cart');
  
  // Translate ice, size, and sugar values
  const hotValueText = useTranslation('hot');
  const coldValueText = useTranslation('cold');
  const smallValueText = useTranslation('small');
  const mediumValueText = useTranslation('medium');
  const largeValueText = useTranslation('large');
  
  // Helper function to translate cart item details
  const translateCartItemDetail = (type: 'ice' | 'size' | 'sugar', value: string) => {
    if (type === 'ice') {
      return value === 'hot' ? hotValueText : coldValueText;
    }
    if (type === 'size') {
      if (value === 'small') return smallValueText;
      if (value === 'medium') return mediumValueText;
      if (value === 'large') return largeValueText;
    }
    return value; // For sugar, return as is (it's already a percentage)
  };

  // Fetch weather and menu items from database
  useEffect(() => {
    const fetchWeatherAndMenuItems = async () => {
      try {
        const weatherResponse = await fetch('/api/weather');
        let season: Season = 'fall/spring';
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          if (weatherData.success && weatherData.season) {
            season = weatherData.season as Season;
            setCurrentSeason(season);
          }
        }

        const response = await fetch('/api/menu');
        const data = await response.json();
        if (data.items) {
          let items = data.items.map((item: any) => ({
            id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
            name: item.item,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
            category: item.category,
            item: item.item,
          }));

          items = filterSeasonalDrinks(items, season);
          setMenuItems(items);

          const categories = [...new Set(items.map((item: MenuItem) => item.category))];
          if (categories.length > 0) setSelectedCategory(categories[0] as string);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherAndMenuItems();
  }, []);

  const categories = [...new Set(menuItems.map((item) => item.category))];
  const filteredItems = menuItems.filter((item) => item.category === selectedCategory);

  // Translate categories
  const translatedCategories = useTranslations(categories);
  const categoryTranslationMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat, index) => {
      map[cat] = translatedCategories[index] || cat;
    });
    return map;
  }, [categories, translatedCategories]);

  // Translate menu items
  const allMenuItemNames = useMemo(() => {
    return menuItems.map(item => item.item || item.name);
  }, [menuItems]);

  const translatedMenuItemNames = useTranslations(allMenuItemNames);
  const menuItemTranslationMap = useMemo(() => {
    const map: Record<string, string> = {};
    allMenuItemNames.forEach((name, index) => {
      map[name] = translatedMenuItemNames[index] || name;
    });
    return map;
  }, [allMenuItemNames, translatedMenuItemNames]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.ice === item.ice &&
          cartItem.size === item.size &&
          cartItem.sugar === item.sugar &&
          JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    setShowCustomization(false);
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => {
      const item = prevCart.find((cartItem) => cartItem.id === itemId);
      if (item && item.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter((cartItem) => cartItem.id !== itemId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod(null);
    setOrderSubmitted(false);
  };

  // Helper function to calculate size-based price addition
  const getSizePrice = (size: 'small' | 'medium' | 'large'): number => {
    if (size === 'medium') return 1.00;
    if (size === 'large') return 2.00;
    return 0; // small has no extra charge
  };

  const calculateTotal = () => {
    // Price already includes size pricing when added to cart
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total: calculateTotal(), paymentMethod }),
      });
      const data = await response.json();
      if (data.success) {
        setOrderSubmitted(true);
        setTimeout(() => clearCart(), 2000);
      } else {
        alert('Failed to submit order: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    }
  };

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-gray-600">{loadingText}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${getTextSizeClass('3xl')}`}>
      <div className="flex h-screen">
        {/* Left Side - Menu Items */}
        <div className="w-2/3 overflow-y-auto bg-white p-6">
          <h1 className="mb-6 font-bold text-gray-800 text-center">{cashierText}</h1>

          {/* Category Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedCategory === category
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {categoryTranslationMap[category] || category}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCustomItem(item);
                  setIceLevel('cold');
                  setSize('medium');
                  setSugarLevel('');
                  setSelectedToppings([]);
                  setShowCustomization(true);
                }}
                className="group rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-lg"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{menuItemTranslationMap[item.item || item.name] || item.name}</h3>
                  <span className="text-lg font-bold text-blue-600">${item.price.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500">{categoryTranslationMap[item.category] || item.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="w-1/3 border-l bg-gray-50 p-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">{currentOrderText}</h2>

          {orderSubmitted ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg bg-green-50 p-8 text-center">
              <div className="mb-4 text-6xl">✓</div>
              <h3 className="mb-2 text-2xl font-bold text-green-800">{orderSubmittedText}</h3>
              <p className="text-gray-600">{newOrderText}</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="rounded-lg bg-white p-8 text-center text-gray-500">
                    <p className="mb-2">{emptyCartText}</p>
                    <p className="text-sm">{addItemsText}</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{menuItemTranslationMap[item.item || item.name] || item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.ice ? translateCartItemDetail('ice', item.ice) : ''}{item.ice && item.size ? ', ' : ''}
                          {item.size ? translateCartItemDetail('size', item.size) : ''}{(item.ice || item.size) && item.sugar ? ', ' : ''}
                          {item.sugar ? translateCartItemDetail('sugar', item.sugar) : ''}{(item.ice || item.size || item.sugar) && item.toppings && item.toppings.length > 0 ? ', ' : ''}
                          {item.toppings?.map(topping => toppingTranslationMap[topping] || topping).join(', ')}
                          <br />
                          ${item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="rounded bg-red-100 px-2 py-1 text-red-600 hover:bg-red-200"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() =>
                            addToCart({
                              ...item,
                              ice: item.ice,
                              size: item.size,
                              sugar: item.sugar,
                              toppings: item.toppings,
                              quantity: 1,
                            })
                          }
                          className="rounded bg-blue-100 px-2 py-1 text-blue-600 hover:bg-blue-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              {cart.length > 0 && (
                <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span>{totalText}:</span>
                    <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              {cart.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">{paymentMethodText}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`rounded-lg border-2 p-3 font-medium transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {cashText}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`rounded-lg border-2 p-3 font-medium transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {cardText}
                    </button>
                  </div>
                  {!paymentMethod && <p className="mt-2 text-sm text-red-600">{selectPaymentMethodText}</p>}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {cart.length > 0 && (
                  <button
                    onClick={handleSubmitOrder}
                    disabled={!paymentMethod}
                    className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition-all ${
                      paymentMethod ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {submitOrderText}
                  </button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full rounded-lg border-2 border-red-500 bg-white px-4 py-3 font-semibold text-red-600 transition-all hover:bg-red-50"
                  >
                    {cancelOrderText}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && customItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-1/3 rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-800">{menuItemTranslationMap[customItem.item || customItem.name] || customItem.name} {customizationText}</h2>

            {/* Ice */}
            <div className="mb-4">
              <label className="block mb-1">{hotColdText}</label>
              <select
                className="w-full rounded border p-2"
                value={iceLevel}
                onChange={(e) => setIceLevel(e.target.value as 'hot' | 'cold')}
              >
                <option value="hot">{hotText}</option>
                <option value="cold">{coldText}</option>
              </select>
            </div>

            {/* Size */}
            <div className="mb-4">
              <label className="block mb-1">{sizeText}</label>
              <select
                className="w-full rounded border p-2"
                value={size}
                onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
              >
                <option value="small">{smallText}</option>
                <option value="medium">{mediumText} +$1.00</option>
                <option value="large">{largeText} +$2.00</option>
              </select>
            </div>

            {/* Sugar */}
            <div className="mb-4">
              <label className="block mb-1">{sugarLevelText}</label>
              <select
                className="w-full rounded border p-2"
                value={sugarLevel}
                onChange={(e) => setSugarLevel(e.target.value)}
              >
                <option value="0%">0%</option>
                <option value="25%">25%</option>
                <option value="50%">50%</option>
                <option value="75%">75%</option>
                <option value="100%">100%</option>
              </select>
            </div>


            {/* Toppings */}
            <div className="mb-4">
              <label className="block mb-1">{toppingsText}</label>
              <div className="flex flex-wrap gap-2">
                {allToppings.map((topping) => (
                  <button
                    key={topping}
                    onClick={() => toggleTopping(topping)}
                    className={`rounded border px-3 py-1 transition ${
                      selectedToppings.includes(topping)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {toppingTranslationMap[topping] || topping}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCustomization(false)}
                className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  const sizePrice = getSizePrice(size);
                  addToCart({
                    ...customItem,
                    price: customItem.price + sizePrice, // Add size price to base price
                    ice: iceLevel,
                    size: size,
                    sugar: sugarLevel,
                    toppings: selectedToppings,
                    quantity: 1,
                  });
                }}
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                {addToCartText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
