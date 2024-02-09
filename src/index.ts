import express, { Application, Request, Response as ExpressResponse } from 'express';
import TraefikResponse from './models/traefik-response.model';
import TraefikRouter, { TraefikAPIRouter } from './models/traefik-router.models';

// Environment variables
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'remote-traefik';

if (!process.env.API_ADDRESS || !process.env.DESTINATION_ADDRESS || !process.env.ENTRYPOINTS_MAPPING) {
  throw new Error('Incorrect configuration');
}

const API_ADDRESS = process.env.API_ADDRESS;
const DESTINATION_ADDRESS = process.env.DESTINATION_ADDRESS;

const ENTRYPOINTS_MAPPING: { [key: string]: string } = {};

process.env.ENTRYPOINTS_MAPPING.split(';').forEach((pair) => {
  let [key, value] = pair.split('|');
  ENTRYPOINTS_MAPPING[key] = value;
});

// Starts express server
export const app: Application = express();

app.get('/', async (req: Request, res: ExpressResponse) => {
  const routerMap = await fetch(`${API_ADDRESS}/http/routers`)
    .then(fetchStatus)
    .then((response) => response.json())
    .then((json) => reduceRouters((json as TraefikAPIRouter[]).filter(filterRouters)));

  // Create response to return
  const response: TraefikResponse = {
    http: {
      routers: routerMap,
      services: {
        [SERVICE_NAME]: {
          loadBalancer: {
            passHostHeader: true,
            servers: [
              {
                url: DESTINATION_ADDRESS,
              },
            ],
          },
        },
      },
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.send(response);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server launched on port ${PORT}`);
});

/**
 * Resolves or rejects a promise based on response's status code
 */
function fetchStatus(response: Response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(new Error(response.statusText));
  }
}

/**
 * Filters routers in order to keep only the ones we want to forward
 *
 * @param router Router to filter
 * @returns True if it should be kept, otherwise false
 */
function filterRouters(router: TraefikAPIRouter): boolean {
  // TODO : update me
  return router.status === 'enabled' && router.entryPoints.includes('local');
}

/**
 * Reduces an array of Traefik Routers coming from Traefik API to a map to return
 * @param arr Array of Traefik API routers
 * @returns A Map ready to be consumed by Traefik HTTP Provider
 */
function reduceRouters(arr: TraefikAPIRouter[]) {
  return arr.reduce(
    (map, router) => {
      map[clearRouterName(router.name)] = getTraefikRouterFromApiRouter(router);
      return map;
    },
    {} as { [key: string]: TraefikRouter },
  );
}

/**
 * Transforms a router from Traefik API to a Router which will be consumed by Traefik HTTP provider
 *
 * @param apiRouter Traefik API router to transform
 * @returns A Router ready to be consumed by Traefik HTTP Provider
 */
function getTraefikRouterFromApiRouter(apiRouter: TraefikAPIRouter): TraefikRouter {
  return {
    entryPoints: mapEntrypoints(apiRouter.entryPoints), // TODO : change me
    rule: apiRouter.rule,
    service: SERVICE_NAME,
  };
}

/**
 * Associate entrypoints from remote instance to entrypoints from main instance
 */
function mapEntrypoints(entrypoints: string[]): string[] {
  return entrypoints.map((entrypoint: string) => ENTRYPOINTS_MAPPING[entrypoint]);
}

/**
 * Removes the part '@docker' from the router name
 */
function clearRouterName(rule: string) {
  return rule.split('@')[0];
}
