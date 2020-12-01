FROM python:3.8-slim

ENV PYTHONUNBUFFERED 1

RUN pip install pipenv

COPY Pipfile* ./

RUN pipenv install --system --deploy

COPY app.py app.py
EXPOSE 80

CMD ["python", "app.py"]
