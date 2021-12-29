import React from 'react';
import { Link } from 'umi';

export default function App() {
  const { formatMessage } = useIntl();
  const name = '打工人';
  return <Link to="/home">你好，{name}</Link>;
}
