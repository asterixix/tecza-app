import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Run Prettier as an ESLint rule and disable stylistic ESLint rules that conflict with Prettier
  eslintPluginPrettierRecommended,
]

export default eslintConfig
