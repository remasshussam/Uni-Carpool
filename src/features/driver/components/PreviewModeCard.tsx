import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type PreviewModeCardProps = {
  compact?: boolean;
};

export function PreviewModeCard({ compact = false }: PreviewModeCardProps) {
  return (
    <View className="rounded-2xl border border-[#00A878]/25 bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#DDF7E8]">
          <Ionicons name="sparkles" size={22} color="#00A878" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-[#14213D]">Preview mode</Text>
          <Text className={`text-sm leading-5 text-[#6B7280] ${compact ? 'mt-0.5' : 'mt-1'}`}>
            {compact
              ? 'Demo rides stay in memory for this session and reset when the app restarts.'
              : 'These campus rides are interactive demo data. Creating, editing, requests, and cancellation update this session immediately. The data resets when the app restarts. Supabase replaces this store in Phase 2.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
