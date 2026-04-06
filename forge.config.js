const { VitePlugin } = require('@electron-forge/plugin-vite');

module.exports = {
  packagerConfig: {
    name: 'Check Yourself',
    icon: './assets/icon',
  },
  makers: [
    { name: '@electron-forge/maker-zip' },
    { name: '@electron-forge/maker-dmg' },
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/main.js', config: 'vite.main.config.mjs' },
        { entry: 'src/main/preload.js', config: 'vite.preload.config.mjs' },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
  ],
};
