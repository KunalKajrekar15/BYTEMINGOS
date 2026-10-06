import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { StoreProvider } from "./Store";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Menu from "./pages/Menu";
import Saved from "./pages/Saved";
import MealFinder from "./pages/MealFinder";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders, { OrderDetails } from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import "./styles.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Menu />} />
              <Route path="meal-finder" element={<MealFinder />} />
              <Route path="saved" element={<Saved />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="kitchen" element={<Kitchen />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>This page isn’t on the menu.</h1>
                    <Link to="/" className="button">
                      Back to the menu
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
