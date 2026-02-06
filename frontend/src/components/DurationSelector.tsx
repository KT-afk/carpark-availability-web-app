import React from 'react';
import { Clock } from 'lucide-react';

interface DurationSelectorProps {
    duration: number;
    onChange: (hours: number) => void;
    dayType: 'weekday' | 'saturday' | 'sunday';
    onDayTypeChange: (type: 'weekday' | 'saturday' | 'sunday') => void;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
    duration,
    onChange,
    dayType,
    onDayTypeChange
}) => {
    const commonDurations = [0.5, 1, 2, 3, 4, 6, 8, 12];
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                    Find Best Rate for Your Duration
                </h3>
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">AI-powered</span>
                </div>
            </div>
            
            {/* Quick duration buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
                {commonDurations.map(hours => (
                    <button
                        key={hours}
                        onClick={() => onChange(hours)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            duration === hours
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {hours < 1 ? `${hours * 60}min` : `${hours}hr${hours > 1 ? 's' : ''}`}
                    </button>
                ))}
            </div>
            
            {/* Custom duration input */}
            <div className="flex items-center gap-2 mb-3">
                <label className="text-sm text-gray-600">Custom:</label>
                <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={duration}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0.5)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-sm text-gray-600">hours</span>
            </div>
            
            {/* Day type selector */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Day type:</label>
                <div className="flex gap-2">
                    {(['weekday', 'saturday', 'sunday'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => onDayTypeChange(type)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                dayType === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
