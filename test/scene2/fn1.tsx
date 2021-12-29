import React from 'react';
import { useIntl, FormattedMessage, Link } from 'umi';

export default App = () => {
  const { formatMessage } = useIntl();
  const name = '开发者';
  return (
    <div>
      <Link to="/home">你好，{name}</Link>
      <FormattedMessage id="test.123" />
      <p>
        党的十八大提出，倡导富强、民主、文明、和谐，倡导自由、平等、公正、法治，倡导爱国、敬业、诚信、友善，积极培育和践行社会主义核心价值观。富强、民主、文明、和谐是国家层面的价值目标，自由、平等、公正、法治是社会层面的价值取向，爱国、敬业、诚信、友善是公民个人层面的价值准则，这24个字是社会主义核心价值观的基本内容。
      </p>
    </div>
  );
};
