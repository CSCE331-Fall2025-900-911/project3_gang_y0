'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  iceLevel?: string;
  size?: 'small' | 'medium' | 'large';
  sugar?: string;
  toppings?: string[];
}

const ICE_LEVELS = ['No Ice', 'Light', 'Regular', 'Extra'];

interface Customer {
  id: number;
  name: string;
  phonenumber: string;
  rewardspoints: number;
}

export default function Cashier() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<Season>('fall/spring');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [employeePosition, setEmployeePosition] = useState<string>('');
  const { getTextSizeClass } = useTextSize();

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          router.push('/employee-login');
          return;
        }
        const data = await response.json();
        setEmployeePosition(data.employee.position);
        setAuthChecked(true);
      } catch (error) {
        router.push('/employee-login');
      }
    };

    checkAuth();
  }, [router]);

  // Customization states
  const [showCustomization, setShowCustomization] = useState(false);
  const [customItem, setCustomItem] = useState<MenuItem | null>(null);
  const [iceLevel, setIceLevel] = useState<'hot' | 'cold'>('cold');
  const [iceLevelAmount, setIceLevelAmount] = useState<string>('Regular');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [sugarLevel, setSugarLevel] = useState<string>('100%');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const allToppings = ['Crystal Boba','Grass Jelly', 'Mini Boba', 'Red Bean'];
  
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
  const iceLevelText = useTranslation('Ice Level');
  const toppingsText = useTranslation('Toppings');
  const cancelText = useTranslation('Cancel');
  const addToCartText = useTranslation('Add to Cart');
  
  // Translate ice levels
  const translatedIceLevels = useTranslations(ICE_LEVELS);
  
  // Translate ice, size, and sugar values
  const hotValueText = useTranslation('hot');
  const coldValueText = useTranslation('cold');
  const smallValueText = useTranslation('small');
  const mediumValueText = useTranslation('medium');
  const largeValueText = useTranslation('large');
  
  // Helper function to translate cart item details
  const translateCartItemDetail = (type: 'ice' | 'size' | 'sugar' | 'iceLevel', value: string) => {
    if (type === 'ice') {
      return value === 'hot' ? hotValueText : coldValueText;
    }
    if (type === 'size') {
      if (value === 'small') return smallValueText;
      if (value === 'medium') return mediumValueText;
      if (value === 'large') return largeValueText;
    }
    if (type === 'iceLevel') {
      // Capitalize first letter of each word for ice level
      return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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

  const categories = [...new Set(menuItems
    .map((item) => item.category)
    .filter((cat) => cat.toLowerCase() !== "topping")
  )];

  const filteredItems = menuItems.filter(
    (item) => 
      item.category === selectedCategory &&
      item.category.toLowerCase() !== "topping"
  );


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
          cartItem.iceLevel === item.iceLevel &&
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

  const removeFromCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.ice === item.ice &&
          cartItem.iceLevel === item.iceLevel &&
          cartItem.size === item.size &&
          cartItem.sugar === item.sugar &&
          JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
      );
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter(
        (cartItem) =>
          !(
            cartItem.id === item.id &&
            cartItem.ice === item.ice &&
            cartItem.iceLevel === item.iceLevel &&
            cartItem.size === item.size &&
            cartItem.sugar === item.sugar &&
            JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
          )
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod(null);
    setOrderSubmitted(false);
    setDiscount(0);
    setCustomer(null);
    setCustomerPhone('');
  };

  // Helper function to calculate size-based price addition
  const getSizePrice = (size: 'small' | 'medium' | 'large'): number => {
    if (size === 'medium') return 1.00;
    if (size === 'large') return 2.00;
    return 0; // small has no extra charge
  };

  const calculateSubtotal = () => {
    // Price already includes size pricing when added to cart
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - discount);
  };

  const handleLookupCustomer = async () => {
    if (!customerPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setLoadingCustomer(true);
    try {
      const response = await fetch(`/api/rewards/cashier?phoneNumber=${encodeURIComponent(customerPhone)}`);
      const data = await response.json();

      if (data.success) {
        setCustomer(data.customer);
        setDiscount(0); // Reset discount when looking up new customer
      } else {
        alert(data.error || 'Customer not found');
        setCustomer(null);
      }
    } catch (error) {
      console.error('Error looking up customer:', error);
      alert('Failed to look up customer');
      setCustomer(null);
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleRedeemPoints = async (points: number) => {
    if (!customer) {
      alert('Please look up a customer first');
      return;
    }

    if (customer.rewardspoints < points) {
      alert(`Insufficient points. Customer has ${customer.rewardspoints} points.`);
      return;
    }

    try {
      const response = await fetch('/api/rewards/cashier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          pointsToRedeem: points
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update customer points
        setCustomer({
          ...customer,
          rewardspoints: data.remainingPoints
        });
        // Set discount
        setDiscount(parseFloat(data.discountAmount));
        alert(`Redeemed ${points} points for $${data.discountAmount} discount`);
      } else {
        alert(data.error || 'Failed to redeem points');
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      alert('Failed to redeem points');
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    const total = calculateTotal();

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          total: total,
          paymentMethod,
          customerId: customer?.id || null,
          discount: discount
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Add points if customer exists: $1 = 1 point (based on final total)
        if (customer && total > 0) {
          const pointsToAdd = Math.floor(total);
          if (pointsToAdd > 0) {
            try {
              await fetch('/api/rewards', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customerId: customer.id,
                  pointsToAdd: pointsToAdd
                }),
              });
              // Update customer points in UI
              setCustomer({
                ...customer,
                rewardspoints: customer.rewardspoints + pointsToAdd
              });
            } catch (error) {
              console.error('Error adding points:', error);
              // Don't fail the order if points addition fails
            }
          }
        }

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

  if (loading || !authChecked) {
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
          <div className="mb-6">
            <h1 className="font-bold text-gray-800 text-center">{cashierText}</h1>
          </div>

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
                  setIceLevelAmount('Regular');
                  setSize('small');
                  setSugarLevel('100%');
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

          {/* Customer Lookup Section */}
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <label className={`mb-2 block font-medium text-gray-700 ${getTextSizeClass('sm')}`}>
              Customer Phone Number
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLookupCustomer();
                  }
                }}
                placeholder="Enter phone number"
                className={`flex-1 rounded-lg border text-gray-700 border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none ${getTextSizeClass('base')}`}
              />
              <button
                onClick={handleLookupCustomer}
                disabled={loadingCustomer}
                className={`rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap flex-shrink-0 ${getTextSizeClass('sm')}`}
              >
                {loadingCustomer ? '...' : 'Lookup'}
              </button>
            </div>

            {customer && (
              <div className="mt-3 rounded-lg bg-green-50 p-3">
                <div className="text-sm font-semibold text-gray-800">{customer.name}</div>
                <div className="text-xs text-gray-600">{customer.phonenumber}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-700">Rewards Points:</span>
                  <span className="text-lg font-bold text-purple-600">{customer.rewardspoints}</span>
                </div>
                {customer.rewardspoints >= 10 && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleRedeemPoints(10)}
                      className="flex-1 rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                    >
                      Redeem $1 (10 pts)
                    </button>
                    {customer.rewardspoints >= 20 && (
                      <button
                        onClick={() => handleRedeemPoints(20)}
                        className="flex-1 rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                      >
                        Redeem $2 (20 pts)
                      </button>
                    )}
                    {customer.rewardspoints >= 50 && (
                      <button
                        onClick={() => handleRedeemPoints(50)}
                        className="flex-1 rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                      >
                        Redeem $5 (50 pts)
                      </button>
                    )}
                  </div>
                )}
                {discount > 0 && (
                  <div className="mt-2 text-sm font-semibold text-green-600">
                    Discount Applied: -${discount.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

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
                          {(() => {
                            const parts: string[] = [];
                            if (item.ice) {
                              parts.push(`${translateCartItemDetail('ice', item.ice)}`);
                            }
                            if (item.iceLevel && item.ice === 'cold') {
                              parts.push(`${translateCartItemDetail('iceLevel', item.iceLevel)} Ice`);
                            }
                            if (item.size) {
                              parts.push(translateCartItemDetail('size', item.size));
                            }
                            if (item.sugar) {
                              parts.push(translateCartItemDetail('sugar', item.sugar));
                            }
                            if (item.toppings && item.toppings.length > 0) {
                              parts.push(`Toppings: ${item.toppings.map(topping => toppingTranslationMap[topping] || topping).join(', ')}`);
                            }
                            return parts.join(', ');
                          })()}
                          <br />
                          ${item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item)}
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
                              iceLevel: item.iceLevel,
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-lg">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="text-gray-800">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-lg text-green-600">
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-2xl font-bold">
                      <span>{totalText}:</span>
                      <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-black">
          <div className="w-1/3 rounded-lg bg-white p-6 relative">
            <button
              onClick={() => setShowCustomization(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            >
              ×
            </button>
            <h2 className="mb-4 text-xl font-bold pr-8">{menuItemTranslationMap[customItem.item || customItem.name] || customItem.name} {customizationText}</h2>

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

            {/* Ice Level - only show for cold drinks, not for smoothies */}
            {iceLevel === 'cold' && customItem?.category?.toLowerCase() !== 'smoothie' && (
              <div className="mb-4">
                <label className="block mb-1">{iceLevelText}</label>
                <select
                  className="w-full rounded border p-2"
                  value={iceLevelAmount}
                  onChange={(e) => setIceLevelAmount(e.target.value)}
                >
                  {ICE_LEVELS.map((level, index) => (
                    <option key={level} value={level}>
                      {translatedIceLevels[index] || level}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                onClick={() => {
                  const sizePrice = getSizePrice(size);

                  // 🔹 Calculate total topping price dynamically from menuItems
                  const toppingsPrice = selectedToppings.reduce((sum, toppingName) => {
                    const toppingItem = menuItems.find(
                      (item) => item.category.toLowerCase() === 'topping' && item.name === toppingName
                    );
                    return sum + (toppingItem?.price || 0);
                  }, 0);

                  addToCart({
                    ...customItem,
                    price: customItem.price + sizePrice + toppingsPrice, // 🔹 Add topping price to total
                    ice: iceLevel,
                    iceLevel: iceLevel === 'cold' && customItem.category?.toLowerCase() !== 'smoothie' ? iceLevelAmount : undefined,
                    size,
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