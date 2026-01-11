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
    weekdays_rate: string | null;
    saturday_rate: string | null;
    sunday_rate: string | null;
    has_rate_info: boolean;
}