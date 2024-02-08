<span align="center">

# Traefik HTTP Forward

The goal of this project is to create a bridge between two Traefik instances on remote servers. This lightweight Node.js
web service provides an endpoint for the Traefik HTTP Provider, which assists in configuring appropriate routers and
services. The process is straightforward: when a request arrives, the web service queries the other Traefik internal
HTTP API and returns this information in a format that the main Traefik instance can understand via its HTTP provider.

This approach is particularly useful when you have only two servers running standalone Docker instances,
as setting up Docker Swarm typically requires at least three servers to function correctly.

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
  * `API_ADDRESS`: (Mandatory) The URL of the remote Traefik instance's API.
  * `DESTINATION_ADDRESS`: (Mandatory) The URL provided for the service which will point to the remote Traefik instance.
  * `ENTRYPOINTS_MAPPING`: (Mandatory) A list of entrypoints mapping. The format is `[REMOTE_TRAEFIK_ENTRYPOINT]|[MAIN_TRAEFIK_ENTRYPOINT]`.
  * `PORT`: (Optional, default value: `3000`) The port on which the app should be served.
  * `SERVICE_NAME`: (Optional, default: `remote-traefik`) The Name of the service your main Traefik instance will assign to your remote Traefik instance.
  
## Configuration example

Config example for main instance

- traefik.yml with entrypoints and providers (Docker + http)
- Docker-compose.yml

Config example for "remote" instance

- traefik.yml with entrypoints and providers (Docker)
- Docker-compose.yml

## Docker image

Feel free to ask through an issue if you need me to build images to DockerHub.

## Donate
<span align="center">

<br />

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DX7SKZKNE3E5U)

</span>