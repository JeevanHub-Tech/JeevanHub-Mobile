// src/types/cart.ts

export interface CartMedicineItem {
  _id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  prescription?: boolean;
  retailerId?: {
    _id: string;
    BusinessName?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface CartItem {
  _id?: string;
  medicineId: CartMedicineItem;
  quantity: number;
  price: number;
}

export interface CartGroup {
  _id?: string;
  patientId: string;
  doctorId?: {
    _id: string;
    firstName: string;
    lastName?: string;
  } | null;
  items: CartItem[];
  totalPrice: number;
  updatedAt?: string;
}

export interface PatientCartResponse {
  defaultCart: CartGroup;
  doctorCarts: CartGroup[];
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country?: string;
}

export interface CreateOrderPayload {
  items: Array<{
    medicineId: string;
    quantity: number;
    price: number;
  }>;
  buyer: {
    buyerId: string;
    buyerModel: 'Patient';
    buyerName: string;
    buyerEmail: string;
    buyerContactNumber: string;
  };
  shippingAddress: ShippingAddress;
  paymentMethod: 'cashOnDelivery' | 'onlinePayment';
  shippingCharge?: number;
  prescriptionUrls?: string[];
}

export interface OrderItem {
  medicineId: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  price: number;
}

export interface OrderHistoryItem {
  _id: string;
  orderId?: string;
  buyer: {
    buyerId: string;
    buyerName: string;
    buyerEmail?: string;
    buyerContactNumber?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  shippingCharge?: number;
  paymentMethod: string;
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  paymentProof?: string;
  createdAt: string;
  shipments?: Array<{
    platform: string;
    trackingId?: string;
    status?: string;
  }>;
}
