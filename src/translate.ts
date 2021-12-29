import md5 from 'md5';
import * as R from 'ramda';
import jsonpClient from 'jsonp-client';
import { stringify } from 'qs';
import util from 'util';

const JSONP = util.promisify(jsonpClient);

interface BaiduReq {
  q: string;
  appid: string;
  salt: string;
  from: string;
  to: string;
  sign: string;
}

interface TransResult {
  src: string;
  dst: string;
}
interface BaiduRes {
  from: string;
  to: string;
  trans_result: TransResult[];
  error_code?: string;
  error_msg?: string;
}

async function serviceTranslate(
  appid: string,
  key: string,
  from: string,
  to: string,
  query: string,
) {
  const salt = new Date().getTime();
  const str1 = appid + query + salt + key;
  const sign = md5(str1);
  const params: BaiduReq = {
    q: query,
    appid,
    salt: salt.toString(),
    from,
    to,
    sign,
  };
  const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?${stringify(
    params,
  )}`;
  return JSONP<BaiduRes>(url);
}

export default class Translate {
  private appId: string;

  private appKey: string;

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;
  }

  async fetch(query: string[], from = 'zh', to = 'en') {
    const { appId: appid, appKey: key } = this;
    const chunks = R.splitEvery(100, query);
    let result: TransResult[] = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < chunks.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const resData = await serviceTranslate(
        appid,
        key,
        from,
        to,
        chunks[i].join('\n'),
      );
      if (resData.error_code) {
        throw Error(resData.error_msg || '翻译接口响应错误');
      }
      const { trans_result: transResult } = resData;
      result = result.concat(transResult);
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 1000)); // 降低调用 api 频率
    }
    return result;
  }
}
