import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Chuyển các lỗi thành cảnh báo cho các quy tắc cụ thể
      '@typescript-eslint/no-unused-vars': 'warn',         // Chuyển lỗi không sử dụng biến thành cảnh báo
      'react/no-unescaped-entities': 'warn',              // Chuyển lỗi không thoát kí tự thành cảnh báo
      '@typescript-eslint/no-explicit-any': 'warn',       // Chuyển lỗi sử dụng `any` thành cảnh báo
    },
  },
];

export default eslintConfig;
