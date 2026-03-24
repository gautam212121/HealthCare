'use client';
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

//  4    backend path required when host the website on server  


// --- Types ---
type Product = { _id: string; title: string; description: string; amount: number; image: string };
type LabTest = { _id: string; name: string; healthConcern: string; price: number; image?: string; };
type LabTestForm = { _id?: string; name: string; healthConcern: string; price: string; image?: string; preview?: string | null };
type OrderItem = { title: string; qty: number; price: number };
type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Accepted" | "Rejected" | "Shipped" | "Delivered";
  age?: number;
  gender?: string;
  testType?: string;
  doctorType?: string;
  paymentMethod?: string;
};

// --- AdminPanel Component ---
export default function AdminPanel() {
  // Helper to normalize image path returned by backend 


  // backend path required when host the website on server  


  const normalizeImage = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `http://localhost:5000${img}`;
  };

  // Helper to denormalize image path before sending to backend (extract relative path)

    // backend path required when host the website on server  

  const denormalizeImage = (img?: string | null) => {
    if (!img) return null;
    if (img.includes("http://localhost:5000")) return img.replace("http://localhost:5000", "");
    if (img.startsWith("/")) return img;
    return null;
  };

  // Helper to choose correct image src for previews (handle blob URLs and remote URLs)
  const getImageSrc = (src?: string | null) => {
    if (!src) return undefined;
    if (src.startsWith("blob:") || src.startsWith("data:")) return src;
    return normalizeImage(src) || undefined;
  };

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [credentials, setCredentials] = useState({ id: "", password: "" });

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ title: "", description: "", amount: "", image: "", preview: "" as string | null });
  const [editProduct, setEditProduct] = useState({ title: "", description: "", amount: "", image: "", preview: "" as string | null });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Lab Tests
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [newTest, setNewTest] = useState<LabTestForm>({ name: "", healthConcern: "", price: "", image: "", preview: null });
  const [editLabTest, setEditLabTest] = useState<LabTestForm>({ _id: "", name: "", healthConcern: "", price: "", image: "", preview: null });
  const [editingLabTestId, setEditingLabTestId] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"products" | "health" | "orders">("products");
  const productsRef = useRef<HTMLDivElement | null>(null);
  const healthRef = useRef<HTMLDivElement | null>(null);
  const ordersRef = useRef<HTMLDivElement | null>(null);

  // Socket
  const [socket, setSocket] = useState<Socket | null>(null);



    // backend path required when host the website on server  


  // API URLs
  const API_URL = "http://localhost:5000/api/products";
  const LABTEST_URL = "http://localhost:5000/api/health-products";
  const ORDER_URL = "http://localhost:5000/api/orders";
  const UPLOAD_URL = "http://localhost:5000/api/upload";

  // --- Login ---
  const handleLogin = () => {
    if (credentials.id === "ajeet21" && credentials.password === "12345") setIsLoggedIn(true);
    else alert("Invalid credentials");
  };

  // --- Fetch functions ---
  const fetchProducts = async () => { try { const res = await axios.get(API_URL); setProducts(res.data); } catch (err) { console.error(err); } };
  const fetchLabTests = async () => { try { const res = await axios.get(LABTEST_URL); const items = res.data.map((t: any) => ({ ...t, image: normalizeImage(t.image), createdAt: t.createdAt })); items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); setLabTests(items); } catch (err) { console.error(err); } };
  const fetchOrders = async () => { try { const res = await axios.get<Order[]>(ORDER_URL); setOrders(res.data); } catch (err) { console.error(err); } };

  // --- Socket.IO ---
  useEffect((): (() => void) | void => {
    if (!isLoggedIn) return;

    fetchProducts();
    fetchLabTests();
    fetchOrders();

  // backend path required when host the website on server  


    const s = io("http://localhost:5000");
    setSocket(s);

    s.on("product-updated", fetchProducts);
    s.on("labtest-updated", fetchLabTests);
    s.on("order-updated", fetchOrders);
    s.on("new-order", (order: Order) => setOrders(prev => [order, ...prev]));

    return () => s.disconnect();
  }, [isLoggedIn]);

  // --- Image Upload ---
  const handleImageUpload = async (file: File, editing = false, labTest = false) => {
    const previewUrl = URL.createObjectURL(file);
    if (editing) {
      if (labTest) setEditLabTest(prev => ({ ...prev, preview: previewUrl }));
      else setEditProduct(prev => ({ ...prev, preview: previewUrl }));
    } else {
      if (labTest) setNewTest(prev => ({ ...prev, preview: previewUrl }));
      else setNewProduct(prev => ({ ...prev, preview: previewUrl }));
    }

    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await axios.post(UPLOAD_URL, formData, { headers: { "Content-Type": "multipart/form-data" } });
      // store normalized image URL in state so frontend always has full URL
      const normalized = normalizeImage(res.data.imageUrl) || res.data.imageUrl;
      if (editing) {
        if (labTest) setEditLabTest(prev => ({ ...prev, image: normalized }));
        else setEditProduct(prev => ({ ...prev, image: normalized }));
      } else {
        if (labTest) setNewTest(prev => ({ ...prev, image: normalized }));
        else setNewProduct(prev => ({ ...prev, image: normalized }));
      }
    } catch (err: any) { alert("Image upload failed: " + err.message); }
  };

  // --- Product Handlers ---
  const handleAddProduct = async () => {
    if (!newProduct.title || !newProduct.description || !newProduct.amount || !newProduct.image) return alert("Fill all fields");
    const imageToSend = denormalizeImage(newProduct.image) || newProduct.image;
    const res = await axios.post(API_URL, { title: newProduct.title, description: newProduct.description, amount: Number(newProduct.amount), image: imageToSend });
    setProducts(prev => [res.data, ...prev]);
    setNewProduct({ title: "", description: "", amount: "", image: "", preview: "" });
    socket?.emit("product-updated");
  };
  const handleUpdateProduct = async (id: string) => {
    const imageToSend = denormalizeImage(editProduct.image) || editProduct.image;
    const res = await axios.put(`${API_URL}/${id}`, { title: editProduct.title, description: editProduct.description, amount: Number(editProduct.amount), image: imageToSend });
    setProducts(prev => prev.map(p => p._id === id ? res.data : p));
    setEditingProductId(null);
    setEditProduct({ title: "", description: "", amount: "", image: "", preview: "" });
    socket?.emit("product-updated");
  };
  const handleDeleteProduct = async (id: string) => { await axios.delete(`${API_URL}/${id}`); setProducts(prev => prev.filter(p => p._id !== id)); socket?.emit("product-updated"); };

  // --- Helth products Handlers ---
  const handleAddLabTest = async () => {
    if (!newTest.name || !newTest.healthConcern || !newTest.price || !newTest.image) return alert("Fill all fields");
    const imageToSend = denormalizeImage(newTest.image) || newTest.image;
    const res = await axios.post(LABTEST_URL, { name: newTest.name, healthConcern: newTest.healthConcern, price: Number(newTest.price), image: imageToSend });
    const item = { ...res.data, image: normalizeImage(res.data.image) };
    setLabTests(prev => [item, ...prev]);
    setNewTest({ name: "", healthConcern: "", price: "", image: "", preview: null });
    socket?.emit("labtest-updated");
  };
  const handleUpdateLabTest = async (id: string) => {
    const imageToSend = denormalizeImage(editLabTest.image) || editLabTest.image;
    const res = await axios.put(`${LABTEST_URL}/${id}`, { name: editLabTest.name, healthConcern: editLabTest.healthConcern, price: Number(editLabTest.price), image: imageToSend });
    const item = { ...res.data, image: normalizeImage(res.data.image) };
    setLabTests(prev => prev.map(t => t._id === id ? item : t));
    setEditingLabTestId(null);
    setEditLabTest({ _id: "", name: "", healthConcern: "", price: "", image: "", preview: null });
    socket?.emit("labtest-updated");
  };
  const handleDeleteLabTest = async (id: string) => { await axios.delete(`${LABTEST_URL}/${id}`); setLabTests(prev => prev.filter(t => t._id !== id)); socket?.emit("labtest-updated"); };

  // --- Order Handlers ---
  const handleAcceptOrder = async (id: string) => { await axios.put(`${ORDER_URL}/${id}`, { status: "Accepted" }); setOrders(prev => prev.map(o => o._id === id ? { ...o, status: "Accepted" } : o)); socket?.emit("order-updated"); };
  const handleRejectOrder = async (id: string) => { await axios.put(`${ORDER_URL}/${id}`, { status: "Rejected" }); setOrders(prev => prev.map(o => o._id === id ? { ...o, status: "Rejected" } : o)); socket?.emit("order-updated"); };
  const handleUpdateOrderStatus = async (id: string, newStatus: "Pending" | "Accepted" | "Shipped" | "Delivered" | "Rejected") => { 
    if (newStatus === "Rejected") { await handleRejectOrder(id); return; }
    await axios.put(`${ORDER_URL}/${id}`, { status: newStatus }); 
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus as Order["status"] } : o)); 
    socket?.emit("order-updated"); 
  };

  // --- Login Render ---
  // if (!isLoggedIn) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
  //       <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
  //         <h1 className="text-3xl font-bold text-center mb-6">Admin Login</h1>
  //         <div className="space-y-4">
  //           <input 
  //             type="text" 
  //             placeholder="Admin ID" 
  //             value={credentials.id} 
  //             onChange={e => setCredentials({ ...credentials, id: e.target.value })} 
  //             className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
  //           />
  //           <input 
  //             type="password" 
  //             placeholder="Password" 
  //             value={credentials.password} 
  //             onChange={e => setCredentials({ ...credentials, password: e.target.value })} 
  //             className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
  //           />
  //           <button 
  //             onClick={handleLogin} 
  //             className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
  //           >
  //             Login
  //           </button>
  //         </div>
  //         <p className="text-xs text-gray-500 text-center mt-4">Demo: ID: ajeet21, Password: 12345</p>
  //       </div>
  //     </div>
  //   );
  // }

  // --- Admin Panel Render ---
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Products: {products.length} | Orders: {orders.length}</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition">Logout</button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab("products");
            productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "products" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Products
        </button>
        <button
          onClick={() => {
            setActiveTab("health");
            healthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "health" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Health Products
        </button>
        <button
          onClick={() => {
            setActiveTab("orders");
            ordersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "orders" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Orders
        </button>
      </div>
      {/* --- Products Management Section --- */}
      <div ref={productsRef} className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {editingProductId ? " Edit Product" : "Add New Product"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input 
            placeholder="Product Title" 
            value={editingProductId ? editProduct.title : newProduct.title} 
            onChange={e => editingProductId ? setEditProduct({ ...editProduct, title: e.target.value }) : setNewProduct({ ...newProduct, title: e.target.value })} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            placeholder="Description" 
            value={editingProductId ? editProduct.description : newProduct.description} 
            onChange={e => editingProductId ? setEditProduct({ ...editProduct, description: e.target.value }) : setNewProduct({ ...newProduct, description: e.target.value })} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="number" 
            placeholder="Price (₹)" 
            value={editingProductId ? editProduct.amount : newProduct.amount} 
            onChange={e => editingProductId ? setEditProduct({ ...editProduct, amount: e.target.value }) : setNewProduct({ ...newProduct, amount: e.target.value })} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => e.target.files && handleImageUpload(e.target.files[0], editingProductId !== null, false)} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Upload product image"
          />
          <div className="flex gap-2">
            {editingProductId ? (
              <>
                <button 
                  onClick={() => handleUpdateProduct(editingProductId)} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition flex-1"
                >
                  Save
                </button>
                <button 
                  onClick={() => setEditingProductId(null)} 
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition flex-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={handleAddProduct} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition w-full"
              >
                Add Product
              </button>
            )}
          </div>
        </div>
        {(editingProductId ? editProduct.preview : newProduct.preview) && (
          <div className="mt-4">
            <img 
              src={getImageSrc(editingProductId ? editProduct.preview : newProduct.preview)} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded-lg border border-gray-300" 
            />
          </div>
        )}
      </div>

      {/* --- Products Grid Display --- */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">📦Products List ({products.length})</h3>
        {products.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            No products found. Add a new product to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {products.map(p => (
              <div key={p._id} className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden">
                <div className="relative w-full h-40 mb-3 bg-gray-200 rounded-lg overflow-hidden">
                  {p.image ? (
                    <Image 
                      src={normalizeImage(p.image)!} 
                      alt={p.title} 
                      fill
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-800 truncate">{p.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{p.description}</p>
                <p className="text-xl font-bold text-green-600 mb-3">₹{p.amount}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditingProductId(p._id); 
                      setEditProduct({ 
                        title: p.title, 
                        description: p.description, 
                        amount: String(p.amount), 
                        image: p.image, 
                        preview: normalizeImage(p.image) 
                      }); 
                    }} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex-1 text-sm font-semibold transition"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(p._id)} 
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex-1 text-sm font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Health Products Management Section --- */}
      <div ref={healthRef} className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {editingLabTestId ? " Edit Health Product" : " Add New Health Product"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input 
            placeholder="Product Title" 
            value={editingLabTestId ? editLabTest.name : newTest.name} 
            onChange={e => editingLabTestId ? setEditLabTest({ ...editLabTest, name: e.target.value }) : setNewTest({ ...newTest, name: e.target.value })} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            placeholder="Description" 
            value={editingLabTestId ? editLabTest.healthConcern : newTest.healthConcern} 
            onChange={e => editingLabTestId ? setEditLabTest({ ...editLabTest, healthConcern: e.target.value }) : setNewTest({ ...newTest, healthConcern: e.target.value })} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="number" 
            placeholder="Price (₹)" 
            value={editingLabTestId ? editLabTest.price : newTest.price} 
            onChange={e => editingLabTestId ? setEditLabTest({ ...editLabTest, price: e.target.value }) : setNewTest({ ...newTest, price: e.target.value })} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => e.target.files && handleImageUpload(e.target.files[0], editingLabTestId !== null, true)} 
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Upload lab test image"
          />
          <div className="flex gap-2">
            {editingLabTestId ? (
              <>
                <button 
                  onClick={() => handleUpdateLabTest(editingLabTestId)} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition flex-1"
                >
                  Save
                </button>
                <button 
                  onClick={() => setEditingLabTestId(null)} 
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition flex-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={handleAddLabTest} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition w-full"
              >
                Add health product
              </button>
            )}
          </div>
        </div>
        {(editingLabTestId ? editLabTest.preview : newTest.preview) && (
          <div className="mt-4">
            <img 
              src={getImageSrc(editingLabTestId ? editLabTest.preview : newTest.preview)} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded-lg border border-gray-300" 
            />
          </div>
        )}
      </div>

      {/* --- Health Products Grid Display --- */}
      <div className="mb-8" id="health-products">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">🩺 Health Products ({labTests.length})</h3>
        {labTests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            No health products found. Add a new health product to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {labTests.map(t => (
              <div key={t._id} className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden">
                <div className="relative w-full h-40 mb-3 bg-gray-200 rounded-lg overflow-hidden">
                  {t.image ? (
                    <Image 
                      src={t.image} 
                      alt={t.name} 
                      fill
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-800 truncate">{t.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{t.healthConcern}</p>
                <p className="text-xl font-bold text-green-600 mb-3">₹{t.price}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditingLabTestId(t._id); 
                      setEditLabTest({ 
                        _id: t._id,
                        name: t.name, 
                        healthConcern: t.healthConcern, 
                        price: String(t.price), 
                        image: t.image, 
                        preview: t.image 
                      }); 
                    }} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex-1 text-sm font-semibold transition"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteLabTest(t._id)} 
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex-1 text-sm font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Orders Section --- */}
      <div ref={ordersRef} className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">📦 All Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            No orders at the moment. New orders will appear here with live updates.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o._id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border-l-4 border-blue-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <h3 className="font-bold text-lg text-gray-800">{o.customerName}</h3>
                    <p className="text-sm text-gray-600 mt-2">📱 {o.customerPhone}</p>
                    <p className="text-sm text-gray-600">📍 {o.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Details</p>
                    {o.age && <p className="text-sm">Age: {o.age}</p>}
                    {o.gender && <p className="text-sm">Gender: {o.gender}</p>}
                    {o.testType && <p className="text-sm">Test Type: {o.testType}</p>}
                    {o.doctorType && <p className="text-sm">Doctor Type: {o.doctorType}</p>}
                    <p className="text-sm font-semibold mt-2">Payment: {o.paymentMethod || 'COD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-3xl font-bold text-green-600">₹{o.totalAmount}</p>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${
                        o.status === 'Pending' ? 'bg-yellow-500' 
                        : o.status === 'Accepted' ? 'bg-blue-500'
                        : o.status === 'Shipped' ? 'bg-purple-500'
                        : o.status === 'Delivered' ? 'bg-green-500'
                        : 'bg-red-500'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Order Items Table */}
                <div className="mb-4 bg-gray-50 rounded-lg p-3">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-gray-300">
                      <tr>
                        <th className="text-left py-2 px-2">Item</th>
                        <th className="text-center py-2 px-2">Qty</th>
                        <th className="text-right py-2 px-2">Price</th>
                        <th className="text-right py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 px-2">{item.title}</td>
                          <td className="text-center py-2 px-2">{item.qty}</td>
                          <td className="text-right py-2 px-2">₹{item.price}</td>
                          <td className="text-right py-2 px-2 font-semibold">₹{item.price * item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  {o.status === "Pending" && (
                    <>
                      <button 
                        onClick={() => handleUpdateOrderStatus(o._id, "Accepted")} 
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ✓ Accept Order
                      </button>
                      <button 
                        onClick={() => handleUpdateOrderStatus(o._id, "Rejected")} 
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ✕ Reject Order
                      </button>
                    </>
                  )}
                  {o.status === "Accepted" && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(o._id, "Shipped")} 
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      📦 Mark as Shipped
                    </button>
                  )}
                  {o.status === "Shipped" && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(o._id, "Delivered")} 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                       Mark as Delivered
                    </button>
                  )}
                  {o.status !== "Delivered" && o.status !== "Rejected" && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(o._id, "Rejected")} 
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition ml-auto"
                    >
                      ✕ Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Orders Subsections Anchors --- */}
      <div className="mb-8">
        <div id="orders-doctors" className="mb-4">
          <h3 className="text-lg font-bold">Doctors Orders</h3>
        </div>
        <div id="orders-health-products" className="mb-4">
          <h3 className="text-lg font-bold">Health Products Orders</h3>
        </div>
        <div id="orders-products" className="mb-4">
          <h3 className="text-lg font-bold">Products Orders</h3>
        </div>
        <div className="space-y-4">
          {orders.filter(o => o.doctorType).map(o => (
            <div key={o._id} className="bg-white p-4 rounded shadow">{o.customerName} — {o.customerPhone} — ₹{o.totalAmount}</div>
          ))}
          {orders.filter(o => o.testType).map(o => (
            <div key={o._id} className="bg-white p-4 rounded shadow">{o.customerName} — {o.customerPhone} — ₹{o.totalAmount}</div>
          ))}
          {orders.filter(o => !o.testType && !o.doctorType).map(o => (
            <div key={o._id} className="bg-white p-4 rounded shadow">{o.customerName} — {o.customerPhone} — ₹{o.totalAmount}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
