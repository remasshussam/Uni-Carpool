import { View } from 'react-native';

export function CampusHero() {
  return (
    <View className="h-72 overflow-hidden bg-[#8EC8F6]">
      <View className="absolute left-6 top-8 h-12 w-28 rounded-full bg-white/80" />
      <View className="absolute right-10 top-12 h-10 w-24 rounded-full bg-white/70" />
      <View className="absolute left-36 top-5 h-8 w-16 rounded-full bg-white/60" />

      <View className="absolute bottom-0 h-28 w-full bg-[#2F8A45]" />
      <View className="absolute bottom-20 h-12 w-full bg-[#49A85A]" />

      <View className="absolute bottom-24 left-6 h-40 w-44 rounded-t-md bg-[#C4623D]">
        <View className="absolute -top-7 left-16 h-10 w-8 bg-[#8E3A32]" />
        <View className="absolute -top-12 left-[72px] h-6 w-3 bg-[#6B2C28]" />
        <View className="mt-4 flex-row flex-wrap gap-2 px-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <View key={index} className="h-5 w-6 rounded-sm bg-[#F4E1C1]" />
          ))}
        </View>
      </View>

      <View className="absolute bottom-24 right-8 h-28 w-28 rounded-full bg-[#1E7A3A]" />
      <View className="absolute bottom-16 right-16 h-10 w-4 rounded-sm bg-[#6B4423]" />
      <View className="absolute bottom-28 right-28 h-16 w-16 rounded-full bg-[#166534]" />
    </View>
  );
}
