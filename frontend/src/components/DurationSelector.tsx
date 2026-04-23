import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DurationSelectorProps {
    duration: number;
    onChange: (hours: number) => void;
    dayType: 'weekday' | 'saturday' | 'sunday';
    onDayTypeChange: (type: 'weekday' | 'saturday' | 'sunday') => void;
    collapseTick?: number;
}

const formatDuration = (hours: number) => {
    if (hours < 1) return `${hours * 60}min`;
    return `${hours}hr${hours > 1 ? 's' : ''}`;
};

const formatDayType = (type: string) =>
    type.charAt(0).toUpperCase() + type.slice(1);

const FullSelector = ({
    duration,
    onChange,
    dayType,
    onDayTypeChange,
}: Pick<DurationSelectorProps, 'duration' | 'onChange' | 'dayType' | 'onDayTypeChange'>) => {
    const commonDurations = [0.5, 1, 2, 3, 4, 6, 8, 12];

    return (
        <>
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
                        {formatDuration(hours)}
                    </button>
                ))}
            </div>

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
                            {formatDayType(type)}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export const DurationSelector: React.FC<DurationSelectorProps> = ({
    duration,
    onChange,
    dayType,
    onDayTypeChange,
    collapseTick,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Parent can force collapse (e.g., on map tap)
    useEffect(() => {
        if (collapseTick) setIsExpanded(false);
    }, [collapseTick]);

    return (
        <>
            {/* Mobile: compact bar + expandable panel */}
            <div className="md:hidden">
                {/* Expanded panel - renders above the compact bar */}
                {isExpanded && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-2 border border-gray-200">
                        <FullSelector
                            duration={duration}
                            onChange={onChange}
                            dayType={dayType}
                            onDayTypeChange={onDayTypeChange}
                        />
                    </div>
                )}

                {/* Compact bar - always visible on mobile */}
                <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="w-full bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                            {formatDuration(duration)} · {formatDayType(dayType)}
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    )}
                </button>
            </div>

            {/* Desktop: always expanded */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
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
                <FullSelector
                    duration={duration}
                    onChange={onChange}
                    dayType={dayType}
                    onDayTypeChange={onDayTypeChange}
                />
            </div>
        </>
    );
};
