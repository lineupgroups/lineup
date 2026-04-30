import { MapPin, Sun, Moon, CloudRain, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';

export default function PersonalizedHeader() {
  const { user } = useAuth();
  const { preferences, loading } = useBehaviorTracking();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-brand-orange', bg: 'bg-brand-orange/10' };
    if (hour < 17) return { text: 'Good afternoon', icon: Sun, color: 'text-brand-orange', bg: 'bg-brand-orange/10' };
    if (hour < 21) return { text: 'Good evening', icon: CloudRain, color: 'text-brand-acid', bg: 'bg-brand-acid/10' };
    return { text: 'Good night', icon: Moon, color: 'text-blue-400', bg: 'bg-blue-400/10' };
  };


  if (loading || !user || !preferences) {
    return null;
  }

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const firstName = user.displayName?.split(' ')[0] || 'there';

  return (
    <div className="bg-[#111] border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Main Greeting with Location */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${greeting.bg}`}>
              <GreetingIcon className={`w-8 h-8 ${greeting.color}`} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-brand-white tracking-tight">
                {greeting.text}, <span className="text-brand-acid">{firstName}</span>!
              </h1>
              <p className="text-neutral-400 mt-2 text-lg font-medium flex items-center gap-2">
                Discover projects made for you <Star className="w-4 h-4 text-brand-orange fill-brand-orange" />
              </p>
            </div>
          </div>

          {/* Location in top right */}
          {preferences.preferredLocation?.city && preferences.preferredLocation?.state && (
            <div className="text-right bg-neutral-900/50 px-5 py-3 rounded-2xl border border-neutral-800 backdrop-blur-sm self-start sm:self-center">
              <p className="text-xs text-neutral-500 flex items-center justify-start sm:justify-end gap-1.5 font-bold uppercase tracking-wider mb-1">
                <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                <span>Your location</span>
              </p>
              <p className="text-sm font-bold text-brand-white">
                {preferences.preferredLocation.city}, {preferences.preferredLocation.state}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
