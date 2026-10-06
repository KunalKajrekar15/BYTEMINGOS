import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const Store = createContext(null);
function readSaved(key, fallback) {
  try {
    // Preserve saved data from the original project name after the rebrand.
    const value =
      localStorage.getItem(key) ??
      localStorage.getItem(key.replace("bytemingos-", "bitebyte-"));
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browsing still works when storage is unavailable. */
  }
}

export function StoreProvider({ children }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState(() => {
    const stored = readSaved("bytemingos-cart", {});
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? Object.fromEntries(
          Object.entries(stored).filter(
            ([, value]) => Number.isInteger(value) && value > 0 && value <= 10,
          ),
        )
      : {};
  });
  const [favourites, setFavourites] = useState(() => {
    const stored = readSaved("bytemingos-favourites", []);
    return Array.isArray(stored)
      ? stored.filter((x) => typeof x === "string")
      : [];
  });
  const [receipts, setReceipts] = useState(() => {
    const stored = readSaved("bytemingos-receipts", []);
    return Array.isArray(stored)
      ? stored.filter(
          (x) => x && typeof x.id === "string" && typeof x.token === "string",
        )
      : [];
  });
  const [toast, setToast] = useState("");
  async function loadMenu() {
    setLoading(true);
    setError("");
    try {
      setMenu(await api("/menu"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadMenu();
  }, []);
  useEffect(() => {
    save("bytemingos-cart", cart);
  }, [cart]);
  useEffect(() => {
    save("bytemingos-favourites", favourites);
  }, [favourites]);
  useEffect(() => {
    save("bytemingos-receipts", receipts);
  }, [receipts]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);
  const lines = menu
    .filter((item) => cart[item.id])
    .map((item) => ({ ...item, quantity: cart[item.id] }));
  const count = lines.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = lines.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  function changeQuantity(id, amount) {
    setCart((old) => {
      const next = { ...old };
      const quantity = Math.min(10, Math.max(0, (next[id] || 0) + amount));
      if (quantity) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }
  function add(item) {
    changeQuantity(item.id, 1);
    setToast(`${item.name} added to your bag`);
  }
  function toggleFavourite(id) {
    setFavourites((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  }
  function saveReceipt(order) {
    setReceipts((old) =>
      [
        {
          id: order.id,
          token: order.trackingToken,
          createdAt: order.createdAt,
        },
        ...old,
      ].slice(0, 30),
    );
    setCart({});
  }
  return (
    <Store.Provider
      value={{
        menu,
        loading,
        error,
        loadMenu,
        cart,
        lines,
        count,
        subtotal,
        changeQuantity,
        add,
        favourites,
        toggleFavourite,
        receipts,
        saveReceipt,
      }}
    >
      {children}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast}
      </div>
    </Store.Provider>
  );
}
export function useStore() {
  return useContext(Store);
}
