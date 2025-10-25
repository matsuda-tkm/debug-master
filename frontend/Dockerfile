# syntax=docker/dockerfile:1

# ---------------
# -- VARIABLES --
# ---------------

ARG NODE_VERSION=23

# -------------------
# -- BASE IMAGE -----
# -------------------

FROM node:${NODE_VERSION}-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .
