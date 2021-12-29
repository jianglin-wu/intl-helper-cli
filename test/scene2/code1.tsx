import React from 'react';

export default function FileDown() {
  const columns: any = [
    {
      title: 'md5值',
      dataIndex: 'md5',
      align: 'center',
      key: 'md5',
      render: (md: string) => (
        <Tooltip title={md}>
          {md.length > 8 ? `${md.slice(0, 8)}...` : md}
        </Tooltip>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      align: 'center',
      key: 'size',
      render: (size: any) => sizeConversion(size),
    },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      align: 'center',
      key: 'filePath',
      render: (filePath: any) => {
        return <span>{filePath ? filePath : '--'}</span>;
      },
    },
    {
      title: '上传时间',
      dataIndex: 'timestamp',
      align: 'center',
      key: 'timestamp',
      render: (timestamp: any) => (
        <Tooltip title={moment(timestamp).format('YYYY/MM/DD HH:mm')}>
          {moment(timestamp).format('MM/DD HH:mm:ss')}
        </Tooltip>
      ),
    },
    {
      title: '文件操作类型',
      dataIndex: 'cmd',
      align: 'center',
      key: 'cmd',
      render: (cmd: any) => fileOperateType(cmd),
    },
    {
      title: '操作',
      key: '_id',
      dataIndex: '_id',
      align: 'center',
      render: (id: string) => {
        if (user.can('legacyFile.download'))
          return (
            <Popconfirm
              title="文件可能存在风险，是否确认下载？"
              onConfirm={() => downloadMore([id])}
            >
              <Icon
                type="download"
                style={{
                  color: '#1890ff',
                  fontSize: '25px',
                }}
              />
            </Popconfirm>
          );
        return null;
      },
    },
  ];

  return (
    <Modal
      title={
        <>
          文件下载
          <Tooltip title="保留3个月内上传的文件">
            <Icon
              type="question-circle"
              style={{ marginLeft: 5, color: '#1890ff', fontSize: 14 }}
            />
          </Tooltip>
        </>
      }
      className={Styles.modal}
      visible={fileDwonModalVisible}
      width="60%"
      onCancel={() => setFileDwonModalVisible(false)}
      onOk={() => setFileDwonModalVisible(false)}
    >
      {user.can('legacyFile.download') && (
        <div className={Styles.head}>
          <Popconfirm
            title="文件可能存在风险，是否确认下载？"
            disabled={rowKeys.length === 0}
            onConfirm={(e) => downloadMore()}
          >
            <Button type="primary" disabled={rowKeys.length === 0}>
              下载
            </Button>
          </Popconfirm>
        </div>
      )}
      <Table
        className={Styles.legacy}
        rowKey="_id"
        dataSource={get(legacyFiles, 'list', [])}
        columns={columns}
        rowSelection={{ fixed: true, onChange: fileRow }}
        pagination={false}
        scroll={legacyFiles && legacyFiles.length > 5 ? { y: 300 } : {}}
      ></Table>
    </Modal>
  );
}
