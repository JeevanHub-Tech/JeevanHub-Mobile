// src/types/patient.ts

export interface SlotTemplate {
  _id?: string;
  startTime: string; // e.g. "10:00"
  duration: number; // in minutes
  fee?: number;
  consultationType?: 'Online' | 'In-Person' | 'Both';
  sessionType?: '1-to-1' | 'Group';
  maxCapacity?: number;
  isDisabled?: boolean;
}

export interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string[];
  designation?: string;
  education?: string;
  college?: string;
  experience?: number;
  price?: number;
  dietPlanFee?: number;
  upiId?: string;
  profileImage?: string;
  rating?: number;
  reviewCount?: number;
  gender?: string;
  address?: string;
  zipCode?: string;
  introduction?: string;
  languages?: string[];
  availableSlots?: {
    Monday?: SlotTemplate[];
    Tuesday?: SlotTemplate[];
    Wednesday?: SlotTemplate[];
    Thursday?: SlotTemplate[];
    Friday?: SlotTemplate[];
    Saturday?: SlotTemplate[];
    Sunday?: SlotTemplate[];
  };
}

export interface PrescribedSupplement {
  _id?: string;
  medicineId?: string;
  medicineName: string;
  dosage?: string;
  instructions?: string;
  addedAt?: string;
  published?: boolean;
}

export interface Appointment {
  _id: string;
  doctorId: string | DoctorProfile;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  doctorUpiId?: string;
  doctorSpecialization?: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  dateOfAppointment?: string;
  timeSlot?: string;
  consultationType: 'Online' | 'In-Person';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  requestAccept?: 'pending' | 'accepted' | 'denied';
  fee: number;
  amountPaid?: number;
  notes?: string;
  patientIllness?: string;
  meetingLink?: string;
  meetLink?: string;
  dailyRoomUrl?: string;
  diagnosis?: string;
  recommendedSupplements?: PrescribedSupplement[];
  dietPlanRequested?: boolean;
  dietPlanFee?: number;
  dietPlanStatus?: 'none' | 'pending' | 'completed';
  rating?: number | null;
  review?: string;
  payoutStatus?: string;
  createdAt?: string;
}

export interface CreateBookingPayload {
  doctorId: string;
  patientId: string;
  patientEmail: string;
  patientPhone: string;
  patientName: string;
  date: string;
  timeSlot: string;
  consultationType: 'Online' | 'In-Person';
  symptoms?: string;
  fee: number;
}

export interface DoshaScores {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface DoshaResult {
  dominantDosha: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridoshic';
  scores: DoshaScores;
  description: string;
  dietRecommendations: {
    favor: string[];
    avoid: string[];
  };
  lifestyleTips: string[];
  recommendedHerbs: string[];
}

export interface MedicalRecordItem {
  _id?: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  ocr?: {
    status: 'pending' | 'processing' | 'done' | 'failed';
    doctorName?: string;
    prescriptionDate?: string;
    medicines?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }>;
    rawText?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface PatientDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  zipCode?: string;
  address?: string;
  profileImage?: string;
  age?: number;
}

export interface UpdatePatientPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  pincode?: string;
  address?: string;
  profileImage?: string;
}

export type NotificationCategory =
  | 'appointment'
  | 'diet'
  | 'yoga'
  | 'order'
  | 'payment'
  | 'delivery'
  | 'system'
  | string;

