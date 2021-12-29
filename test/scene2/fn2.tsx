import React from 'react';
import { useIntl, FormattedMessage, Link } from 'umi';

const Header = () => {
  const { formatMessage } = useIntl();
  const name = '打工人';
  return (
    <div>
      <Link to="/home">你好，{name}</Link>
      <FormattedMessage id="test.123" />
      {formatMessage({
        id: 'agent.e2dd96eb6d181784bd282e98b2e247637',
        defaultMessage: '国际化小助手',
      })}
    </div>
  );
};

export default App = () => {
  return (
    <div>
      <Header />
    </div>
  );
};
