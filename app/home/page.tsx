"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { io } from "socket.io-client";
import { useCart } from "../context/cartContext";
import Homeslider from "../home/Homeslider";
import Link from "next/link";
import CheckoutModal from "../component/CheckoutModal";
import RatingStars from "../component/RatingStars";



type LabTest = {
  _id: string;
  name: string;
  healthConcern: string;
  price: number;
  image?: string;
  discount?: number;
  rating?: number;
  reviews?: any[];
};

type Product = {
  _id: string;
  title: string;
  description: string;
  image?: string;
  amount?: number;
  discount?: number;
  rating?: number;
  reviews?: any[];
};

type CartItem = (Product | LabTest) & { qty: number };

export default function Home() {
  const { addToCart } = useCart();

  // backend path required when host the website on server  


  const normalizeImage = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `http://localhost:5000${img}`;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPopup, setShowPopup] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    labTests: LabTest[];
    doctors: boolean;
  } | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedItemForCheckout, setSelectedItemForCheckout] = useState<Product | LabTest | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");


  // backend path required when host the website on server  

  const PRODUCT_URL = "http://localhost:5000/api/products";
  const LAB_URL = "http://localhost:5000/api/health-products";
  const SOCKET_URL = "http://localhost:5000";

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await axios.get(PRODUCT_URL);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch health products
  const fetchLabTests = async () => {
    try {
      const res = await axios.get(LAB_URL);
      const items = res.data.map((t: any) => ({ ...t, image: normalizeImage(t.image), createdAt: t.createdAt }));
      items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLabTests(items);
    } catch (err) {
      console.error(err);
    }
  };

  // Search handler
  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    // Filter products by title or description
    const filteredProducts = products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );

    // Filter lab tests by name or health concern
    const filteredLabTests = labTests.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.healthConcern && t.healthConcern.toLowerCase().includes(query))
    );

    // Check if query matches doctor-related keywords
    const isDoctorQuery = ["doctor", "appointment", "consultant", "physician", "medical"].some(
      (keyword) => query.includes(keyword)
    );

    setSearchResults({
      products: filteredProducts,
      labTests: filteredLabTests,
      doctors: isDoctorQuery,
    });
    setHasSearched(true);
  };

  // Handle Enter key in search input
  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Initial fetch & socket connection
  useEffect(() => {
    fetchProducts();
    fetchLabTests();

    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("product-updated", () => fetchProducts());
    s.on("labtest-updated", () => fetchLabTests());

    return () => { s.disconnect(); };
  }, []);

  // Add item to cart
  const handleAddToCart = (item: Product | LabTest) => {
    // local cart preview
    const exists = cart.find((i) => i._id === item._id);
    if (exists) {
      setCart(cart.map((i) => (i._id === item._id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...item, qty: 1 } as CartItem]);
    }

    // The context addToCart expects the product object (see app/context/cartContext.tsx)
    try {
      // If item is a Product-like object expected by context, pass minimal shape
      addToCart({ _id: item._id, title: (item as any).title || (item as any).name, amount: (item as any).amount || (item as any).price || 0 });
    } catch (e) {
      // fallback: ignore context errors
      console.error("addToCart context error:", e);
    }

    setShowPopup((item as any).title || (item as any).name);
    setTimeout(() => setShowPopup(null), 3000);
  };

  // Buy Now - Open Checkout Modal
  const handleBuyNow = (item: Product | LabTest) => {
    setSelectedItemForCheckout(item);
    setShowCheckoutModal(true);
  };

  // Handle Checkout Success
  const handleCheckoutSuccess = (message: string, order?: any) => {
    setCheckoutMessage(message);
    setShowCheckoutModal(false);
    setSelectedItemForCheckout(null);
    setTimeout(() => setCheckoutMessage(""), 5000);
    if (socket && order) socket.emit("new-order", order);
  };
  // type of medicens

  const phamnacyTypes = [
    { name: "Medicine", image: "/images/medicine.jpg" },
    { name: "Lab Test", image: "/images/blood-sample.jpg" },
    { name: "Doctor Appointment", image: "/images/doctor.png" },
    { name: "Health Products", image: "/images/heart.jpeg" },
  ];
  // Removed Typed.js usage as 'Typed' is not defined or imported.
  // If you want to use Typed.js, install it and initialize inside useEffect.

  // brands 
  const brands = [
    { name: "Cipla", logo: "/images/cipla.png" },
    { name: "Sun Pharma", logo: "/images/sunpharma.png" },
    { name: "Dr. Reddy's", logo: "/images/drreddys.png" },
    { name: "Lupin", logo: "/images/lupin.png" },
    { name: "Abbott", logo: "/images/abbott.png" },
    { name: "Dabur", logo: "/images/dabur.png" },
    { name: "Himalaya", logo: "/images/himalaya.png" },
    { name: "Baidyanath", logo: "/images/baidyanath.png" },
    { name: "Vicks", logo: "/images/vicks.png" },
    { name: "Dolo", logo: "/images/dolo1.png" },
  ];

  return (
    <div className="p-6">
      {/* Header / Search */}
      <div className="flex justify-around items-center pt-7 text-black">
        <div>
          <h3 className="text-sm sm:text-lg font-bold text-center" id="multiple-text">What are you looking for?</h3>
        </div>
        <div className="ml-4">
          <div className="flex pt-6">
            <span>Order with prescription.</span>
            <button className="text-blue-300 hover:text-blue-500 ml-2">Upload Now</button>
          </div>
        </div>
      </div>
      {/* Search Bar */}
      <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden">

          {/* Input Field */}
          <input
            type="text"
            placeholder="Search for medicines and health products"
            className="flex-1 px-4 py-2 outline-none text-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchInputKeyDown}
          />

          {/* Search Button */}
          <button 
            className="px-5 py-2 bg-white hover:bg-gray-200 font-medium cursor-pointer"
            onClick={handleSearch}
          >
            Search
          </button>

        </div>

      </div>

      {/* Search Results Section */}
      {hasSearched && searchResults && (
        <div className="mt-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Search Results for "{searchQuery}"</h2>

          {/* Products Results */}
          {searchResults.products.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.products.map((p) => (
                  <div key={p._id} className="bg-white rounded-2xl shadow p-4 flex flex-col relative duration-300 hover:z-10 hover:scale-105 hover:shadow-xl">
                    <div className="relative">
                      {p.image ? (
                        <Image src={normalizeImage(p.image)!} alt={p.title} width={300} height={200} className="rounded-lg object-cover" />
                      ) : (
                        <Image src="/images/medicine.jpg" alt="placeholder" width={300} height={200} className="rounded-lg object-cover" />
                      )}
                      {p.discount && p.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                          {p.discount}% OFF
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mt-3">{p.title}</h3>
                    <p className="text-sm text-gray-600 flex-1">{p.description}</p>
                    
                    {/* Rating */}
                    <div className="mt-2 mb-2">
                      <RatingStars rating={p.rating || 0} reviewCount={p.reviews?.length || 0} size="sm" />
                    </div>

                    {/* Price Display */}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-lg">
                        ₹{p.discount && p.discount > 0 ? (p.amount! * (1 - p.discount / 100)).toFixed(2) : p.amount}
                      </p>
                      {p.discount && p.discount > 0 && (
                        <p className="text-sm text-gray-500 line-through">₹{p.amount}</p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded" onClick={() => handleAddToCart(p)}>Add to Cart</button>
                      <button className="bg-green-600 hover:bg-green-800 text-white px-3 py-1 rounded" onClick={() => handleBuyNow(p)}>Buy Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Tests Results */}
          {searchResults.labTests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Health Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.labTests.map((test) => (
                  <div key={test._id} className="bg-white rounded-2xl shadow p-4 flex flex-col relative duration-300 hover:z-10 hover:scale-105 hover:shadow-xl">
                    <div className="relative">
                      {test.image ? (
                        <Image src={test.image} alt={test.name} width={300} height={200} className="rounded-lg object-cover" />
                      ) : (
                        <Image src="/images/blood-sample.jpg" alt="placeholder" width={300} height={200} className="rounded-lg object-cover" />
                      )}
                      {test.discount && test.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                          {test.discount}% OFF
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mt-3">{test.name}</h3>
                    <p className="text-sm text-gray-600 flex-1">{test.healthConcern}</p>
                    
                    {/* Rating */}
                    <div className="mt-2 mb-2">
                      <RatingStars rating={test.rating || 0} reviewCount={test.reviews?.length || 0} size="sm" />
                    </div>

                    {/* Price Display */}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-lg">
                        ₹{test.discount && test.discount > 0 ? (test.price * (1 - test.discount / 100)).toFixed(2) : test.price}
                      </p>
                      {test.discount && test.discount > 0 && (
                        <p className="text-sm text-gray-500 line-through">₹{test.price}</p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded" onClick={() => handleAddToCart(test)}>Add to Cart</button>
                      <button className="bg-green-600 hover:bg-green-800 text-white px-3 py-1 rounded" onClick={() => handleBuyNow(test)}>Buy Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Appointments Link */}
          {searchResults.doctors && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Looking for Doctor Appointments?</h3>
              <Link href="/doctors" className="inline-block">
                <button className="bg-purple-600 hover:bg-purple-800 text-white px-6 py-3 rounded-lg font-semibold">
                  Book Doctor Appointment
                </button>
              </Link>
            </div>
          )}

          {/* No Results Message */}
          {searchResults.products.length === 0 && searchResults.labTests.length === 0 && !searchResults.doctors && (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-500 mt-2">Try searching for different keywords</p>
            </div>
          )}
        </div>
      )}

      <div>
        <h1>Medicinal Solutions o </h1>
      </div>
      <h1 className="text-2xl font-bold mb-4">Brand and company for medicines</h1>
      <div className="">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="flex space-x-4 py-5 px-4 sm:px-2 md:px-3">
            {brands.map((brand, index) => (
              <div
                key={index}
                className="
            flex-shrink-0 
            w-20 sm:w-20 md:w-24 lg:w-30 
            h-20 sm:h-20 md:h-24 lg:h-30 
            bg-white 
            rounded-full 
            shadow-md 
            flex flex-col items-center justify-center 
            p-3 
            hover:scale-105 
            transition-transform duration-300
          "
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-8 sm:w-10 md:w-15 lg:w-12 h-7 sm:h-6 md:h-10 lg:h-15 object-contain mb-2 hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700 text-center">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Category Section */}
     
      <div>
        <h1 className="text-2xl font-bold mb-4">Types of Services</h1>
        <div>
          <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="flex space-x-4 py-5 px-4 sm:px-2 md:px-3">
              {phamnacyTypes.map((type, index) => {
                const isLab = type.name.toLowerCase().includes("lab");
                const isDoctor = type.name.toLowerCase().includes("doctor");
                const tile = (
                  <div className={
                    `flex-shrink-0 w-30 h-30 bg-white rounded-full shadow-md flex flex-col items-center justify-center p-3 hover:scale-105 transition-transform duration-300`
                  }>
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700 text-center">{type.name}</span>
                  </div>
                );

                if (isLab) return (
                  <Link href="/lab-tests" key={index} className="no-underline">
                    {tile}
                  </Link>
                );

                if (isDoctor) return (
                  <Link href="/doctors" key={index} className="no-underline">
                    {tile}
                  </Link>
                );

                return <div key={index}>{tile}</div>;
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Products Grid */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Medicine</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {products.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl shadow p-4 flex flex-col relative duration-300 hover:z-10 hover:scale-105 hover:shadow-xl">
            {/* Image Container with Discount Badge */}
            <div className="relative">
              {p.image ? (
                <Image src={normalizeImage(p.image)!} alt={p.title} width={300} height={200} className="rounded-lg object-cover" />
              ) : (
                <Image src="/images/medicine.jpg" alt="placeholder" width={300} height={200} className="rounded-lg object-cover" />
              )}
              {p.discount && p.discount > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                  {p.discount}% OFF
                </div>
              )}
            </div>

            <h3 className="font-semibold text-lg mt-3">{p.title}</h3>
            <p className="text-sm text-gray-600 flex-1">{p.description}</p>

            {/* Rating */}
            <div className="mt-2 mb-2">
              <RatingStars rating={p.rating || 0} reviewCount={p.reviews?.length || 0} size="sm" />
            </div>

            {/* Price Display */}
            <div className="flex items-center gap-2 mb-2">
              <p className="font-bold text-lg">
                ₹{p.discount && p.discount > 0 ? (p.amount! * (1 - p.discount / 100)).toFixed(2) : p.amount}
              </p>
              {p.discount && p.discount > 0 && (
                <p className="text-sm text-gray-500 line-through">₹{p.amount}</p>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded" onClick={() => handleAddToCart(p)}>Add to Cart</button>
              <button className="bg-green-600 hover:bg-green-800 text-white px-3 py-1 rounded" onClick={() => handleBuyNow(p)}>Buy Now</button>
            </div>
          </div>
        ))}
      </div>
      <div id="health-products-section" className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Health Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {labTests.map((t) => (
            <div key={t._id} className="bg-white rounded-2xl shadow p-4 flex flex-col relative duration-300 hover:z-10 hover:scale-105 hover:shadow-xl">
              <div className="relative">
                {t.image ? (
                  <Image src={t.image} alt={t.name} width={300} height={200} className="rounded-lg object-cover" />
                ) : (
                  <Image src="/images/heart.jpeg" alt="placeholder" width={300} height={200} className="rounded-lg object-cover" />
                )}
              </div>
              <h3 className="font-semibold text-lg mt-3">{t.name}</h3>
              <p className="text-sm text-gray-600 flex-1">{t.healthConcern}</p>
              <div className="mt-2 mb-2">
                <p className="font-bold text-lg">₹{t.price}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded" onClick={() => handleAddToCart(t)}>Add to Cart</button>
                <button className="bg-green-600 hover:bg-green-800 text-white px-3 py-1 rounded" onClick={() => handleBuyNow(t)}>Buy Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Blog Section */}
      <div>
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Blog </h1>
          <div>
        {/* <h1>image slied</h1> */}
        <Homeslider />
      </div>

      </div>

      {/* Cart Preview */}
      {
        cart.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white shadow p-4 rounded-lg z-50">
            <h3 className="font-bold mb-2">Cart</h3>
            {cart.map((item) => (
              <div key={item._id} className="flex justify-between">
                <span>{(item as any).title || (item as any).name} x {item.qty}</span>
                <span>₹{(((item as any).amount || (item as any).price || 100) * item.qty)}</span>
              </div>
            ))}
            <div className="font-bold mt-2">
              Total: ₹{cart.reduce((sum, i) => sum + (((i as any).amount || (i as any).price || 100) * i.qty), 0)}
            </div>
          </div>
        )
      }

      {/* Pop-up Notification */}
      {
        showPopup && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
            {showPopup} added to cart!
          </div>
        )
      }

      {/* Checkout Success Message */}
      {
        checkoutMessage && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {checkoutMessage}
          </div>
        )
      }

      {/* Checkout Modal */}
      {showCheckoutModal && selectedItemForCheckout && (
        <CheckoutModal
          item={selectedItemForCheckout}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedItemForCheckout(null);
          }}
          onSuccess={handleCheckoutSuccess}
          normalizeImage={normalizeImage}
        />
      )}
    </div >
  );
}
