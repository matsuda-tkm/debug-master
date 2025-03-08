# syntax=docker/dockerfile:1

# ---------------
# -- VARIABLES --
# ---------------

ARG PYTHON_VERSION=3.13
ARG APP_DIR=bug-gym/backend


# -------------------
# -- BASE IMAGE  ----
# -------------------

FROM python:${PYTHON_VERSION}-slim-bookworm

RUN useradd -m -s /bin/bash back-developer

RUN mkdir -p /${APP_DIR} && chown back-developer:back-developer  /${APP_DIR}

USER back-developer

WORKDIR /${APP_DIR}

COPY requirements.txt ./${APP_DIR}

RUN pip install --no-cache-dir -r requirements.txt

