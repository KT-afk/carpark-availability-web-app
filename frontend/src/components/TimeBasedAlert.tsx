import { availableCarparkResponse } from "@/types/types";

interface TimeBasedAlertProps {
  carpark: availableCarparkResponse;
  duration: number;
  dayType: 'weekday' | 'saturday' | 'sunday';
}

export const TimeBasedAlert = ({ carpark, duration, dayType }: TimeBasedAlertProps) => {
  // Check if carpark has after-hours pricing
  const hasAfterHours = carpark.pricing?.weekday_rate_after_hours && 
                        carpark.pricing.weekday_rate_after_hours.trim() !== '';

  if (!hasAfterHours || dayType !== 'weekday') {
    return null; // Only show for weekday with after-hours rates
  }

  // Simple heuristic: check if "after" keyword exists in rate string
  const afterHoursText = carpark.pricing?.weekday_rate_after_hours || '';
  
  // Extract time if mentioned (e.g., "after 5pm" or "after 6pm")
  const timeMatch = afterHoursText.match(/after\s+(\d+)(?::(\d+))?\s*(pm|PM|am|AM)/);
  
  if (!timeMatch) {
    return null; // Can't determine time
  }

  const hour = parseInt(timeMatch[1]);
  const period = timeMatch[3].toLowerCase();
  const afterHoursStartHour = period === 'pm' ? (hour === 12 ? 12 : hour + 12) : hour;

  // Get current time (you could pass this as a prop for testing)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if we're close to after-hours time (within 2 hours before)
  const minutesUntilAfterHours = (afterHoursStartHour * 60) - (currentHour * 60 + currentMinute);
  
  // Only show if we're 0-120 minutes before after-hours starts
  if (minutesUntilAfterHours <= 0 || minutesUntilAfterHours > 120) {
    return null;
  }

  // Format the time display
  const hoursUntil = Math.floor(minutesUntilAfterHours / 60);
  const minsUntil = minutesUntilAfterHours % 60;
  const timeDisplay = hoursUntil > 0 
    ? `${hoursUntil}h ${minsUntil}m`
    : `${minsUntil} minutes`;

  const afterHoursTime = afterHoursStartHour > 12 
    ? `${afterHoursStartHour - 12}:00pm`
    : `${afterHoursStartHour}:00am`;

  return (
    <div className="mt-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <span className="text-amber-600 text-lg">⏰</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Pro Tip: Save money by waiting!
          </p>
          <p className="text-xs text-amber-800">
            After-hours rates start at <strong>{afterHoursTime}</strong>
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Just <strong>{timeDisplay}</strong> away • Check "{afterHoursText}"
          </p>
        </div>
      </div>
    </div>
  );
};
