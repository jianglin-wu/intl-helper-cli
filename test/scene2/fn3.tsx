import React from 'react';
import { useIntl, FormattedMessage, Link } from 'umi';

export default App = () => {
  const showMsg = () => {
    console.log('你好');
  };
  return (
    <div
      onClick={() => {
        showMsg();
        console.log('123');
      }}
    >
      测试内容
    </div>
  );
};
