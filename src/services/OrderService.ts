import { getFirestore, collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp, orderBy, Firestore } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

export interface ShippingInfo {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface TripodOrder {
    orderId: string;
    userId: string;
    userEmail: string;

    // Shipping Info
    shippingName: string;
    shippingEmail: string;
    shippingPhone: string;
    shippingAddress1: string;
    shippingAddress2?: string;
    shippingCity: string;
    shippingState: string;
    shippingZip: string;
    shippingCountry: string;

    // Order Info
    productName: string;
    productPrice: number;
    currency: string;

    // Status Tracking
    status: 'pending' | 'payment_sent' | 'paid' | 'shipped' | 'cancelled';
    venmoTransactionId?: string;

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
    paidAt?: Timestamp;
    shippedAt?: Timestamp;

    // Notes
    adminNotes?: string;
    customerNotes?: string;
}

export class OrderService {
    private static COLLECTION = 'tripod_orders';

    private static getDb(): Firestore {
        const apps = getApps();
        if (apps.length === 0) {
            throw new Error('Firebase not initialized');
        }
        return getFirestore(apps[0]);
    }

    /**
     * Create a new order
     */
    static async createOrder(
        userId: string,
        userEmail: string,
        shippingInfo: ShippingInfo
    ): Promise<string> {
        try {
            const orderData = {
                userId,
                userEmail,

                // Shipping Info
                shippingName: shippingInfo.name,
                shippingEmail: shippingInfo.email,
                shippingPhone: shippingInfo.phone,
                shippingAddress1: shippingInfo.address1,
                shippingAddress2: shippingInfo.address2 || '',
                shippingCity: shippingInfo.city,
                shippingState: shippingInfo.state,
                shippingZip: shippingInfo.zip,
                shippingCountry: shippingInfo.country,

                // Order Info
                productName: 'The Wolverine',
                productPrice: 5.00,
                currency: 'USD',

                // Status
                status: 'pending' as const,

                // Timestamps
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(collection(this.getDb(), this.COLLECTION), orderData);

            // Update with orderId
            await updateDoc(docRef, { orderId: docRef.id });

            return docRef.id;
        } catch (error) {
            console.error('Error creating order:', error);
            throw new Error('Failed to create order');
        }
    }

    /**
     * Update order status
     */
    static async updateOrderStatus(
        orderId: string,
        status: TripodOrder['status']
    ): Promise<void> {
        try {
            const orderRef = doc(this.getDb(), this.COLLECTION, orderId);
            const updateData: any = {
                status,
                updatedAt: Timestamp.now(),
            };

            // Add timestamp for specific status changes
            if (status === 'paid') {
                updateData.paidAt = Timestamp.now();
            } else if (status === 'shipped') {
                updateData.shippedAt = Timestamp.now();
            }

            await updateDoc(orderRef, updateData);
        } catch (error) {
            console.error('Error updating order status:', error);
            throw new Error('Failed to update order status');
        }
    }

    /**
     * Confirm payment sent by user
     */
    static async confirmPaymentSent(orderId: string): Promise<void> {
        return this.updateOrderStatus(orderId, 'payment_sent');
    }

    /**
     * Get all orders for a user
     */
    static async getUserOrders(userId: string): Promise<TripodOrder[]> {
        try {
            const q = query(
                collection(this.getDb(), this.COLLECTION),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const orders: TripodOrder[] = [];

            querySnapshot.forEach((doc) => {
                orders.push({ ...doc.data(), orderId: doc.id } as TripodOrder);
            });

            return orders;
        } catch (error) {
            console.error('Error getting user orders:', error);
            throw new Error('Failed to get orders');
        }
    }

    /**
     * Add customer notes to order
     */
    static async addCustomerNotes(orderId: string, notes: string): Promise<void> {
        try {
            const orderRef = doc(this.getDb(), this.COLLECTION, orderId);
            await updateDoc(orderRef, {
                customerNotes: notes,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error adding customer notes:', error);
            throw new Error('Failed to add notes');
        }
    }
}
