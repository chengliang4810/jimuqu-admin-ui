export interface HttpResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}
