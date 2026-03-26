import { MapPin, Sun, Moon, CloudRain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';

export default function PersonalizedHeader() {
  const { user } = useAuth();
  const { preferences, loading } = useBehaviorTracking();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-orange-500' };
    if (hour < 17) return { text: 'Good afternoon', icon: Sun, color: 'text-yellow-500' };
    if (hour < 21) return { text: 'Good evening', icon: CloudRain, color: 'text-purple-500' };
    return { text: 'Good night', icon: Moon, color: 'text-indigo-500' };
  };


  if (loading || !user || !preferences) {
    return null;
  }

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const firstName = user.displayName?.split(' ')[0] || 'there';

  return (
    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Greeting with Location */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GreetingIcon className={`w-8 h-8 ${greeting.color}`} />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {greeting.text}, {firstName}!
              </h1>
              <p className="text-white/90 mt-1">
                Discover projects made for you
              </p>
            </div>
          </div>

          {/* Location in top right */}
          {preferences.preferredLocation?.city && preferences.preferredLocation?.state && (
            <div className="text-right">
              <p className="text-sm text-white/70 flex items-center justify-end gap-1">
                <MapPin className="w-4 h-4 text-white/70" style={{ verticalAlign: 'middle' }} />
                <span>Your location</span>
              </p>
              <p className="text-sm font-medium">
                {preferences.preferredLocation.city}, {preferences.preferredLocation.state}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
