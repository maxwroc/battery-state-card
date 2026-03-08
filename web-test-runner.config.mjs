import { esbuildPlugin } from '@web/dev-server-esbuild';

const config = {
  files: ['test/integration/**/*.test.ts'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true })],
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
  testRunnerHtml: testFramework => `
    <!DOCTYPE html>
    <html>
      <body>
        <script type="module" src="/dist/battery-state-card.js"></script>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['test/**/*'],
    reportDir: 'coverage/integration',
  },
};

export default config;
