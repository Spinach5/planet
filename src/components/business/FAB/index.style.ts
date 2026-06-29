import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  label: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
});
