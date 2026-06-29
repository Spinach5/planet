import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
