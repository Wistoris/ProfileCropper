import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` is only applied for the production build so the app works when served
// from a GitHub Pages project sub-path (https://<user>.github.io/profile-pic-maker/).
// During `vite dev` / `vite preview` the base stays "/" so local URLs are clean.
// Override with the BASE_PATH env var (e.g. "/" for a user/org or custom-domain site).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base:
    command === 'build'
      ? process.env.BASE_PATH || '/profile-pic-maker/'
      : '/',
}))
