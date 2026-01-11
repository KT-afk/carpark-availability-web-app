export interface availableCarparkResponse {
    carpark_num: string;
    area: string;
    development: string;
    latitude: number;
    longitude: number;
    lot_type: string;
    car_lots: number;
    heavy_vehicle_lots: number;
    motorcycle_lots: number;
    has_rate_info: boolean;
    weekdays_rate?: string;
    saturday_rate?: string;
    sunday_rate?: string;
}