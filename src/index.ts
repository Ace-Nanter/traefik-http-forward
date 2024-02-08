import express, { Application, Request, Response } from 'express';
import TraefikResponse from './models/traefik-response.model';

const app: Application = express();
const port = process.env.PORT || 8000;

app.get('/', (req: Request, res: Response) => {
  const PORT = process.env.PORT || 3000;
  const SERVICE_NAME = process.env.SERVICE_NAME || 'external-vps';

  const response: TraefikResponse = {
    http: {
      routers: {
        grafana: {
          entryPoints: ['https'],
          rule: 'Host(`grafana.pandore.ovh`)',
          service: SERVICE_NAME,
        },
        uptime: {
          entryPoints: ['https'],
          rule: 'Host(`uptime.pandore.ovh`)',
          service: SERVICE_NAME,
        },
      },
      services: {
        [SERVICE_NAME]: {
          loadBalancer: {
            passHostHeader: true,
            servers: [
              {
                url: 'http://10.6.0.2',
              },
            ],
          },
        },
      },
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.send(response);
  // res.send('Welcome to Express & TypeScript Server');
});

app.listen(port, () => {
  console.log(`Server launched on port ${port}`);
});
