export interface PricingInfo {
    name: string;
    weekday_rate: string;
    weekday_rate_after_hours?: string;
    saturday_rate: string;
    sunday_rate: string;
    note?: string;
}

export interface availableCarparkResponse {
    carpark_num: string;
    area: string;
    development: string;
    address?: string;
    postal_code?: string;
    latitude: number;
    longitude: number;
    car_lots: number;
    heavy_vehicle_lots: number;
    motorcycle_lots: number;
    agency: string; // "HDB", "LTA", or "URA"
    
    // Pricing fields
    has_pricing: boolean;
    has_specific_pricing?: boolean;
    pricing: PricingInfo | null;
    
    // AI-calculated fields (present when duration is provided)
    calculated_cost: number | null;
    cost_breakdown: string | null;
    ai_explanation?: string | null;
    ai_confidence?: 'high' | 'medium' | 'low';
}