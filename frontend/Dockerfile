# syntax=docker/dockerfile:1

# ---------------
# -- VARIABLES --
# ---------------

ARG NODE_VERSION=23
ARG APP_DIR=app

# -------------------
# -- BASE IMAGE -----
# -------------------

FROM node:${NODE_VERSION}-bookworm-slim

RUN useradd -m -s /bin/bash front-developer

RUN mkdir -p /${APP_DIR} && chown front-developer:front-developer /${APP_DIR}

WORKDIR /${APP_DIR}

USER front-developer

COPY package.json package-lock.json ./

RUN npm ci

