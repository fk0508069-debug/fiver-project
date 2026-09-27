"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export type CartItem = {
  productId: string;
  name: string;
  slug?: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
};

type State = { items: CartItem[]; hydrated: boolean };

type Action =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_QTY"; productId: string; quantity: number }
  | { type: "CLEAR" };

const KEY = "flowline_cart_v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.items, hydrated: true };
    case "ADD": {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: Math.min(i.stock, i.quantity + action.item.quantity) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
    case "SET_QTY":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.productId === action.productId
              ? { ...i, quantity: Math.max(0, Math.min(i.stock, action.quantity)) }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { ...state, items: [] };
  }
}

type Ctx = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const { customer, loading } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      dispatch({ type: "HYDRATE", items: raw ? JSON.parse(raw) : [] });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  // Auto-clear the cart when the user logs out
  useEffect(() => {
    if (!loading && !customer) {
      dispatch({ type: "CLEAR" });
      localStorage.removeItem(KEY);
    }
  }, [customer, loading]);

  // Persist changes
  useEffect(() => {
    if (state.hydrated && customer) {
      localStorage.setItem(KEY, JSON.stringify(state.items));
    }
  }, [state.items, state.hydrated, customer]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue && customer) {
        try {
          dispatch({ type: "HYDRATE", items: JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [customer]);

  const value = useMemo<Ctx>(
    () => ({
      items: state.items,
      hydrated: state.hydrated,
      count: state.items.reduce((n, i) => n + i.quantity, 0),
      subtotal: Math.round(state.items.reduce((n, i) => n + i.price * i.quantity, 0) * 100) / 100,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (id) => dispatch({ type: "REMOVE", productId: id }),
      setQuantity: (id, qty) => dispatch({ type: "SET_QTY", productId: id, quantity: qty }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}