// src/api/patient.ts
import { apiClient } from './client';
import {
  AppNotification,
  Appointment,
  AyurvedaDietPlanResponse,
  AyurvedaYogaPlanResponse,
  BackendDoshaAssessment,
  BlogItem,
  BlogTranslation,
  CartResponse,
  CreateBookingPayload,
  DoctorProfile,
  DoshaResult,
  MealRecipe,
  MedicalRecordItem,
  MedicineAvailabilityItem,
  MedicineItem,
  OrderRecord,
  PaginatedMedicinesResponse,
  PatientDetails,
  ShippingAddress,
  TrackingResponse,
  UpdatePatientPayload,
  WellnessProfile,
} from '../types/patient';

export const patientApi = {
  // ─── Doctor Discovery ────────────────────────────────────────────────────────
  async getDoctors(): Promise<DoctorProfile[]> {
    try {
      const response = await apiClient.get<any>('/api/doctors/allDoctors');
      // Backend may return array or { doctors: [...] }
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.doctors)) return data.doctors;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch (err) {
      console.warn('Fallback to publicDoctors');
      const fallback = await apiClient.get<any>('/api/doctors/publicDoctors');
      const data = fallback.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.doctors)) return data.doctors;
      return [];
    }
  },

  async getDoctorById(id: string): Promise<DoctorProfile> {
    const response = await apiClient.get<any>(`/api/doctors/getDoctorById/${id}`);
    const data = response.data;
    return data.doctor || data.data || data;
  },

  async getDoctorSlots(doctorId: string, dateStr: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/doctors/${doctorId}/slots/${dateStr}`);
      return response.data;
    } catch {
      return { slots: [] };
    }
  },

  // ─── Appointments & Booking ──────────────────────────────────────────────────
  async createBooking(payload: CreateBookingPayload): Promise<Appointment> {
    const response = await apiClient.post<any>('/api/bookings', payload);
    return response.data.booking || response.data;
  },

  async getPatientBookings(patientId: string): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<any>(`/api/bookings/patient/${patientId}`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.bookings)) return data.bookings;
      return [];
    } catch {
      return [];
    }
  },

  // ─── Ayurveda Prakriti & Wellness ────────────────────────────────────────────
  async getBackendDoshaAssessment(): Promise<BackendDoshaAssessment | null> {
    try {
      const response = await apiClient.get<any>('/api/ayurveda/dosha-assessment');
      const data = response.data;
      if (!data) return null;
      if (data.assessment) return data.assessment;
      if (data.primaryDosha) return data;
      return null;
    } catch {
      return null;
    }
  },

  async getDoshaAssessment(): Promise<DoshaResult | null> {
    try {
      const response = await apiClient.get<any>('/api/ayurveda/dosha-assessment');
      const data = response.data;
      if (!data) return null;
      if (data.assessment?.dominantDosha) return data.assessment;

      if (data.primaryDosha) {
        const cap = (s: string) =>
          s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
        const p = cap(data.primaryDosha);
        const s = data.secondaryDosha ? cap(data.secondaryDosha) : null;
        const dominant = (s ? `${p}-${s}` : p) as DoshaResult['dominantDosha'];
        const scores = {
          vata: Math.round(data.calculatedScores?.vata ?? 34),
          pitta: Math.round(data.calculatedScores?.pitta ?? 33),
          kapha: Math.round(data.calculatedScores?.kapha ?? 33),
        };
        return {
          dominantDosha: dominant,
          scores,
          description:
            data.doshaProfile?.primary?.explanation ||
            `Primary constitution: ${dominant}.`,
          dietRecommendations: {
            favor: [
              'Warm, freshly prepared Dosha-balancing meals',
              'Seasonal fruits, whole grains, and gentle digestive spices',
            ],
            avoid: ['Excessively processed, stale, or incompatible food combinations'],
          },
          lifestyleTips: data.doshaProfile?.primary?.lifestyleRecommendations || [
            'Maintain consistent sleep and meal timings',
            'Practice daily pranayama and mindful movement',
          ],
          recommendedHerbs: ['Triphala', 'Ashwagandha', 'Guduchi'],
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async submitDoshaAssessment(assessmentData: any): Promise<any> {
    const response = await apiClient.post<any>('/api/ayurveda/dosha-assessment', assessmentData);
    return response.data;
  },

  async getWellnessProfile(): Promise<WellnessProfile | null> {
    try {
      const response = await apiClient.get<WellnessProfile | null>('/api/ayurveda/wellness-profile');
      return response.data || null;
    } catch {
      return null;
    }
  },

  async saveWellnessProfile(payload: WellnessProfile): Promise<{ message?: string; profile?: WellnessProfile }> {
    const response = await apiClient.post('/api/ayurveda/wellness-profile', payload);
    return response.data;
  },

  async getDietPlan(lang: 'en' | 'hi' = 'en'): Promise<AyurvedaDietPlanResponse | null> {
    try {
      const response = await apiClient.get<AyurvedaDietPlanResponse | null>(
        `/api/ayurveda/diet-plan?lang=${lang}`
      );
      return response.data || null;
    } catch {
      return null;
    }
  },

  async generateDietPlan(): Promise<{ message?: string; plan?: AyurvedaDietPlanResponse }> {
    const response = await apiClient.post('/api/ayurveda/diet-plan/generate', {}, { timeout: 60000 });
    return response.data;
  },

  async deleteDietPlan(): Promise<void> {
    await apiClient.delete('/api/ayurveda/diet-plan');
  },

  async getMealRecipe(payload: {
    mealContext: string;
    day?: string;
    items: string[];
    portion?: string;
    lang?: 'en' | 'hi';
  }): Promise<{ recipe: MealRecipe; fromCache?: boolean }> {
    const response = await apiClient.post('/api/ayurveda/diet-plan/meal-recipe', payload, {
      timeout: 45000,
    });
    return response.data;
  },

  async getYogaPlan(lang: 'en' | 'hi' = 'en'): Promise<AyurvedaYogaPlanResponse | null> {
    try {
      const response = await apiClient.get<AyurvedaYogaPlanResponse | null>(
        `/api/ayurveda/yoga-plan?lang=${lang}`
      );
      return response.data || null;
    } catch {
      return null;
    }
  },

  async generateYogaPlan(): Promise<{ message?: string; plan?: AyurvedaYogaPlanResponse }> {
    const response = await apiClient.post('/api/ayurveda/yoga-plan/generate', {}, { timeout: 60000 });
    return response.data;
  },

  async generateBothAyurvedaPlans(): Promise<{
    dietOk: boolean;
    yogaOk: boolean;
    dietPlan: AyurvedaDietPlanResponse | null;
    yogaPlan: AyurvedaYogaPlanResponse | null;
    dietError: string | null;
    yogaError: string | null;
  }> {
    const [dietRes, yogaRes] = await Promise.allSettled([
      this.generateDietPlan(),
      this.generateYogaPlan(),
    ]);

    const dietOk = dietRes.status === 'fulfilled';
    const yogaOk = yogaRes.status === 'fulfilled';

    if (!dietOk && !yogaOk) {
      throw new Error(
        (dietRes.reason as Error)?.message ||
          (yogaRes.reason as Error)?.message ||
          'Failed to generate your plans.'
      );
    }

    return {
      dietOk,
      yogaOk,
      dietPlan: dietOk ? dietRes.value.plan || null : null,
      yogaPlan: yogaOk ? yogaRes.value.plan || null : null,
      dietError: !dietOk
        ? (dietRes.reason as Error)?.message || 'Diet plan generation failed.'
        : null,
      yogaError: !yogaOk
        ? (yogaRes.reason as Error)?.message || 'Yoga plan generation failed.'
        : null,
    };
  },

  async deleteYogaPlan(): Promise<void> {
    await apiClient.delete('/api/ayurveda/yoga-plan');
  },

  async getMedicineById(medicineId: string): Promise<MedicineAvailabilityItem | null> {
    try {
      const response = await apiClient.get<MedicineAvailabilityItem>(`/api/medicines/${medicineId}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  async requestDietPlanPostBooking(bookingId: string): Promise<any> {
    const response = await apiClient.post(`/api/bookings/${bookingId}/add-diet-plan`, {});
    return response.data;
  },

  async uploadDietPlanPaymentProof(
    bookingId: string,
    files: Array<{ uri: string; name: string; type: string }>
  ): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('paymentScreenshots', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
    formData.append('dietPlanRequested', 'true');

    const response = await apiClient.post(`/api/bookings/${bookingId}/payment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    return response.data;
  },

  // ─── Medical Vault / Records ─────────────────────────────────────────────────
  async getMedicalHistory(patientId: string): Promise<MedicalRecordItem[]> {
    try {
      const response = await apiClient.get<any>(`/api/patients/${patientId}/medical-history`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.records)) return data.records;
      if (data && Array.isArray(data.medicalHistory)) return data.medicalHistory;
      return [];
    } catch {
      return [];
    }
  },

  async uploadMedicalRecord(patientId: string, file: { uri: string; name: string; type: string }): Promise<any> {
    const formData = new FormData();
    formData.append('documents', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post(`/api/patients/${patientId}/medical-history`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ─── Sanjeevani AI Assistant ─────────────────────────────────────────────────
  async sendChatMessage(userId: string, message: string): Promise<{ reply: string }> {
    const response = await apiClient.post<{ response?: string; reply?: string; message?: string }>('/api/chat/message', {
      userId,
      message,
      isRegistered: true,
      userRole: 'patient',
    });

    const reply = response.data.response || response.data.reply || response.data.message || 'I am listening. How can I assist your health journey?';
    return { reply };
  },

  // ─── Patient Profile & Account ───────────────────────────────────────────────
  async getPatientProfile(patientId: string): Promise<PatientDetails> {
    const response = await apiClient.get<PatientDetails>(`/api/patients/getPatient/${patientId}`);
    return response.data;
  },

  async updatePatientProfile(
    patientId: string,
    payload: UpdatePatientPayload
  ): Promise<{ success?: boolean; message?: string; data?: PatientDetails }> {
    const response = await apiClient.put(`/api/patients/updatePatient/${patientId}`, payload);
    return response.data;
  },

  async uploadProfileImage(
    patientId: string,
    file: { uri: string; name: string; type: string }
  ): Promise<{ url?: string; message?: string }> {
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post(`/api/patients/${patientId}/profile-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string; token?: string }> {
    const response = await apiClient.put('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // ─── Notifications ───────────────────────────────────────────────────────────
  async getNotifications(): Promise<AppNotification[]> {
    const response = await apiClient.get<AppNotification[]>('/api/notifications');
    return Array.isArray(response.data) ? response.data : [];
  },

  async markNotificationRead(id: string): Promise<AppNotification> {
    const response = await apiClient.patch<AppNotification>(`/api/notifications/${id}/read`);
    return response.data;
  },

  async markAllNotificationsRead(): Promise<void> {
    await apiClient.patch('/api/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${id}`);
  },

  // ─── Blogs & Videos ──────────────────────────────────────────────────────────
  async getAllBlogs(): Promise<BlogItem[]> {
    const response = await apiClient.get<{ blogs?: BlogItem[] }>('/api/webhook/getAllBlogs');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.blogs)) return data.blogs;
    return [];
  },

  async getBlogById(id: string): Promise<BlogItem> {
    const response = await apiClient.get<BlogItem>(`/api/blogs/${id}`);
    return response.data;
  },

  async translateBlog(id: string, targetLang = 'hi'): Promise<BlogTranslation> {
    const response = await apiClient.post<BlogTranslation>(`/api/blogs/${id}/translate`, {
      targetLang,
    });
    return response.data;
  },

  // ─── Medicines Store, Cart, Checkout & Order Tracking ────────────────────────
  async getMedicines(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    priceRange?: string;
    sortBy?: string;
  } = {}): Promise<PaginatedMedicinesResponse> {
    const response = await apiClient.get<PaginatedMedicinesResponse>('/api/medicines', {
      params,
    });
    return response.data;
  },

  async getMedicineCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/api/medicines/categories');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  async getMedicineDetail(id: string): Promise<MedicineItem> {
    const response = await apiClient.get<MedicineItem>(`/api/medicines/${id}`);
    return response.data;
  },

  async getCart(patientId: string): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>(`/api/cart/${patientId}`);
    return {
      defaultCart: response.data?.defaultCart || { items: [], totalPrice: 0 },
      doctorCarts: Array.isArray(response.data?.doctorCarts) ? response.data.doctorCarts : [],
    };
  },

  async addToCart(patientId: string, medicineId: string, quantity = 1): Promise<any> {
    const response = await apiClient.post('/api/cart/add', {
      patientId,
      medicineId,
      quantity,
    });
    return response.data;
  },

  async updateCartQuantity(
    patientId: string,
    medicineId: string,
    action: 'increment' | 'decrement'
  ): Promise<any> {
    const response = await apiClient.put('/api/cart/update-quantity', {
      patientId,
      medicineId,
      action,
    });
    return response.data;
  },

  async removeFromCart(patientId: string, medicineId: string): Promise<any> {
    const response = await apiClient.delete('/api/cart/remove', {
      data: { patientId, medicineId },
    });
    return response.data;
  },

  async updateDoctorCartQuantity(
    doctorId: string,
    medicineId: string,
    action: 'increment' | 'decrement'
  ): Promise<any> {
    const response = await apiClient.put(`/api/cart/doctor/${doctorId}/update-quantity`, {
      medicineId,
      action,
    });
    return response.data;
  },

  async removeFromDoctorCart(doctorId: string, medicineId: string): Promise<any> {
    const response = await apiClient.delete(`/api/cart/doctor/${doctorId}/remove-item`, {
      data: { medicineId },
    });
    return response.data;
  },

  async moveDoctorCartToDefault(doctorId: string): Promise<any> {
    const response = await apiClient.post(`/api/cart/doctor/${doctorId}/move-to-default`, {});
    return response.data;
  },

  async deleteDoctorCart(doctorId: string): Promise<any> {
    const response = await apiClient.delete(`/api/cart/doctor/${doctorId}`);
    return response.data;
  },

  async estimateFreight(payload: {
    platform: 'delhivery';
    retailerId: string;
    destPin: string;
    items: Array<{ medicineId: string; quantity: number }>;
    paymentMethod: 'onlinePayment' | 'cashOnDelivery';
  }): Promise<{
    totalAmount?: number;
    originPin?: string;
    destPin?: string;
    weightGrams?: number;
    zone?: string;
    message?: string;
  }> {
    const response = await apiClient.post('/api/shipping/estimate-freight', payload);
    return response.data;
  },

  async uploadOrderPrescriptions(
    files: Array<{ uri: string; name: string; type: string }>
  ): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('prescriptions', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
    const response = await apiClient.post<{ urls?: string[]; url?: string }>(
      '/api/orders/upload-prescription',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      }
    );
    if (Array.isArray(response.data?.urls)) return response.data.urls;
    if (response.data?.url) return [response.data.url];
    return [];
  },

  async createRazorpayOrder(amount: number): Promise<{
    id: string;
    amount: number;
    currency: string;
  }> {
    const response = await apiClient.post('/api/payment/create-order', { amount });
    return response.data;
  },

  async createMedicineOrder(payload: {
    items: Array<{ medicineId: string; quantity: number }>;
    buyer: { firstName: string; lastName: string; type: string };
    shippingAddress: ShippingAddress;
    paymentMethod: 'onlinePayment' | 'cashOnDelivery';
    shippingCharge: number;
    prescriptionUrls?: string[];
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }): Promise<OrderRecord> {
    const response = await apiClient.post<OrderRecord>('/api/orders', payload);
    return response.data;
  },

  async getOrdersByBuyerId(buyerId: string): Promise<OrderRecord[]> {
    try {
      const response = await apiClient.get<{ orders?: OrderRecord[] }>(
        `/api/orders/getOrdersByBuyerId/${buyerId}`
      );
      return Array.isArray(response.data?.orders) ? response.data.orders : [];
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('not found') || err?.message?.includes('404')) {
        return [];
      }
      throw err;
    }
  },

  async getOrderTracking(
    orderId: string,
    retailerId?: string
  ): Promise<TrackingResponse | TrackingResponse[]> {
    const url = retailerId
      ? `/api/orders/${orderId}/tracking?retailerId=${encodeURIComponent(retailerId)}`
      : `/api/orders/${orderId}/tracking`;
    const response = await apiClient.get<TrackingResponse | TrackingResponse[]>(url);
    return response.data;
  },

  async raiseOrderDispute(orderId: string, reason: string): Promise<any> {
    const response = await apiClient.post(`/api/orders/${orderId}/dispute`, { reason });
    return response.data;
  },

  async submitOrderReview(
    orderId: string,
    rating: number,
    comment: string,
    receivingDate?: string
  ): Promise<{ message?: string; order?: OrderRecord }> {
    const response = await apiClient.put(`/api/orders/updateOrderReview/${orderId}`, {
      rating,
      comment,
      ...(receivingDate ? { receivingDate } : {}),
    });
    return response.data;
  },

  // ─── Video Consultation (Daily.co) & Feedback ────────────────────────────────
  async getDailyJoinUrl(bookingId: string): Promise<string> {
    const response = await apiClient.get<{ url?: string; roomUrl?: string }>(
      `/api/bookings/${bookingId}/daily-join`
    );
    const url = response.data?.url || response.data?.roomUrl;
    if (!url) {
      throw new Error('Video room URL was not returned by server.');
    }
    return url;
  },

  async submitBookingReview(
    bookingId: string,
    rating: number,
    review: string
  ): Promise<Appointment> {
    const response = await apiClient.put<Appointment>(
      `/api/bookings/rating-review/${bookingId}`,
      { rating, review }
    );
    return response.data;
  },

  async raiseBookingDispute(bookingId: string, reason: string): Promise<any> {
    const response = await apiClient.post(`/api/bookings/${bookingId}/dispute`, {
      reason,
    });
    return response.data;
  },

  async getPatientReviewedBookings(patientId: string): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<{ bookings?: Appointment[] }>(
        `/api/bookings/patient/reviews/${patientId}`
      );
      return Array.isArray(response.data?.bookings) ? response.data.bookings : [];
    } catch {
      return [];
    }
  },

  async getPatientReviewedOrders(buyerId: string): Promise<OrderRecord[]> {
    try {
      const response = await apiClient.get<{ orders?: OrderRecord[] } | OrderRecord[]>(
        `/api/orders/reviews/${buyerId}`
      );
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.orders)) return data.orders;
      return [];
    } catch {
      return [];
    }
  },
};
