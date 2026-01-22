// Animation UI components
export { default as AnimatedCharacterText } from './AnimatedCharacterText';
export { default as DotIndicator } from './DotIndicator';
export type { AnimatedCharacterTextProps } from './AnimatedCharacterText';
export type { DotIndicatorProps } from './DotIndicator';

// AnimatedCharacterText presets and utilities
export {
  getAnimatedTextPreset,
  createCustomPreset,
  presets,
  type PresetName,
  type CharacterStyleConfig,
} from './AnimatedCharacterTextPresets';
