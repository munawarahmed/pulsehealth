import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '../theme/colors';
import { useWorkoutStore } from '../store/workoutStore';
import { ExerciseRow } from '../components/ExerciseRow';
import { muscleGroupBySlug } from '../logic/muscleGroups';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseList'>;

export function ExerciseListScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const group = muscleGroupBySlug(slug);

  const list = useWorkoutStore(s => s.byGroup[slug]);
  const fetching = useWorkoutStore(s => s.fetching[slug]);
  const error = useWorkoutStore(s => s.fetchError[slug]);
  const loadGroup = useWorkoutStore(s => s.loadGroup);
  const refreshGroup = useWorkoutStore(s => s.refreshGroup);

  useEffect(() => {
    // Cache-first read so the list paints instantly even on cold start.
    loadGroup(slug);
  }, [slug, loadGroup]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{group?.label ?? slug}</Text>
        <Pressable
          onPress={() => refreshGroup(slug)}
          disabled={!!fetching}
          hitSlop={12}
        >
          <Text style={[styles.refresh, fetching && styles.refreshDim]}>
            {fetching ? 'Fetching…' : 'Fetch more'}
          </Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Couldn't reach Wger ({error}). Showing cached exercises.
          </Text>
        </View>
      )}

      {!list ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ExerciseRow
              name={item.name}
              hint={item.description}
              imageUrl={item.imageUrl}
              source={item.source}
              onPress={() =>
                navigation.navigate('ExerciseDetail', { exerciseId: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No exercises yet. Tap "Fetch more" to load from Wger.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: { ...Typography.body, color: Colors.textMuted },
  title: { ...Typography.h1, color: Colors.text },
  refresh: { ...Typography.caption, color: Colors.primary },
  refreshDim: { color: Colors.textDim },
  errorBanner: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warn,
    padding: Spacing.md,
  },
  errorText: { ...Typography.caption, color: Colors.warn },
  listContent: { padding: Spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
