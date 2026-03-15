import { MapPin } from 'lucide-react';

interface RadiusSelectorProps {
  radius: number;
  onChange: (radius: number) => void;
  resultCount: number;
  placeName?: string;
}

const RADIUS_OPTIONS = [
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 1500, label: '1.5km' },
  { value: 2000, label: '2km' },
];

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  radius,
  onChange,
  resultCount,
  placeName,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm px-4 py-2 border border-gray-200 flex items-center gap-2 text-sm text-gray-700 flex-wrap">
      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <span>
        Showing <strong>{resultCount}</strong> carpark{resultCount !== 1 ? 's' : ''} within
      </span>
      <div className="flex gap-1">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              radius === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {placeName && (
        <span className="text-gray-500">
          of <strong className="text-gray-700">{placeName}</strong>
        </span>
      )}
    </div>
  );
};
