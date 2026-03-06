import preset from '@sanity/prettier-config'

export default {
  ...preset,
  plugins: [...preset.plugins],
  experimentalTernaries: true,
}
