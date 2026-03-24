"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HiMenu, HiX, HiShoppingCart, HiUser, HiLogout } from "react-icons/hi";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/cartContext";
import Categorypanel from "../component/Categorypanel";
import AdminHoverLogin from "../component/AdminHoverLogin";

function UserHoverLogin() {
  const { login, signup } = useUser();
  const [open, setOpen] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      const success = await login(username, password);
      if (success) {
        setOpen(false);
        setUsername("");
        setPassword("");
      } else {
        setError("Invalid credentials");
      }
    } else {
      const success = await signup(username, password);
      if (success) {
        setIsLogin(true);
        setError("✅ Account created! Please login.");
        setUsername("");
        setPassword("");
      } else {
        setError("Signup failed");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setOpen(true);
        if (hoverTimer) clearTimeout(hoverTimer);
      }}
      onMouseLeave={() => {
        const timer = setTimeout(() => setOpen(false), 300);
        setHoverTimer(timer);
      }}
    >
      <button className="flex items-center gap-1 text-xs md:text-sm font-semibold hover:bg-teal-500 px-2 py-1 rounded transition">
        <HiUser className="h-5 w-5 md:h-6 md:w-6" />
        <span className="hidden sm:inline">Login</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 z-50"
          onMouseEnter={() => {
            if (hoverTimer) clearTimeout(hoverTimer);
          }}
          onMouseLeave={() => {
            const timer = setTimeout(() => setOpen(false), 300);
            setHoverTimer(timer);
          }}
        >
          <h3 className="text-lg font-semibold mb-3 text-center">{isLogin ? "User Login" : "Create Account"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? (isLogin ? "Logging in..." : "Creating...") : (isLogin ? "Login" : "Create Account")}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setUsername("");
                setPassword("");
              }}
              className="text-blue-500 hover:underline"
            >
              {isLogin ? "Create one" : "Login"}
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Demo: username: user, password: 123
          </p>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, logout } = useUser();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const [username, setUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    } else {
      const storedUser = localStorage.getItem("username");
      if (storedUser) setUsername(storedUser);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUsername(null);
    if (logout) logout();
    window.location.href = "/login";
  };

  const dropdownItems: Record<string, string[]> = {
    "Healthcare Product": [
      "Diabetic Care",
      "Vitamin",
      "Feet Problem",
      "Ortho Care",
      "Skin & Hair Care",
    ],
    "Lab Tests": ["All Test", "Health Packages"],
    "Health Insights": ["Blog Article", "Chronic Conditions"],
  };

  return (
    <>
      <header className="sticky top-0 z-50 shadow-md bg-teal-400">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-3 md:p-4 text-black">
          {/* Logo */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-base md:text-lg font-bold">
              <Link href="/">HealthCare</Link>
            </h1>
            <div className="hidden md:flex flex-col">
              <p className="text-xs md:text-sm flex items-center">
                <img className="h-4 w-4 mr-1" src="/images/thunderbolt.png" alt="" />
                Express Delivery to
              </p>
              <button className="font-bold text-xs md:text-sm flex items-center">
                Select Pincode
                <img className="h-4 w-4 md:h-5 md:w-5 ml-1" src="/images/down.png" alt="" />
              </button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowLogout((prev) => !prev)}
                  className="flex items-center gap-1 text-xs md:text-sm font-semibold hover:bg-teal-500 px-2 py-1 rounded transition"
                >
                  <HiUser className="h-5 w-5 md:h-6 md:w-6" />
                  <span className="hidden sm:inline">{user.username}</span>
                </button>
                {showLogout && (
                  <button
                    onClick={handleLogout}
                    className="absolute right-0 mt-2 bg-red-500 px-3 py-2 rounded text-white text-sm hover:bg-red-600 whitespace-nowrap flex items-center gap-2"
                  >
                    <HiLogout className="h-4 w-4" /> Logout
                  </button>
                )}
              </div>
            ) : (
              <UserHoverLogin />
            )}

            {/* Admin Hover Login - shows login form on hover */}
            <div className="hidden sm:block">
              <AdminHoverLogin />
            </div>

            {/* Cart Link */}
            <Link href="/cart" className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-teal-500 transition relative">
              <HiShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden sm:inline">{cartCount}</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-teal-500 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <HiX className="h-6 w-6" />
              ) : (
                <HiMenu className="h-6 w-6" />
              )}
            </button>

            {/* Category Panel Toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-teal-500 transition text-sm"
              onClick={() => setIsOpenCatPanel(true)}
            >
              Categories
            </button>
          </div>
        </div>

        {/* Navigation Menu - Desktop */}
        <nav className="hidden md:block bg-white text-black border-t">
          <ul className="flex justify-around items-center p-3 text-sm font-medium">
            <li>
              <button
                className="hover:text-teal-600 transition"
                onClick={() => setIsOpenCatPanel(true)}
              >
                Pharmacy Services ▼
              </button>
            </li>

            {Object.keys(dropdownItems).map((menu) => (
              <li key={menu} className="relative group">
                <button className="hover:text-teal-600 transition px-3 py-2">
                  {menu}
                </button>
                <ul className="absolute left-0 mt-0 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 min-w-[180px]">
                  {dropdownItems[menu].map((item: string) => (
                    <li key={item}>
                      <a href="#" className="block px-4 py-2 hover:bg-gray-100 hover:text-teal-600">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}

            <li className="hover:text-teal-600 transition px-3 py-2">Doctor Consult</li>
            <li className="hover:text-teal-600 transition px-3 py-2">Order on Call</li>
            <li className="hover:text-teal-600 transition px-3 py-2">
              <Link href="/Help">Need Help?</Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu - Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white text-black border-t">
            <ul className="flex flex-col p-3 space-y-2 text-sm">
              <li>
                <button
                  className="w-full text-left hover:text-teal-600 transition px-2 py-2"
                  onClick={() => {
                    setIsOpenCatPanel(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  Pharmacy Services ▼
                </button>
              </li>

              {Object.keys(dropdownItems).map((menu) => (
                <li key={menu}>
                  <details className="cursor-pointer">
                    <summary className="hover:text-teal-600 transition px-2 py-2">
                      {menu}
                    </summary>
                    <ul className="pl-4 space-y-1 mt-2 border-l-2 border-gray-300">
                      {dropdownItems[menu].map((item: string) => (
                        <li key={item}>
                          <a href="#" className="block px-2 py-1 hover:text-teal-600 text-xs">
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}

              <li className="px-2 py-2 hover:text-teal-600 transition">Doctor Consult</li>
              <li className="px-2 py-2 hover:text-teal-600 transition">Order on Call</li>
              <li className="px-2 py-2 hover:text-teal-600 transition">
                <Link href="https://capable-peach-xvm-draft.caffeine.xyz">Need Help?</Link>
              </li>

              {/* Mobile Admin Link */}
              <li className="px-2 py-2 hover:text-teal-600 transition sm:hidden">
                <Link href="/admin">Admin</Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      {/* Category Panel */}
      <Categorypanel
        isOpenCartPanel={isOpenCatPanel}
        setIsOpenCartPanel={setIsOpenCatPanel}
      />
    </>
  );
}
