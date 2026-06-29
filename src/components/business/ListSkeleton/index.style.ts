import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    gap: 8,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  imagePlaceholder: {
    width: '100%',
    height: 170,
    backgroundColor: '#ddd',
  },
  body: {
    padding: 8,
    gap: 4,
  },
  line: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
});
