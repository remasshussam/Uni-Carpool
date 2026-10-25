import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

type AuthCarBadgeProps = {
  size?: number;
};

export function AuthCarBadge({ size = 84 }: AuthCarBadgeProps) {
  return (
    <View
      className="items-center justify-center rounded-full bg-white"
      style={{
        width: size,
        height: size,
        shadowColor: '#14213D',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}>
      <View
        className="items-center justify-center rounded-full bg-[#E8F1FF]"
        style={{ width: size - 16, height: size - 16 }}>
        <Ionicons name="car-sport" size={size * 0.4} color="#1D4ED8" />
      </View>
    </View>
  );
}
