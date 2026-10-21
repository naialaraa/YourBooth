# Frames

Frames are simple **colour presets** — empty borders with no captions. They live in
`src/utils/constants.js` as the `FRAMES` array:

```js
export const FRAMES = [
  { id: 'white',  name: 'White',  bg: '#FFFFFF', accent: '#111111' },
  { id: 'pink',   name: 'Pink',   bg: '#FF9EC4', accent: '#B23A6E' },
  { id: 'black',  name: 'Black',  bg: '#111111', accent: '#FFFFFF' },
  { id: 'purple', name: 'Purple', bg: '#B7A0FF', accent: '#4B3692' },
  { id: 'blue',   name: 'Blue',   bg: '#8CCBFF', accent: '#235C8C' },
]
```

## Add / change a colour
Edit the array above (and mirror the value in the `frame` lookup inside
`src/components/DoodleEditor/DoodleEditor.jsx`). There's also a **No Frame** option
in the editor that exports just the bare photos on a transparent background.

> This folder is here for any source-controlled frame design files you want to keep.
