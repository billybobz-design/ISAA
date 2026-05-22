// Keep font selection fully local/offline.
//
// Importing from `next/font/google` makes `next build` contact
// fonts.googleapis.com. In restricted environments this fails with:
// "Failed to fetch `Inter`/`Merriweather` from Google Fonts".
//
// The layout only needs a `variable` class name from these exports. The
// concrete font stacks are defined as CSS variables in `globals.css`.
export const inter = {
  variable: "",
}

export const merriweather = {
  variable: "",
}
