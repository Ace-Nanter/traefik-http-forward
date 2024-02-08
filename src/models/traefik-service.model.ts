type Server = {
  url: string;
};

type LoadBalancer = {
  passHostHeader: boolean;
  servers: Server[];
};

type TraefikService = {
  loadBalancer: LoadBalancer;
};

export default TraefikService;
