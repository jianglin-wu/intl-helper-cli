/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
declare module 'jsonp-client' {
  function jsonp<TResult>(
    url: string,
    callback?: (err: Error | null, result: TResult) => void,
  ): void;
  export default jsonp;
}