export interface AppNotification {
  _id: string;
  userId: string;
  type?: NotificationCategory;
  title?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BlogVideo {
  url?: string;
  title?: string;
  thumbnail?: string;
}

export interface BlogEmbed {
  type?: string;
  embedCode?: string;
  url?: string;
}

export interface BlogTranslation {
  title: string;
  category?: string;
  description: string;
  cached?: boolean;
  translatedAt?: string;
}

export interface BlogItem {
  _id: string;
  title: string;
  description: string;
  date?: string;
  authorName?: string;
  authorType?: string;
  category?: string;
  tags?: string[];
  type?: 'Video' | 'normal' | 'ai' | string;
  image?: string | null;
  url?: string;
  videos?: BlogVideo[];
  embeds?: BlogEmbed[];
  user?: {
    userId?: string;
    name?: string;
  };
  translations?: {
    hi?: BlogTranslation;
    [lang: string]: BlogTranslation | undefined;
  };
}

// ─── Full Prescription & Wellness (Part 3) ───────────────────────────────────

export interface MedicineAvailabilityItem {
  _id: string;
  name?: string;
  price?: number;
  image?: string;
  isActive?: boolean;
}

export interface WellnessProfile {
  _id?: string;
  patientId?: string;
  basicDetails?: {
    heightCm?: number;
    weightKg?: number;
    bodyType?: 'lean_thin' | 'athletic_defined' | 'medium_frame' | 'soft_round' | string;
  };
  healthInfo?: {
    conditions?: {
      diabetes?: boolean;
      highBP?: boolean;
      obesityFocus?: boolean;
      skinDisease?: boolean;
      jointPainArthritis?: boolean;
      digestiveIssues?: boolean;
      respiratoryIssues?: boolean;
      other?: string[];
    };
    medications?: string[];
    allergies?: string[];
  };
  lifestyle?: {
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | string;
    sleepHours?: number;
    sleepQuality?: 'poor' | 'fair' | 'good' | string;
    stressLevel?: 'low' | 'moderate' | 'high' | string;
    exerciseHabits?: string;
    workRoutine?: string;
  };
  foodHabits?: {
    dietType?: 'vegetarian' | 'non_vegetarian' | 'eggetarian' | 'vegan' | string;
    regionalPreference?: 'north_indian' | 'south_indian' | 'indo_chinese' | 'no_preference' | string;
    preferredFoods?: string[];
    dislikedFoods?: string[];
    eatingTimings?: string;
    waterIntakeLiters?: number;
  };
  season?: {
    current?: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter' | string;
  };
  updatedAt?: string;
}

export interface BackendDoshaAssessment {
  _id?: string;
  primaryDosha: string;
  secondaryDosha?: string | null;
  thirdDoshaStatus?: 'Low' | 'Balanced' | 'Elevated' | string;
  calculatedScores?: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  isComplete?: boolean;
  doshaProfile?: {
    primary?: {
      title?: string;
      element?: string;
      explanation?: string;
      characteristics?: string[];
      possibleImbalances?: string[];
      lifestyleRecommendations?: string[];
    };
    secondary?: {
      title?: string;
      element?: string;
      explanation?: string;
    } | null;
  };
  updatedAt?: string;
}

export type MealKey = 'breakfast' | 'midMorning' | 'lunch' | 'eveningSnack' | 'dinner';

export interface MealSlot {
  items?: string[];
  portion?: string;
  purpose?: string;
}

export interface DayMealPlan {
  day: string;
  breakfast?: MealSlot;
  midMorning?: MealSlot;
  lunch?: MealSlot;
  eveningSnack?: MealSlot;
  dinner?: MealSlot;
}

export interface CookingInstructionMeal {
  mealContext?: string;
  cookingMethod?: string;
  preparationStyle?: string;
  spicesHerbs?: string[];
  goodCombinations?: string[];
  avoidCombinations?: string[];
}

export interface DietDisplayPlan {
  summary?: {
    bmiCategory?: string;
    prakritiSummary?: string;
    healthConsiderations?: string[];
    regionalPreference?: string;
  };
  explanation?: {
    doshaBalanceReasoning?: string;
    medicalConditionReasoning?: string;
    seasonalReasoning?: string;
    regionalAdaptationReasoning?: string;
  };
  weeklyPlan?: DayMealPlan[];
  cookingInstructions?: {
    meals?: CookingInstructionMeal[];
    generalGuidelines?: string[];
  };
  foodsToAvoid?: {
    doshaBased?: string[];
    medicalBased?: string[];
    seasonalBased?: string[];
    regionalDishesToAvoid?: string[];
  };
  lifestyleRecommendations?: string[];
}

export interface PlanDoctorReview {
  reviewedBy?: string | { _id?: string; firstName?: string; lastName?: string; email?: string };
  doctorName?: string;
  reviewedAt?: string;
  bookingId?: string;
  notes?: string;
  published?: boolean;
}

export interface AyurvedaDietPlanResponse {
  _id?: string;
  status?: 'ai' | 'ai_modified' | 'doctor_approved' | string;
  isStale?: boolean;
  generatedAt?: string;
  summary?: DietDisplayPlan['summary'];
  doctorReview?: PlanDoctorReview;
  displayPlan?: DietDisplayPlan;
}

export interface MealRecipe {
  dishName: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: string | number;
  ingredients?: Array<{
    item: string;
    ayurvedicRole?: string;
  }>;
  steps?: string[];
  ayurvedicBenefits?: string;
  cookingTips?: string[];
}

export interface YogaAsana {
  name: string;
  link?: string;
}

export interface YogaDisplayPlan {
  summary?: string;
  morning?: YogaAsana[];
  evening?: YogaAsana[];
}

export interface AyurvedaYogaPlanResponse {
  _id?: string;
  status?: 'ai' | 'ai_modified' | 'doctor_approved' | string;
  isStale?: boolean;
  generatedAt?: string;
  doctorReview?: PlanDoctorReview;
  displayPlan?: YogaDisplayPlan;
}

// ─── Medicines Store, Cart, Checkout & Order Tracking (Part 4) ───────────────

export interface MedicineRetailerInfo {
  _id?: string;
  BusinessName?: string;
  firstName?: string;
  lastName?: string;
  adminVerification?: {
    isVerified?: boolean;
  };
}

export interface MedicineItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  description?: string;
  prescription?: boolean;
  diseasesTreated?: string[];
  weightGrams?: number;
  images?: string[];
  image?: string;
  isActive?: boolean;
  rating?: number;
  retailerId?: MedicineRetailerInfo | string;
}

export interface PaginatedMedicinesResponse {
  medicines: MedicineItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface CartLineItem {
  medicineId: MedicineItem;
  quantity: number;
  price?: number;
}

export interface DoctorCart {
  _id: string;
  doctorId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  };
  items: CartLineItem[];
  totalPrice: number;
  updatedAt?: string;
}

export interface CartResponse {
  defaultCart: {
    items: CartLineItem[];
    totalPrice: number;
  };
  doctorCarts: DoctorCart[];
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderLineItem {
  medicineId?: MedicineItem;
  quantity: number;
  subTotal: number;
}

export interface OrderShipment {
  retailerId?: string;
  trackingId?: string;
  platform?: string;
  shippedAt?: string;
  lastPolledStatus?: string;
  lastPolledLocation?: string;
  lastPolledAt?: string;
  trackingTimeline?: TrackingTimelineEntry[];
}

export interface OrderRecord {
  _id: string;
  items: OrderLineItem[];
  totalPrice: number;
  shippingCharge?: number;
  paymentMethod: 'onlinePayment' | 'cashOnDelivery' | string;
  paymentStatus?: string;
  orderStatus: string;
  payoutStatus?: string;
  retailers?: string[];
  shipments?: OrderShipment[];
  shippingAddress?: ShippingAddress;
  review?: {
    rating: number;
    comment?: string;
    createdAt?: string;
    deliveredAt?: string;
  };
  createdAt?: string;
}

export interface TrackingTimelineEntry {
  status?: string;
  statusCode?: string;
  location?: string;
  timestamp?: string;
  remarks?: string;
}

export interface TrackingResponse {
  trackingId?: string;
  orderStatus?: string;
  currentStatus?: string;
  currentLocation?: string;
  lastPolledStatus?: string;
  lastPolledLocation?: string;
  lastUpdated?: string;
  source?: string;
  platform?: string;
  error?: string;
  timeline?: TrackingTimelineEntry[];
  trackingTimeline?: TrackingTimelineEntry[];
  shipment?: OrderShipment;
}
