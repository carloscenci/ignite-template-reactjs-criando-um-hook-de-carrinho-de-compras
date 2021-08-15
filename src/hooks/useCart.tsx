import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // List a Array of carts using a local storage for guard data even the page is update
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      // Convert the data for JSON object
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // Relist a cart a new variable to update with new products
      const updatedCart = [...cart];

      // Verify if the product passed in param exist in updatedCart
      const productExists = updatedCart.find(product => product.id === productId);

      // I recover the product data by Id of the API
      const stock = await api.get(`/stock/${productId}`)

      // Guard a amount data of product
      const stockAmount = stock.data.amount

      // Verify if the product exist, recover the amount, else, return 0
      const currentAmount = productExists ?  productExists.amount : 0;

      // Adds amount in the currentAmount
      const amount = currentAmount + 1;

      // Verify if the amount (Total amount of the product) is superior of the amount current in cart (stockAmount)
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      // Verify if the product exist
      if (productExists) {
        // Return the amount of product
        productExists.amount = amount;
      } else {
        // If the product don't exist, create a new product 
        const product = await api.get(`/products/${productId}`);

        // After created, create a amount in a new product, started by amount 1 
        const newProduct = {
          ...product.data,
          amount: 1
        }

        // After created a new product, Adds a new product in a existent list of cart current
        updatedCart.push(newProduct);
      }

      // Set a update in variable updatedCart, using a setCart in Array cart
      
      setCart(updatedCart);

      // Guard a update in cart in local storage and convert to string
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // Create a new array of Carts
      const updatedCart = [...cart];
      // Find the product per index
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      // If index exist and more ou equal 0
      if(productIndex >= 0) {
        // Remove the product
        updatedCart.splice(productIndex, 1);
        // Update the list of carts
        setCart(updatedCart)
        // Set the new list of products before remove the product in local storage
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // Verify if amount is less or equal 0, and if is, finish the action
      if(amount <= 0){
        return;
      }
      
      // Search the list of stocks in API per Id
      const stock = await api.get(`/stock/${productId}`);
      // Guard a amount of stock in a variable
      const stockAmount = stock.data.amount;

      // Verify if amount is more then stockAmount
      if(amount > stockAmount) {
        // If is, return the error and finish the action
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 

      // Create a new array of carts
      const updatedCart = [...cart];
      // Find the product in the list of carts per Id
      const productExists = updatedCart.find(product => product.id === productId);
      
      // Verify if product Exists
      if(productExists) {
        // If is, the amount of product receive a new amount
        productExists.amount = amount;
        // Set the change in a list of carts
        setCart(updatedCart)
        // Set the change a local storage and convert to string
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
