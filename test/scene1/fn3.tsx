import React from 'react';
import { Link } from 'umi';

export default function App() {
  const name = '开发者';
  return <Link to="/home">你好，{name}</Link>;
}
