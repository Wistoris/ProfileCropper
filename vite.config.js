import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` is only applied for the production build so the app works when served
// from a GitHub Pages project sub-path (https://<user>.github.io/<repo>/).
// During `vite dev` / `vite preview` the base stays "/" so local URLs are clean.
//
// The Pages sub-path must match the *repository name*. In CI, GITHUB_REPOSITORY
// is "owner/repo", so we derive the repo name from it automatically — this keeps
// the base correct even if the repo is renamed. Override explicitly with the
// BASE_PATH env var (e.g. "/" for a user/org site or a custom domain).
function resolveBase() {
  if (process.env.BASE_PATH) return process.env.BASE_PATH
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  return repo ? `/${repo}/` : '/'
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? resolveBase() : '/',
}))
