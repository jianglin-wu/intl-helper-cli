import md5 from 'md5';
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
}

export default class Translate {
  private appId: string;

  private appKey: string;

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;
  }

  fetch(query: string, from = 'zh', to = 'en') {
    const { appId: appid, appKey: key } = this;
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
}
