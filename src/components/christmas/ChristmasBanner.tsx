import { Link } from 'react-router-dom';
import { Gift, Snowflake, Music } from 'lucide-react';

export const ChristmasBanner = () => {
  return (
    <Link 
      to="/kerst"
      className="block bg-gradient-to-r from-red-700 via-green-700 to-red-700 hover:from-red-600 hover:via-green-600 hover:to-red-600 transition-all"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 py-2.5 text-white">
          <Snowflake className="w-4 h-4 animate-pulse" />
          <span className="text-sm md:text-base font-medium">
            🎄 Ontdek onze Kerstverhalen & Muziek
          </span>
          <Gift className="w-4 h-4" />
          <span className="hidden sm:inline text-sm opacity-80">→ Bekijk alles</span>
        </div>
      </div>
    </Link>
  );
};
