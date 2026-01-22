/**
 * Preset configurations for AnimatedCharacterText
 *
 * Provides common style combinations to reduce boilerplate
 * and ensure consistency across the application.
 */

import type { AnimatedCharacterTextProps } from './AnimatedCharacterText';

// Base character style that disables animation
const baseCharacterStyle = {
  display: 'inline-block' as const,
  transition: 'none' as const,
};

// Common stroke configuration
const STROKE_WIDTH = '0.7px';
const STROKE_COLOR = 'var(--color-category-hover-stroke)';

/**
 * Preset type definition for type-safe preset usage
 */
export type PresetName =
  | 'category'           // For category keywords (black text)
  | 'work'              // For work titles (gray text)
  | 'caption-link'      // For caption links (primary text)
  | 'custom';           // For custom configurations

/**
 * Configuration options for character styles
 */
export interface CharacterStyleConfig {
  /** Color when not active */
  inactiveColor: string;
  /** Font size (optional) */
  fontSize?: string;
  /** Display mode for container */
  containerDisplay?: 'inline-block' | 'block';
}

/**
 * Preset configurations mapping
 */
const PRESETS: Record<Exclude<PresetName, 'custom'>, CharacterStyleConfig> = {
  category: {
    inactiveColor: 'var(--color-category-clickable)',
    fontSize: 'var(--font-size-sm)',
    containerDisplay: 'block',
  },
  work: {
    inactiveColor: 'var(--color-text-secondary)',
    containerDisplay: 'inline-block',
  },
  'caption-link': {
    inactiveColor: 'var(--color-text-primary)',
    containerDisplay: 'inline-block',
  },
};

/**
 * Generate character style function for AnimatedCharacterText
 *
 * @param isActive - Whether the text is in active state
 * @param isSelected - Whether the text is selected
 * @param config - Style configuration
 * @returns Character style object
 */
function generateCharacterStyle(
  isActive: boolean,
  isSelected: boolean,
  config: CharacterStyleConfig
): React.CSSProperties {
  return {
    ...baseCharacterStyle,
    ...(config.fontSize && { fontSize: config.fontSize }),
    color: isActive ? 'transparent' : config.inactiveColor,
    WebkitTextStroke: isActive
      ? `${STROKE_WIDTH} ${STROKE_COLOR}`
      : '0px transparent',
    fontWeight: isSelected ? 700 : 400,
  };
}

/**
 * Get preset props for AnimatedCharacterText
 *
 * @param preset - Preset name or custom configuration
 * @returns Partial props for AnimatedCharacterText
 *
 * @example
 * ```tsx
 * <AnimatedCharacterText
 *   text={text}
 *   isActive={isHovered || isSelected}
 *   isSelected={isSelected}
 *   {...getAnimatedTextPreset('category')}
 * />
 * ```
 */
export function getAnimatedTextPreset(
  preset: PresetName,
  customConfig?: CharacterStyleConfig
): Pick<
  AnimatedCharacterTextProps,
  'containerStyle' | 'characterStyle' | 'containerVariants' | 'characterVariants'
> {
  const config = preset === 'custom' && customConfig
    ? customConfig
    : PRESETS[preset as Exclude<PresetName, 'custom'>];

  return {
    containerStyle: {
      display: config.containerDisplay || 'inline-block'
    },
    characterStyle: (isActive, isSelected) =>
      generateCharacterStyle(isActive, isSelected, config),
    containerVariants: {},
    characterVariants: {},
  };
}

/**
 * Create custom preset configuration
 *
 * @param config - Custom character style configuration
 * @returns Preset props
 *
 * @example
 * ```tsx
 * const customPreset = createCustomPreset({
 *   inactiveColor: '#666',
 *   fontSize: '16px',
 * });
 *
 * <AnimatedCharacterText
 *   text={text}
 *   {...customPreset}
 * />
 * ```
 */
export function createCustomPreset(
  config: CharacterStyleConfig
): ReturnType<typeof getAnimatedTextPreset> {
  return getAnimatedTextPreset('custom', config);
}

/**
 * Type-safe preset getter with autocomplete support
 */
export const presets = {
  category: () => getAnimatedTextPreset('category'),
  work: () => getAnimatedTextPreset('work'),
  captionLink: () => getAnimatedTextPreset('caption-link'),
  custom: (config: CharacterStyleConfig) => createCustomPreset(config),
} as const;
