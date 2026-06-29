/**
 * Barrel re-export for backward compatibility.
 * New code should import from specific subdirectories.
 */

// Base
export { Loading } from './base/Loading';
export { LoadingOverlay } from './base/LoadingOverlay';
export { MaterialIcon } from './base/MaterialIcon';
export type { IconName } from './base/MaterialIcon';

// Themed
export { ThemedView } from './themed/ThemedView';
export type { ThemedViewProps } from './themed/ThemedView';
export { ThemedText } from './themed/ThemedText';
export type { ThemedTextProps } from './themed/ThemedText';

// Layout
export { GridContainer } from './layout/GridContainer';
export { GridItem } from './layout/GridItem';
export { HeadStatus } from './layout/HeadStatus';

// Base UI
export { Collapsible } from './base/ui/collapsible';

// Feature
export { AnimatedIcon, AnimatedSplashOverlay } from './feature/animated-icon';
export { HintRow } from './feature/hint-row';
export { IndexSwiper } from './feature/IndexSwiper';
export { ExternalLink } from './feature/external-link';
export { WebBadge } from './feature/web-badge';
