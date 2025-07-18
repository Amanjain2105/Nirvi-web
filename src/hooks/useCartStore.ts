import { create } from "zustand";
import { currentCart } from "@wix/ecom";
import { WixClient } from "@/context/wixContext";

// Define a safe type for the cart state
type CartType = currentCart.Cart | null;

type CartState = {
  cart: CartType;
  isLoading: boolean;
  counter: number;
  getCart: (wixClient: WixClient) => Promise<void>;
  addItem: (
    wixClient: WixClient,
    productId: string,
    variantId?: string,
    quantity?: number
  ) => Promise<void>;
  removeItem: (wixClient: WixClient, itemId: string) => Promise<void>;
};

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: true,
  counter: 0,

  // ✅ Fetch Cart
  getCart: async (wixClient) => {
    try {
      const response = await wixClient.currentCart.getCurrentCart();
      set({
        cart: response || null,
        isLoading: false,
        counter: response.lineItems?.length || 0,
      });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      set((state) => ({ ...state, isLoading: false }));
    }
  },

  // ✅ Add Item
  addItem: async (wixClient, productId, variantId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const response = await wixClient.currentCart.addToCurrentCart({
        lineItems: [
          {
            catalogReference: {
              appId: process.env.NEXT_PUBLIC_WIX_APP_ID!,
              catalogItemId: productId,
              ...(variantId && { options: { variantId } }),
            },
            quantity,
          },
        ],
      });

      set({
        cart: response.cart || null,
        counter: response.cart?.lineItems?.length || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to add item:", error);
      set({ isLoading: false });
    }
  },

  // ✅ Remove Item
  removeItem: async (wixClient, itemId) => {
    set({ isLoading: true });
    try {
      const response =
        await wixClient.currentCart.removeLineItemsFromCurrentCart([itemId]);

      set({
        cart: response.cart || null,
        counter: response.cart?.lineItems?.length || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to remove item:", error);
      set({ isLoading: false });
    }
  },
}));
