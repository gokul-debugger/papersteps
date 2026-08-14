import '@testing-library/jest-dom/vitest'

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:papersteps-test'
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => undefined
}
