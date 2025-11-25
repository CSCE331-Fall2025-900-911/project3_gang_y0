'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/kiosk-menu');
      const data = await response.json();
      setMenuData(data);
      
      // Set first non-topping category as selected
      const categories = Object.keys(data).filter(cat => cat !== 'Topping');
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
      'Fruit Tea': '/fruitdtea.png',
      'Smoothie': '/smoothie.png',
      'Specialty': '/specialty.png'
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

  const categories = Object.keys(menuData).filter(cat => cat !== 'Topping');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 flex">
      {/* Left Sidebar - Categories */}
      <div className="w-64 bg-white shadow-lg rounded-r-2xl">
        <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-200 text-gray-800 rounded-tr-2xl">
          <h1 className="text-xl font-bold">Menu Categories</h1>
        </div>
        <nav className="p-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full text-left p-3 rounded-2xl mb-2 transition-all font-semibold ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 shadow-md'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50'
              }`}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content - Menu Items */}
      <div className="flex-1 p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">{selectedCategory}</h2>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.item}</h3>
              <p className="text-purple-600 font-bold text-lg">${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Cart */}
      <div className="w-80 bg-white shadow-lg rounded-l-2xl">
        <div className="p-4 bg-gradient-to-r from-green-200 to-teal-300 text-gray-800 rounded-tl-2xl">
          <h2 className="text-xl font-bold">Your Order</h2>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center">Your cart is empty</p>
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.id} className="mb-4 p-4 border border-gray-200 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800">{cartItem.menuItem.item}</h4>
                  <button
                    onClick={() => removeFromCart(cartItem.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">Ice: {cartItem.iceLevel}</p>
                <p className="text-sm text-gray-600">Sugar: {cartItem.sugarLevel}</p>
                
                {cartItem.toppings.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Toppings: {cartItem.toppings.map(t => t.item).join(', ')}
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
                    <span className="bg-white text-gray-800 px-4 py-1 border-t border-b border-purple-200 font-semibold">{cartItem.quantity}</span>
                    <button
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                      className="bg-white text-purple-600 px-3 py-1 rounded-r-lg border border-purple-200 hover:bg-purple-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-purple-600 text-lg">${cartItem.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-gray-800">Subtotal:</span>
            <span className="text-xl font-bold text-purple-600">${getSubtotal().toFixed(2)}</span>
          </div>
          <button className="w-full bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 py-3 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg">
            Checkout
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
                <h3 className="text-xl font-bold text-gray-800">{selectedItem.item}</h3>
                <p className="text-gray-600">Base price: ${selectedItem.price.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Dynamic Total Price */}
            <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Current Price:</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${(calculateCurrentPrice() * customization.quantity).toFixed(2)}
                </span>
              </div>
              {customization.selectedToppings.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Includes {customization.selectedToppings.length} topping(s)
                </p>
              )}
            </div>
            
            {/* Ice Level Selection */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Ice Level</h4>
              <div className="flex gap-2">
                {ICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setCustomization(prev => ({ ...prev, iceLevel: level }))}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      customization.iceLevel === level
                        ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-lg'
                        : 'bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 hover:from-pink-100 hover:to-purple-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level Selection */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Sugar Level</h4>
              <div className="flex gap-2">
                {SUGAR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setCustomization(prev => ({ ...prev, sugarLevel: level }))}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      customization.sugarLevel === level
                        ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-lg'
                        : 'bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 hover:from-pink-100 hover:to-purple-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings Selection */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Toppings</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {menuData.Topping?.map((topping) => (
                  <label key={topping.id} className="flex items-center p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customization.selectedToppings.some(t => t.id === topping.id)}
                      onChange={() => toggleTopping(topping)}
                      className="mr-3 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-800 flex-1 font-medium">{topping.item}</span>
                    <span className="text-purple-600 font-bold">+${topping.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Quantity</h4>
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
                <span className="bg-white text-gray-800 px-6 py-2 border-t border-b border-purple-200 font-bold text-lg">{customization.quantity}</span>
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
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={addToCart}
                className="flex-1 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 py-3 rounded-xl hover:from-pink-300 hover:to-purple-400 transition-all font-bold shadow-lg"
              >
                Add ${(calculateCurrentPrice() * customization.quantity).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
