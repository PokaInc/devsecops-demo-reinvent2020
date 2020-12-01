from flask import Flask
from waitress import serve

app = Flask(__name__)

@app.route('/')
def hello_world():
    return '<h1>Bonjour Re:Invent 2020!</h1>'


if __name__ == "__main__":
    serve(app, listen='*:80')

