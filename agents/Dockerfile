FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /workspace
COPY requirements.txt .

RUN apt-get update && \
apt-get install -y --no-install-recommends \
build-essential \
libx11-dev \
pkg-config \
libcairo2-dev \
xdg-utils \
libpango1.0-dev && \
rm -rf /var/lib/apt/lists/*

RUN cd /opt && \
uv venv && \
uv pip install --no-cache-dir -r /workspace/requirements.txt && \
echo "source /opt/.venv/bin/activate" >> /etc/bash.bashrc
