import React from 'react';
import { formatMessage } from 'umi';
import style from './index.less';
import * as R from 'ramda';

const Appnn = () => {
  return (
    <FormattedMessage
      id="app.preview.down.block"
      defaultMessage="下载此页面到本地项目"
    />
  );
};

const Appaa = () => {
  // hello
  return formatMessage({
    id: 'sdf.sdaf',
    defaultMessage: '测试123',
  });
};

const text: any = {};
text.text1 = `已停止服务${moment(updatedAt).toNow(true)}`;
text.text2 = `已服务${moment(updatedAt).toNow(true)}`;
text.text3 = `已服务1${moment(updatedAt).toNow(true)}已服务2${moment(
  updatedAt,
).toNow(true)}已服务3${moment(updatedAt).toNow(true)}已服务4${moment(
  updatedAt,
).toNow(true)}已服务5${moment(updatedAt).toNow(true)}已服务6${moment(
  updatedAt,
).toNow(true)}`;

export default () => {
  const a = (
    <EditLabel
      title="客户端"
      value={value}
      tip={`客户端名称: ${(item.agent || {}).name || '--'}`}
      maxShowLength={12}
      maxLength={18}
      onOk={(n) => updateBeName(n, item._id, item)}
    />
  );

  const b = (
    <Tooltip title={`网卡: ${item.parentInterfaceIp || '--'} `}>
      <span
        className={style.mode_tag}
        style={{
          color: 'rgb(114, 46, 209)',
          backgroundColor: 'rgb(249, 240, 255',
        }}
      >
        萨芬末世
      </span>
    </Tooltip>
  );

  // 生成的不是 jsx
  const c = (
    <div className={style.body}>
      <img src={beehiveEmpty} alt="" className={style.img} />
      <div>萨芬末世</div>
      <Link to="/create">
        <Button type="primary" className={style.btn}>
          萨芬末世
        </Button>
      </Link>
    </div>
  );

  if (result.include) {
    throw new Error(`${item}:${result.port}已，请使用空闲的和端口！`);
  }
  return c;
};
