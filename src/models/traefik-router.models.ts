type RouterStatus = 'enabled' | 'disabled';

export type TraefikRouter = {
  entryPoints: string[];
  rule: string;
  service: string;
};

export type TraefikAPIRouter = TraefikRouter & {
  status: RouterStatus;
  name: string;
};

export default TraefikRouter;
