IMAGE_NAME := manim-agent
CONTAINER_NAME := manim-agent

build:
	docker build -t $(IMAGE_NAME) .

run:
	docker run -it --rm -v ${PWD}:/workspace -p 8501:8501 --name $(CONTAINER_NAME) $(IMAGE_NAME) bash

.PHONY: build run
