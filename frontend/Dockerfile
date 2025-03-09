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

WORKDIR /${APP_DIR}

COPY package.json package-lock.json ./

RUN npm ci

COPY . .
