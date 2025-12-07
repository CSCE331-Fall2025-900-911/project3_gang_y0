'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { filterSeasonalDrinks, type Season } from '@/lib/seasonalDrinks';
import PrizeSpinner from '@/components/PrizeSpinner';
import { useTranslation, useTranslations } from '@/hooks/useTranslation';
import { useTextSize } from '@/contexts/TextSizeContext';

interface MenuItem {
  id: number;
  item: string;
  category: string;
  price: number;
}

interface CartItem {
  id: string;
  menuItem: MenuItem;
  iceLevel: string;
  sugarLevel: string;
  toppings: MenuItem[];
  quantity: number;
  totalPrice: number;
}

interface MenuData {
  [category: string]: MenuItem[];
}

const ICE_LEVELS = ['Light', 'Regular', 'Extra'];
const SUGAR_LEVELS = ['25%', '50%', '75%', '100%'];

export default function KioskPage() {
  const { data: session } = useSession();
  const [menuData, setMenuData] = useState<MenuData>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customization, setCustomization] = useState({
    iceLevel: 'Regular',
    sugarLevel: '100%',
    selectedToppings: [] as MenuItem[],
    quantity: 1
  });
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<Season>('fall/spring');
  const [discount, setDiscount] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ itemName: '', quantity: 0 });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [paymentError, setPaymentError] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Get text size class
  const { getTextSizeClass } = useTextSize();

  // Static text translations
  const menuCategoriesText = useTranslation('Menu Categories');
  const yourOrderText = useTranslation('Your Order');
  const yourCartIsEmptyText = useTranslation('Your cart is empty');
  const checkoutText = useTranslation('Checkout');
  const subtotalText = useTranslation('Subtotal');
  const loadingMenuText = useTranslation('Loading menu...');
  const iceText = useTranslation('Ice');
  const sugarText = useTranslation('Sugar');
  const toppingsText = useTranslation('Toppings');
  const quantityText = useTranslation('Quantity');
  const cancelText = useTranslation('Cancel');
  const addText = useTranslation('Add');
  const basePriceText = useTranslation('Base price');
  const currentPriceText = useTranslation('Current Price');
  const includesText = useTranslation('Includes');
  const toppingsCountText = useTranslation('topping(s)');
  const iceLevelText = useTranslation('Ice Level');
  const sugarLevelText = useTranslation('Sugar Level');
  const addedToCartText = useTranslation('Added to cart');
  const itemText = useTranslation('item');
  const itemsText = useTranslation('items');
  const paymentMethodText = useTranslation('Payment Method');
  const cashText = useTranslation('Cash');
  const cardText = useTranslation('Card');
  const selectPaymentText = useTranslation('Please select a payment method');
  const totalText = useTranslation('Total');
  const discountText = useTranslation('Discount');

  // Translate ice and sugar levels
  const iceLevels = useMemo(() => ICE_LEVELS, []);
  const sugarLevels = useMemo(() => SUGAR_LEVELS, []);
  const translatedIceLevels = useTranslations(iceLevels);
  const translatedSugarLevels = useTranslations(sugarLevels);

  // Translate categories and menu items
  const categories = useMemo(() => {
    return Object.keys(menuData || {}).filter(cat => cat !== 'Topping');
  }, [menuData]);
  
  const translatedCategories = useTranslations(categories);

  const allMenuItemNames = useMemo(() => {
    const names: string[] = [];
    Object.values(menuData).forEach(items => {
      items.forEach(item => names.push(item.item));
    });
    return names;
  }, [menuData]);

  const translatedMenuItemNames = useTranslations(allMenuItemNames);

  // Create a mapping for menu item translations
  const menuItemTranslationMap = useMemo(() => {
    const map: Record<string, string> = {};
    allMenuItemNames.forEach((name, index) => {
      map[name] = translatedMenuItemNames[index] || name;
    });
    return map;
  }, [allMenuItemNames, translatedMenuItemNames]);

  useEffect(() => {
    fetchWeatherAndMenu();
  }, []);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const fetchWeatherAndMenu = async () => {
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

      // Fetch menu
      const response = await fetch('/api/kiosk-menu');
      const data = await response.json();
      
      // Filter seasonal drinks based on current season
      const filteredData: MenuData = {};
      for (const [category, items] of Object.entries(data)) {
        if (category === 'Seasonal') {
          filteredData[category] = filterSeasonalDrinks(items as MenuItem[], season);
        } else {
          filteredData[category] = items as MenuItem[];
        }
      }
      
      setMenuData(filteredData);
      
      // Set first non-topping category as selected
      const categories = Object.keys(filteredData).filter(cat => cat !== 'Topping');
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemImage = (category: string) => {
    const imageMap: { [key: string]: string } = {
      'Milk Tea': '/milktea.png',
      'Fruit Tea': '/fruittea.png',
      'Smoothie': '/smoothie.png',
      'Specialty': '/specialty.png',
      'Seasonal': '/specialty.png'
    };
    return imageMap[category] || '/milktea.png'; // Default to milk tea image
  };

  const calculateCurrentPrice = () => {
    if (!selectedItem) return 0;
    return selectedItem.price + 
      customization.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
  };

  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomization({
      iceLevel: 'Regular',
      sugarLevel: '100%',
      selectedToppings: [],
      quantity: 1
    });
    setShowCustomization(true);
  };

  const toggleTopping = (topping: MenuItem) => {
    setCustomization(prev => ({
      ...prev,
      selectedToppings: prev.selectedToppings.find(t => t.id === topping.id)
        ? prev.selectedToppings.filter(t => t.id !== topping.id)
        : [...prev.selectedToppings, topping]
    }));
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const totalPrice = selectedItem.price + 
      customization.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);

    const cartItem: CartItem = {
      id: `${selectedItem.id}-${Date.now()}-${Math.random()}`,
      menuItem: selectedItem,
      iceLevel: customization.iceLevel,
      sugarLevel: customization.sugarLevel,
      toppings: customization.selectedToppings,
      quantity: customization.quantity,
      totalPrice: totalPrice * customization.quantity
    };

    setCart(prev => [...prev, cartItem]);
    
    // Show toast notification
    setToastMessage({
      itemName: menuItemTranslationMap[selectedItem.item] || selectedItem.item,
      quantity: customization.quantity
    });
    setShowToast(true);
    
    setShowCustomization(false);
    setSelectedItem(null);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity: newQuantity,
            totalPrice: (item.menuItem.price + 
              item.toppings.reduce((sum, topping) => sum + topping.price, 0)) * newQuantity
          }
        : item
    ));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    return (subtotal * discount) / 100;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const handleSpinComplete = (discountPercent: number) => {
    setDiscount(discountPercent);
    setHasSpun(true);
  };

  const handleCheckout = async () => {
    // Validate payment method is selected
    if (!paymentMethod) {
      setPaymentError(true);
      return;
    }

    if (isCheckingOut) return; // Prevent double submission

    setIsCheckingOut(true);

    try {
      // For now, kiosk orders are guest orders (customer_id = null)
      // In the future, you could implement customer phone login on kiosk
      const customerId = null;
      
      // Calculate total after discount
      const total = getTotal();

      // Send order to backend
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart,
          total,
          customerId,
          employeeId: null, // Kiosk orders have no employee
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear cart and reset spinner on success
        setCart([]);
        setDiscount(0);
        setHasSpun(false);
        setPaymentMethod(null);
        setPaymentError(false);
        alert(`Order placed successfully! Transaction ID: ${data.transactionId}`);
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred while placing your order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className={`text-black ${getTextSizeClass('xl')}`}>{loadingMenuText}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 flex">
      {/* Left Sidebar - Categories */}
      <div className="w-64 bg-white shadow-lg rounded-r-2xl">
        <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-200 text-gray-800 rounded-tr-2xl">
          <h1 className={`${getTextSizeClass('xl')} font-bold`}>{menuCategoriesText}</h1>
        </div>
        <nav className="p-4">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full text-left p-3 rounded-2xl mb-2 transition-all font-semibold ${getTextSizeClass('base')} ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 shadow-md'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50'
              }`}
            >
              {translatedCategories[index] || category}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content - Menu Items */}
      <div className="flex-1 p-6">
        <h2 className={`${getTextSizeClass('3xl')} font-bold text-gray-800 mb-6`}>
          {translatedCategories[categories.indexOf(selectedCategory)] || selectedCategory}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {menuData[selectedCategory]?.map((item) => (
            <div
              key={item.id}
              onClick={() => openCustomization(item)}
              className="bg-white p-6 rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-full h-32 bg-white rounded-2xl mb-4 flex items-center justify-center p-2">
                <img 
                  src={getItemImage(item.category)} 
                  alt={item.item}
                  className="max-w-full max-h-full object-contain rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <span className="text-gray-500 hidden">Image Placeholder</span>
              </div>
              <h3 className={`${getTextSizeClass('lg')} font-semibold text-gray-800 mb-2`}>
                {menuItemTranslationMap[item.item] || item.item}
              </h3>
              <p className={`${getTextSizeClass('lg')} text-purple-600 font-bold`}>${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Cart */}
      <div className="w-80 bg-white shadow-lg rounded-l-2xl flex flex-col">
        <div className="p-4 bg-gradient-to-r from-green-200 to-teal-300 text-gray-800 rounded-tl-2xl">
          <h2 className={`${getTextSizeClass('xl')} font-bold`}>{yourOrderText}</h2>
        </div>
        
        {/* Prize Spinner */}
        <div className="p-4 border-b border-gray-200">
          <PrizeSpinner onSpinComplete={handleSpinComplete} hasSpun={hasSpun} />
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-600px)]">
          {cart.length === 0 ? (
            <p className={`${getTextSizeClass('base')} text-gray-500 text-center`}>{yourCartIsEmptyText}</p>
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.id} className="mb-4 p-4 border border-gray-200 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800`}>
                    {menuItemTranslationMap[cartItem.menuItem.item] || cartItem.menuItem.item}
                  </h4>
                  <button
                    onClick={() => removeFromCart(cartItem.id)}
                    className={`${getTextSizeClass('lg')} text-red-500 hover:text-red-700 font-bold`}
                  >
                    ×
                  </button>
                </div>
                
                <p className={`${getTextSizeClass('sm')} text-gray-600`}>{iceText}: {cartItem.iceLevel}</p>
                <p className={`${getTextSizeClass('sm')} text-gray-600`}>{sugarText}: {cartItem.sugarLevel}</p>
                
                {cartItem.toppings.length > 0 && (
                  <p className={`${getTextSizeClass('sm')} text-gray-600`}>
                    {toppingsText}: {cartItem.toppings.map(t => menuItemTranslationMap[t.item] || t.item).join(', ')}
                  </p>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                      className="bg-white text-purple-600 px-3 py-1 rounded-l-lg border border-purple-200 hover:bg-purple-50"
                    >
                      -
                    </button>
                    <span className={`${getTextSizeClass('base')} bg-white text-gray-800 px-4 py-1 border-t border-b border-purple-200 font-semibold`}>{cartItem.quantity}</span>
                    <button
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                      className="bg-white text-purple-600 px-3 py-1 rounded-r-lg border border-purple-200 hover:bg-purple-50"
                    >
                      +
                    </button>
                  </div>
                  <span className={`${getTextSizeClass('lg')} font-bold text-purple-600`}>${cartItem.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className={`${getTextSizeClass('lg')} font-semibold text-gray-800`}>{subtotalText}:</span>
              <span className={`${getTextSizeClass('lg')} font-semibold text-gray-700`}>${getSubtotal().toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center">
                <span className={`${getTextSizeClass('lg')} font-semibold text-green-600`}>{discountText} ({discount}%):</span>
                <span className={`${getTextSizeClass('lg')} font-semibold text-green-600`}>-${getDiscountAmount().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className={`${getTextSizeClass('xl')} font-bold text-gray-800`}>{totalText}:</span>
              <span className={`${getTextSizeClass('xl')} font-bold text-purple-600`}>${getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          {cart.length > 0 && (
            <div className="mb-4">
              <h3 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{paymentMethodText}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaymentError(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cashText}
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod('card');
                    setPaymentError(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cardText}
                </button>
              </div>
              {paymentError && (
                <p className={`${getTextSizeClass('sm')} text-red-600 mt-2 text-center font-medium`}>
                  {selectPaymentText}
                </p>
              )}
            </div>
          )}

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            className={`w-full py-3 rounded-2xl font-bold transition-all shadow-lg ${
              cart.length === 0 || isCheckingOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : paymentError
                ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 hover:from-pink-300 hover:to-purple-400 ring-2 ring-red-400'
                : 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 hover:from-pink-300 hover:to-purple-400'
            }`}
          >
            {isCheckingOut ? 'Processing...' : checkoutText}
          </button>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <img 
                src={getItemImage(selectedItem.category)} 
                alt={selectedItem.item}
                className="w-16 h-16 object-contain rounded-2xl mr-4 bg-gradient-to-r from-pink-50 to-purple-50 p-2"
              />
              <div>
                <h3 className={`${getTextSizeClass('xl')} font-bold text-gray-800`}>
                  {menuItemTranslationMap[selectedItem.item] || selectedItem.item}
                </h3>
                <p className={`${getTextSizeClass('base')} text-gray-600`}>{basePriceText}: ${selectedItem.price.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Dynamic Total Price */}
            <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className={`${getTextSizeClass('lg')} font-semibold text-gray-800`}>{currentPriceText}:</span>
                <span className={`${getTextSizeClass('2xl')} font-bold text-purple-600`}>
                  ${(calculateCurrentPrice() * customization.quantity).toFixed(2)}
                </span>
              </div>
              {customization.selectedToppings.length > 0 && (
                <p className={`${getTextSizeClass('sm')} text-gray-600 mt-1`}>
                  {includesText} {customization.selectedToppings.length} {toppingsCountText}
                </p>
              )}
            </div>
            
            {/* Ice Level Selection */}
            <div className="mb-4">
              <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{iceLevelText}</h4>
              <div className="flex gap-2">
                {ICE_LEVELS.map((level, index) => (
                  <button
                    key={level}
                    onClick={() => setCustomization(prev => ({ ...prev, iceLevel: level }))}
                    className={`${getTextSizeClass('base')} px-4 py-2 rounded-xl font-medium transition-all ${
                      customization.iceLevel === level
                        ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-lg'
                        : 'bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 hover:from-pink-100 hover:to-purple-100'
                    }`}
                  >
                    {translatedIceLevels[index] || level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level Selection */}
            <div className="mb-4">
              <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{sugarLevelText}</h4>
              <div className="flex gap-2">
                {SUGAR_LEVELS.map((level, index) => (
                  <button
                    key={level}
                    onClick={() => setCustomization(prev => ({ ...prev, sugarLevel: level }))}
                    className={`${getTextSizeClass('base')} px-4 py-2 rounded-xl font-medium transition-all ${
                      customization.sugarLevel === level
                        ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-lg'
                        : 'bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 hover:from-pink-100 hover:to-purple-100'
                    }`}
                  >
                    {translatedSugarLevels[index] || level}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings Selection */}
            <div className="mb-4">
              <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{toppingsText}</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {menuData.Topping?.map((topping) => (
                  <label key={topping.id} className="flex items-center p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customization.selectedToppings.some(t => t.id === topping.id)}
                      onChange={() => toggleTopping(topping)}
                      className="mr-3 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className={`${getTextSizeClass('base')} text-gray-800 flex-1 font-medium`}>
                      {menuItemTranslationMap[topping.item] || topping.item}
                    </span>
                    <span className={`${getTextSizeClass('base')} text-purple-600 font-bold`}>+${topping.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{quantityText}</h4>
              <div className="flex items-center">
                <button
                  onClick={() => setCustomization(prev => ({ 
                    ...prev, 
                    quantity: Math.max(1, prev.quantity - 1) 
                  }))}
                  className="bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 px-4 py-2 rounded-l-xl border border-purple-200 hover:from-pink-100 hover:to-purple-100 font-semibold"
                >
                  -
                </button>
                <span className={`${getTextSizeClass('lg')} bg-white text-gray-800 px-6 py-2 border-t border-b border-purple-200 font-bold`}>{customization.quantity}</span>
                <button
                  onClick={() => setCustomization(prev => ({ 
                    ...prev, 
                    quantity: prev.quantity + 1 
                  }))}
                  className="bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 px-4 py-2 rounded-r-xl border border-purple-200 hover:from-pink-100 hover:to-purple-100 font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomization(false)}
                className={`${getTextSizeClass('base')} flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold`}
              >
                {cancelText}
              </button>
              <button
                onClick={addToCart}
                className={`${getTextSizeClass('base')} flex-1 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 py-3 rounded-xl hover:from-pink-300 hover:to-purple-400 transition-all font-bold shadow-lg`}
              >
                {addText} ${(calculateCurrentPrice() * customization.quantity).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div 
          onClick={() => setShowToast(false)}
          className={`fixed top-8 right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-5 rounded-2xl shadow-[0_10px_40px_rgba(34,197,94,0.5)] cursor-pointer transform transition-all duration-300 ease-in-out z-50 border-2 border-white ${
            showToast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[-100%] opacity-0 scale-95'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 bg-white rounded-full p-2">
              <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className={`${getTextSizeClass('xl')} font-bold mb-1`}>{addedToCartText}!</p>
              <p className={`${getTextSizeClass('lg')} font-medium`}>
                {toastMessage.itemName} × {toastMessage.quantity} {toastMessage.quantity === 1 ? itemText : itemsText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
