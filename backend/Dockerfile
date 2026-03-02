
FROM python:3.13-slim-bookworm

WORKDIR /backend

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "app.py"]
