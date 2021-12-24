module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        debug: false,
        targets: {
          esmodules: true,
          node: true,
        },
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
};
