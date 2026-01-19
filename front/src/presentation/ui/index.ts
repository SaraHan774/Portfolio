// Pure, reusable UI components
// These components have no business logic and can be used across any application

// Common
export { Spinner, LoadingContainer } from './common';

// Media
export { FadeInImage } from './media';

// Animation
export {
  AnimatedCharacterText,
  DotIndicator,
  getAnimatedTextPreset,
  createCustomPreset,
  presets,
} from './animation';
export type { AnimatedCharacterTextProps, DotIndicatorProps, PresetName, CharacterStyleConfig } from './animation';

// Layout
// Will be populated with additional layout primitives
