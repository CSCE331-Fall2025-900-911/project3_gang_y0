'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { filterSeasonalDrinks, type Season } from '@/lib/seasonalDrinks';
import PrizeSpinner from '@/components/PrizeSpinner';
import { useTranslation, useTranslations } from '@/hooks/useTranslation';
import { useTextSize } from '@/contexts/TextSizeContext';
import RewardsModal from '@/app/components/RewardsModal';

interface MenuItem {
  id: number;
  item: string;
  category: string;
  price: number;
}

interface CartItem {
  id: string;
  menuItem: MenuItem;
  hotCold: 'hot' | 'cold';
  size: 'small' | 'medium' | 'large';
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
const HOT_COLD_OPTIONS: ('hot' | 'cold')[] = ['hot', 'cold'];
const SIZE_OPTIONS: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

export default function KioskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [menuData, setMenuData] = useState<MenuData>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customization, setCustomization] = useState({
    hotCold: 'cold' as 'hot' | 'cold',
    size: 'medium' as 'small' | 'medium' | 'large',
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds timeout
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
  const hotColdText = useTranslation('Hot / Cold');
  const sizeText = useTranslation('Size');
  const hotText = useTranslation('Hot');
  const coldText = useTranslation('Cold');
  const smallText = useTranslation('Small');
  const mediumText = useTranslation('Medium');
  const largeText = useTranslation('Large');
  const itemText = useTranslation('item');
  const itemsText = useTranslation('items');
  const paymentMethodText = useTranslation('Payment Method');
  const cashText = useTranslation('Cash');
  const cardText = useTranslation('Card');
  const selectPaymentText = useTranslation('Please select a payment method');
  const totalText = useTranslation('Total');
  const discountText = useTranslation('Discount');
  const orderConfirmedText = useTranslation('Order Confirmed');
  const yourOrderNumberText = useTranslation('Your Order Number');
  const thankYouText = useTranslation('Thank you for your order!');
  const pickUpText = useTranslation('Please pick up your order when called');
  const returningToLoginText = useTranslation('Returning to login in');
  const secondsText = useTranslation('seconds');
  const returnNowText = useTranslation('Return to Login Now');

  // Translate ice and sugar levels
  const iceLevels = useMemo(() => ICE_LEVELS, []);
  const sugarLevels = useMemo(() => SUGAR_LEVELS, []);
  const translatedIceLevels = useTranslations(iceLevels);
  const translatedSugarLevels = useTranslations(sugarLevels);
  
  // Translate hot/cold and size options
  const hotColdOptions = useMemo(() => ['Hot', 'Cold'], []);
  const sizeOptions = useMemo(() => ['Small', 'Medium', 'Large'], []);
  const translatedHotColdOptions = useTranslations(hotColdOptions);
  const translatedSizeOptions = useTranslations(sizeOptions);

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
    checkCustomerSession();
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

  // Countdown timer for confirmation page
  useEffect(() => {
    if (showConfirmation && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showConfirmation && timeRemaining === 0) {
      router.push('/login');
    }
  }, [showConfirmation, timeRemaining, router]);

  const checkCustomerSession = async () => {
    try {
      const response = await fetch('/api/auth/customer-check');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.customer) {
          setCustomerId(data.customer.id);
          setCustomerName(data.customer.name);
        }
      }
    } catch (error) {
      // Not logged in, that's fine
    }
  };

  const getFirstName = (fullName: string | null): string => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    checkCustomerSession(); // Refresh customer info
  };

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

  // Helper function to calculate size-based price addition
  const getSizePrice = (size: 'small' | 'medium' | 'large'): number => {
    if (size === 'medium') return 1.00;
    if (size === 'large') return 2.00;
    return 0; // small has no extra charge
  };

  const calculateCurrentPrice = () => {
    if (!selectedItem) return 0;
    const basePrice = selectedItem.price;
    const sizePrice = getSizePrice(customization.size);
    const toppingsPrice = customization.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    return basePrice + sizePrice + toppingsPrice;
  };

  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomization({
      hotCold: 'cold',
      size: 'medium',
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

    const basePrice = selectedItem.price;
    const sizePrice = getSizePrice(customization.size);
    const toppingsPrice = customization.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    const itemPrice = basePrice + sizePrice + toppingsPrice;
    const totalPrice = itemPrice * customization.quantity;

    const cartItem: CartItem = {
      id: `${selectedItem.id}-${Date.now()}-${Math.random()}`,
      menuItem: selectedItem,
      hotCold: customization.hotCold,
      size: customization.size,
      iceLevel: customization.iceLevel,
      sugarLevel: customization.sugarLevel,
      toppings: customization.selectedToppings,
      quantity: customization.quantity,
      totalPrice: totalPrice
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
              getSizePrice(item.size) +
              item.toppings.reduce((sum, topping) => sum + topping.price, 0)) * newQuantity
          }
        : item
    ));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getMostExpensiveItem = () => {
    if (cart.length === 0) return null;
    return cart.reduce((max, item) => 
      item.totalPrice > max.totalPrice ? item : max
    );
  };

  const getDiscountAmount = () => {
    // If discount is a percentage (from spinner), calculate percentage discount
    if (discount > 0 && discount < 100 && cart.length > 0) {
      const mostExpensiveItem = getMostExpensiveItem();
      if (!mostExpensiveItem) return 0;
      return (mostExpensiveItem.totalPrice * discount) / 100;
    }
    // If discount is a dollar amount (from rewards), use it directly
    return discount;
  };

  const getTotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount());
  };

  const handleSpinComplete = (discountPercent: number) => {
    setDiscount(discountPercent);
    setHasSpun(true);
  };

  const handleRedeemRewards = (points: number, discountAmount: number) => {
    setDiscount(discountAmount);
    setShowRewardsModal(false);
  };

  const handleCheckout = async () => {
    // Validate payment method is selected
    if (!paymentMethod) {
      setPaymentError(true);
      return;
    }

    if (isCheckingOut) return; // Prevent double submission

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);

    try {
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
          customerId: customerId || null,
          employeeId: null, // Kiosk orders have no employee
          discount: getDiscountAmount()
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add points if customer exists: $1 = 1 point (based on final total after discount)
        if (customerId && total > 0) {
          const pointsToAdd = Math.floor(total);
          if (pointsToAdd > 0) {
            try {
              await fetch('/api/rewards', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customerId: customerId,
                  pointsToAdd: pointsToAdd
                }),
              });
            } catch (error) {
              console.error('Error adding points:', error);
              // Don't fail the order if points addition fails
            }
          }
        }

        // Generate random 2-digit order number (10-99)
        const randomOrderNum = Math.floor(Math.random() * 90) + 10;
        setOrderNumber(randomOrderNum);
        
        // Clear cart and reset spinner on success
        setCart([]);
        setDiscount(0);
        setHasSpun(false);
        setPaymentMethod(null);
        setPaymentError(false);
        
        // Show confirmation page
        setShowConfirmation(true);
        setTimeRemaining(30); // Reset timer to 30 seconds
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
        {/* Customer Greeting / Login Section */}
        <div className="mb-6 flex items-center justify-between">
          {customerName ? (
            <h2 className={`${getTextSizeClass('2xl')} font-bold text-gray-800`}>
              Hi, {getFirstName(customerName)}!
            </h2>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className={`${getTextSizeClass('2xl')} font-bold text-gray-800 hover:text-purple-600 transition-colors cursor-pointer`}
            >
              Login for Rewards
            </button>
          )}
        </div>
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
          <div className="flex justify-between items-center">
            <h2 className={`${getTextSizeClass('xl')} font-bold`}>{yourOrderText}</h2>
            {customerId && (
              <button
                onClick={() => setShowRewardsModal(true)}
                className="px-3 py-1 bg-white bg-opacity-80 rounded-xl text-sm font-semibold hover:bg-opacity-100 transition-all"
              >
                Rewards
              </button>
            )}
          </div>
        </div>
        
        {/* Prize Spinner */}
        <div className="p-4 border-b border-gray-200">
          <PrizeSpinner onSpinComplete={handleSpinComplete} hasSpun={hasSpun} />
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-600px)]">
          {cart.length === 0 ? (
            <p className={`${getTextSizeClass('base')} text-gray-500 text-center`}>{yourCartIsEmptyText}</p>
          ) : (
            cart.map((cartItem) => {
              const mostExpensiveItem = getMostExpensiveItem();
              const isDiscountedItem = discount > 0 && mostExpensiveItem && cartItem.id === mostExpensiveItem.id;
              const itemDiscount = isDiscountedItem ? (cartItem.totalPrice * discount) / 100 : 0;
              const itemPriceAfterDiscount = cartItem.totalPrice - itemDiscount;
              
              return (
                <div key={cartItem.id} className={`mb-4 p-4 border rounded-2xl ${
                  isDiscountedItem 
                    ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800`}>
                        {menuItemTranslationMap[cartItem.menuItem.item] || cartItem.menuItem.item}
                      </h4>
                      {isDiscountedItem && (
                        <p className={`${getTextSizeClass('xs')} text-green-600 font-semibold mt-1`}>
                          🎉 {discount}% OFF applied!
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(cartItem.id)}
                      className={`${getTextSizeClass('lg')} text-red-500 hover:text-red-700 font-bold`}
                    >
                      ×
                    </button>
                  </div>
                  
                  <p className={`${getTextSizeClass('sm')} text-gray-600`}>{hotColdText}: {cartItem.hotCold === 'hot' ? hotText : coldText}</p>
                  <p className={`${getTextSizeClass('sm')} text-gray-600`}>{sizeText}: {cartItem.size === 'small' ? smallText : cartItem.size === 'medium' ? mediumText : largeText}</p>
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
                    <div className="text-right">
                      {isDiscountedItem ? (
                        <div>
                          <span className={`${getTextSizeClass('sm')} text-gray-500 line-through mr-2`}>${cartItem.totalPrice.toFixed(2)}</span>
                          <span className={`${getTextSizeClass('lg')} font-bold text-green-600`}>${itemPriceAfterDiscount.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className={`${getTextSizeClass('lg')} font-bold text-purple-600`}>${cartItem.totalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className={`${getTextSizeClass('lg')} font-semibold text-gray-800`}>{subtotalText}:</span>
              <span className={`${getTextSizeClass('lg')} font-semibold text-gray-700`}>${getSubtotal().toFixed(2)}</span>
            </div>
            {getDiscountAmount() > 0 && (
              <div className="flex justify-between items-center">
                <span className={`${getTextSizeClass('lg')} font-semibold text-green-600`}>
                  {discountText} {discount > 0 && discount < 100 ? `(${discount}% applied!)` : '(Rewards)'}:
                </span>
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
            className={`w-full py-3 rounded-2xl font-bold transition-all shadow-lg mb-2 ${
              cart.length === 0 || isCheckingOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : paymentError
                ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 hover:from-pink-300 hover:to-purple-400 ring-2 ring-red-400'
                : 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 hover:from-pink-300 hover:to-purple-400'
            }`}
          >
            {isCheckingOut ? 'Processing...' : checkoutText}
          </button>
          
          <button 
            onClick={() => router.push('/login')}
            className={`w-full py-3 rounded-2xl font-bold transition-all shadow-lg bg-gray-200 text-gray-700 hover:bg-gray-300 ${getTextSizeClass('base')}`}
          >
            {cancelText}
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
            
            {/* Hot/Cold Selection */}
            <div className="mb-4">
              <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{hotColdText}</h4>
              <div className="flex gap-2">
                {HOT_COLD_OPTIONS.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => setCustomization(prev => ({ ...prev, hotCold: option }))}
                    className={`${getTextSizeClass('base')} px-4 py-2 rounded-xl font-medium transition-all ${
                      customization.hotCold === option
                        ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-lg'
                        : 'bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 hover:from-pink-100 hover:to-purple-100'
                    }`}
                  >
                    {translatedHotColdOptions[index] || (option === 'hot' ? hotText : coldText)}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-4">
              <h4 className={`${getTextSizeClass('base')} font-semibold text-gray-800 mb-2`}>{sizeText}</h4>
              <div className="flex gap-2">
                {SIZE_OPTIONS.map((option, index) => {
                  const sizeLabel = translatedSizeOptions[index] || (option === 'small' ? smallText : option === 'medium' ? mediumText : largeText);
                  const priceAddition = getSizePrice(option);
                  const displayText = priceAddition > 0 
                    ? `${sizeLabel} +$${priceAddition.toFixed(2)}`
                    : sizeLabel;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => setCustomization(prev => ({ ...prev, size: option }))}
                      className={`${getTextSizeClass('base')} px-4 py-2 rounded-xl font-medium transition-all ${
                        customization.size === option
                          ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-lg'
                          : 'bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 hover:from-pink-100 hover:to-purple-100'
                      }`}
                    >
                      {displayText}
                    </button>
                  );
                })}
              </div>
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

      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-3xl max-w-2xl w-full mx-4 shadow-2xl text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-6">
                <svg className="w-24 h-24 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Order Confirmed */}
            <h2 className={`${getTextSizeClass('4xl')} font-bold text-gray-800 mb-4`}>
              {orderConfirmedText}!
            </h2>

            {/* Order Number */}
            <div className="mb-8">
              <p className={`${getTextSizeClass('xl')} text-gray-600 mb-3`}>{yourOrderNumberText}</p>
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl py-6 px-8 inline-block">
                <p className={`${getTextSizeClass('6xl')} font-bold text-purple-600`}>
                  #{orderNumber}
                </p>
              </div>
            </div>

            {/* Thank You Message */}
            <p className={`${getTextSizeClass('2xl')} text-gray-700 mb-2 font-semibold`}>
              {thankYouText}
            </p>
            <p className={`${getTextSizeClass('lg')} text-gray-600 mb-8`}>
              {pickUpText}
            </p>

            {/* Timer */}
            <div className="mb-6">
              <p className={`${getTextSizeClass('base')} text-gray-500`}>
                {returningToLoginText} {timeRemaining} {secondsText}
              </p>
            </div>

            {/* Return Button */}
            <button
              onClick={() => router.push('/login')}
              className={`${getTextSizeClass('xl')} bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 px-12 py-4 rounded-2xl hover:from-pink-300 hover:to-purple-400 transition-all font-bold shadow-lg`}
            >
              {returnNowText}
            </button>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      <RewardsModal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        onRedeem={handleRedeemRewards}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Customer Login</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <KioskLoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

// Login Form Component for Kiosk
function KioskLoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Phone number not found');
        setLoading(false);
        return;
      }

      // Success
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold text-gray-800 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLogin();
            }
          }}
          className={`w-full px-4 py-3 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all`}
          placeholder="Enter your phone number"
          disabled={loading}
        />
        {error && (
          <p className="mt-2 text-red-600 text-sm">{error}</p>
        )}
      </div>
      
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full px-4 py-3 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}
