<span align="center">

# Traefik HTTP Forward

The goal of this project is to create a bridge between two Traefik instances on remote servers. This lightweight Node.js
web service provides an endpoint for the Traefik HTTP Provider, which assists in configuring appropriate routers and
services. The process is straightforward: when a request arrives, the web service queries the other Traefik internal
HTTP API and returns this information in a format that the main Traefik instance can understand via its HTTP provider.

This approach is particularly useful when you have only two servers running standalone Docker instances, as setting up
Docker Swarm typically requires at least three servers to function correctly.

</span>
<span align="center">

[![GitHub latest commit](https://badgen.net/github/last-commit/Ace-Nanter/traefik-http-forward/main)](https://GitHub.com/Ace-Nanter/traefik-http-forward/commits/main/)
[![version](https://badgen.net/github/tag/Ace-Nanter/traefik-http-forward)](https://github.com/Ace-Nanter/traefik-http-forward/tags)
[![license](https://badgen.net/github/license/Ace-Nanter/traefik-http-forward)](https://github.com/Ace-Nanter/traefik-http-forward/blob/master/LICENSE.md)

<br />

</span>

![Illustration of a Scenario Where the Project’s Web Service Could Be Utilized](https://github.com/Ace-Nanter/traefik-http-forward/blob/main/docs/schema.drawio.svg)

## How to use

- Build Docker image
- Run Docker image with the following environment variables set:
  - `API_ADDRESS`: (Mandatory) The URL of the remote Traefik instance's API.
  - `DESTINATION_ADDRESS`: (Mandatory) The URL provided for the service which will point to the remote Traefik instance.
  - `ENTRYPOINTS_MAPPING`: (Mandatory) A list of entrypoints mapping. The format is
    `[REMOTE_ENTRYPOINT_1]|[MAIN_ENTRYPOINT_1];[REMOTE_ENTRYPOINT_2]|[MAIN_ENTRYPOINT_2]`.
  - `PORT`: (Optional, default value: `3000`) The port on which the app should be served.
  - `SERVICE_NAME`: (Optional, default: `remote-traefik`) The Name of the service your main Traefik instance will assign
    to your remote Traefik instance.

## Configuration example

Let's say you have two servers, `server A` and `server B`, each with a Traefik instance.

`Server A` serves 3 services: `service 1`, `service 2`, and `service 3`.<br />
`Server B` serves 2 services: `service 4` and `service 5`.

Given that you only have two servers and one domain name, you can't use Kubernetes nor Docker Swarm, so you want Traefik instance from `server A` to redirect requests for 
`service 4` and `service 5` to `server B`. To achieve this, you have established a VPN connection between `server A` and `server B`.

In this kind of configuration, you can install **Traefik HTTP Forward** app to retrieve services on `server B` through `server B`'s Traefik API. This allows `server A`'s Traefik instance to create appropriate routers.

Here is what a docker-compose file on `server A` would look like:

```yaml
version: '3.7'
services:
  traefik-A:
    image: traefik:latest

    ports:
      - "80:80"
      - "443:443"

    networks:
      - reverse_proxy

    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/etc/traefik/traefik.yml

  service-1:
    image: [service-1_IMAGE]

    networks:
      - reverse_proxy

    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.service-1.rule=Host(`service-1.example.com`)'
      - 'traefik.http.routers.service-1.entrypoints=https'

  service-2:
    image: [service-2_IMAGE]

    networks:
      - reverse_proxy

    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.service-2.rule=Host(`service-2.example.com`)'
      - 'traefik.http.routers.service-2.entrypoints=https'

  service-3:
    image: [service-3_IMAGE]

    networks:
      - reverse_proxy

    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.service-3.rule=Host(`service-3.example.com`)'
      - 'traefik.http.routers.service-3.entrypoints=https'

networks:
  reverse_proxy:
    external: true
```

The `traefik.yml` file on `server A` would look like:
```yml
entryPoints:
  http:
    address: :80

  https:
    address: :443
    http:
      tls:
        certResolver: le

providers:
  docker:
    watch: true
    exposedByDefault: false
    network: reverse_proxy
    swarmMode: false

  http:
    endpoint: "http://[SERVER_B_IP]:[TRAEFIK_HTTP_FORWARD_PORT]/"

certificatesResolvers:
  le:
    acme:
      email: youremail@example.com
      storage: /acme.json
      tlsChallenge: true

# Traefik won’t check SSL, which is useful since the redirections use HTTP and not HTTPS.
serversTransport:
  insecureSkipVerify: true
```

Here is what a docker-compose file on `server B` would look like:
```yaml
version: '3.7'
services:
  traefik-B:
    image: traefik:latest
    restart: always

    ports:
      - "80:80"

    networks:
      - reverse_proxy

    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/etc/traefik/traefik.yml

  traefik-http-forward:
    image: traefik-http-forward:latest
    restart: always

    ports:
      - "8080:8080"
    
    environment:
      API_ADDRESS: http://traefik-B:8080/api
      DESTINATION_ADDRESS: http://[IP_SERVER_B]
      # Mapping local entrypoint to HTTPS entrypoint on server A
      ENTRYPOINTS_MAPPING: 'local|https'    
      PORT: 8080
      # Every routes declared with Traefik HTTP forward will be routed to a service named "server-B"
      SERVICE_NAME: server-B                

    networks:
      - reverse_proxy

  service-4:
    image: [service-4_IMAGE]

    networks:
      - reverse_proxy

    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.service-4.rule=Host(`service-4.example.com`)'
      - 'traefik.http.routers.service-4.entrypoints=local'

  service-5:
    image: [service-5_IMAGE]

    networks:
      - reverse_proxy

    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.service-5.rule=Host(`service-2.example.com`)'
      - 'traefik.http.routers.service-5.entrypoints=local'

networks:
  reverse_proxy:
    external: true

```

On `server B`, the config file for Traefik would be:
```yaml
entryPoints:
  local:
    address: :80

# Opening API is necessary for Traefik HTTP Forward to work
api:
  insecure: true

providers:
  docker:
    watch: true
    exposedByDefault: false
    network: reverse_proxy
    swarmMode: false
```

## Docker image

Feel free to ask through an issue if you need me to build images to DockerHub.

## Donate

<span align="center">

<br />

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DX7SKZKNE3E5U)

</span>
