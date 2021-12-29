import React from 'react';
import { useIntl, FormattedMessage, Link } from 'umi';

export default App = () => {
  const { formatMessage } = useIntl();
  const name = '打工人';
  return (
    <div>
      <Link to="/home">你好，{name}</Link>
      <FormattedMessage id="test.123" />
    </div>
  );
};
