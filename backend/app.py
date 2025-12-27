from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/search", methods=["GET"])
def search():
    NUMBER_OF_CARPARK = 20
    carpark_number = request.args.get('carpark_number', '')
    
    if not carpark_number:
        return {'carparks': []}
    
    try:
        response = requests.get("https://api.data.gov.sg/v1/transport/carpark-availability")
        data = response.json()
        all_carparks = data["items"][0]["carpark_data"]
        filtered = [
            {
                "carpark_num" : cp["carpark_number"],
                "total_lots" : cp["carpark_info"][0]["total_lots"],
                "lots_available" : cp["carpark_info"][0]["lots_available"]
            }
            for cp in all_carparks
            if carpark_number.lower() in cp["carpark_number"].lower()
                
        ]
    except Exception as e:
        print(e)
        return {'Error': "Failed to fetch data"}, 500
    return { "carparks": filtered[:NUMBER_OF_CARPARK]}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)