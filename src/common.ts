import { parse } from '@babel/parser';

export function codeParse(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    ranges: true,
  });
}
