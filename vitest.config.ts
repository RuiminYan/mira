import { defineConfig } from 'vitest/config';

// 仅作 CI 守卫(约定/不变量测试),不测组件渲染,故 environment 用 node、不挂 React 插件。
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
