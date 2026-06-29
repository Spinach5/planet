import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  scroll: {
    maxHeight: 48,
  },
  content: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8e8e8',
  },
  chipActive: {
    backgroundColor: '#47a5fd',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
});
