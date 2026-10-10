import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["next-env.d.ts", ".next/**", "node_modules/**", "public/uploads/**"]
  },
  ...nextVitals
];

export default eslintConfig;
