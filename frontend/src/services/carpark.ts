import { availableCarparkResponse } from "@/types/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function fetchCarparkById(
  carparkNum: string,
  duration: number,
  dayType: string
): Promise<availableCarparkResponse | null> {
  try {
    const url = `${API_URL}/carparks/${carparkNum}?duration=${duration}&day_type=${dayType}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.carpark;
  } catch (error) {
    console.error("Error fetching carpark:", error);
    return null;
  }
}
