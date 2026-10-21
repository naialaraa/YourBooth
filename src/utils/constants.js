// Central place for the playful copy + tokens used across the app.

export const PALETTE = {
  ink: '#111111',
  paper: '#FFFFFF',
  cream: '#FFF8EE',
  pink: '#FFC9DE',
  pinkBold: '#FF8FB8',
  purple: '#C9B6FF',
  purpleBold: '#A586FF',
  sky: '#A8D8FF',
  skyBold: '#6EC1FF',
  aqua: '#BDEDE6',
}

// Doodle / pen colours
export const DOODLE_COLORS = [
  { name: 'Black', value: '#111111' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Pink', value: '#FF8FB8' },
  { name: 'Purple', value: '#A586FF' },
  { name: 'Blue', value: '#6EC1FF' },
]

// Sticker pack
export const STICKERS = ['⭐', '🌟', '🎀', '🌷', '🩷', '🦋', '🐟', '🐠', '🐡', '🍣', '🤿', '🕶️', '✨', '🌀', '🪸']

// Optional custom Polaroid frame PNGs. Drop your own transparent-window frames at
// public/assets/polaroid/portrait.png and public/assets/polaroid/landscape.png.
// `window` is where the photo sits inside the PNG, as fractions (0–1) of the PNG.
// Tweak these if your frame's opening sits differently.
export const POLAROID_FRAMES = {
  portrait: { window: { x: 0.081, y: 0.054, w: 0.839, h: 0.768 } },
  landscape: { window: { x: 0.053, y: 0.079, w: 0.779, h: 0.822 } },
}

// Photo-count options for layout selection
export const LAYOUT_OPTIONS = [1, 2, 3, 4, 6]

// Frame colour presets — empty frames, no captions
export const FRAMES = [
  { id: 'white', name: 'White', bg: '#FFFFFF', accent: '#111111' },
  { id: 'pink', name: 'Pink', bg: '#FF9EC4', accent: '#B23A6E' },
  { id: 'black', name: 'Black', bg: '#111111', accent: '#FFFFFF' },
  { id: 'purple', name: 'Purple', bg: '#B7A0FF', accent: '#4B3692' },
  { id: 'blue', name: 'Blue', bg: '#8CCBFF', accent: '#235C8C' },
]

// Booth catalogue — drives the landing page + routing
export const BOOTHS = [
  {
    id: 'classic',
    name: 'Classic Booth',
    blurb: 'Pick a layout, snap your shots, then doodle, type & sticker away.',
    accent: PALETTE.pink,
    accentBold: PALETTE.pinkBold,
    emoji: '📸',
  },
  {
    id: 'vintage',
    name: 'Vintage Booth',
    blurb: 'Four auto-timed portraits. Choose colour or true black & white.',
    accent: '#E9C9A8',
    accentBold: '#B07B4F',
    emoji: '🎞️',
  },
  {
    id: 'aquarium',
    name: 'Aquarium Booth',
    blurb: 'A whole school of fish swims by — and into your photo.',
    accent: PALETTE.sky,
    accentBold: PALETTE.skyBold,
    emoji: '🐠',
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    blurb: 'One instant shot, portrait or landscape, watched as it develops.',
    accent: PALETTE.cream,
    accentBold: '#E7A977',
    emoji: '🖼️',
  },
]

export const TAGLINE = 'Tiny memories, forever yours.'
