import TraefikRouter from "./traefik-router.models";
import TraefikService from "./traefik-service.model";

type TraefikResponse = {
  http: {
    routers: {
      [key: string]: TraefikRouter;
    }
    services: {
      [key: string]: TraefikService;
    };
  }
}

export default TraefikResponse;