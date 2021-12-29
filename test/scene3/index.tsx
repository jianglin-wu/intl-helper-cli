import react from 'react';

export default () => {
  const validateError = {};
  if (!isDomain(v, rootDomain)) {
    validateError.prefix = <>请输入正确的域名(可包含字母数字,&quot;-&quot;)</>;
  }
  return <div>123</div>;
};
