from flask import Flask, render_template, request, jsonify
import numpy as np
import tensorflow as tf
import pickle
import pandas as pd

app = Flask(__name__)


model = tf.keras.models.load_model('model.h5')

with open('label_encoder_gender.pkl', 'rb') as file:
    label_encoder_gender = pickle.load(file)

with open('onehot_encoder_geo.pkl', 'rb') as file:
    onehot_encoder_geo = pickle.load(file)

with open('scaler.pkl', 'rb') as file:
    scaler = pickle.load(file)


FEATURE_NAMES = [
    'CreditScore', 'Gender', 'Age', 'Tenure', 'Balance', 
    'NumOfProducts', 'HasCrCard', 'IsActiveMember', 'EstimatedSalary', 
    'Geography_France', 'Geography_Germany', 'Geography_Spain'
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  

    geography = data['geography']
    gender = data['gender']
    age = float(data['age'])
    balance = float(data['balance'])
    credit_score = float(data['credit_score'])
    estimated_salary = float(data['estimated_salary'])
    tenure = int(data['tenure'])
    num_of_products = int(data['num_of_products'])
    has_cr_card = int(data['has_cr_card'])
    is_active_member = int(data['is_active_member'])

 
    geo_encoded = onehot_encoder_geo.transform([[geography]]).toarray()
    geo_encoded_df = pd.DataFrame(geo_encoded, columns=onehot_encoder_geo.get_feature_names_out(['Geography']))

    input_data = pd.DataFrame({
        'CreditScore': [credit_score],
        'Gender': [label_encoder_gender.transform([gender])[0]],
        'Age': [age],
        'Tenure': [tenure],
        'Balance': [balance],
        'NumOfProducts': [num_of_products],
        'HasCrCard': [has_cr_card],
        'IsActiveMember': [is_active_member],
        'EstimatedSalary': [estimated_salary]
    })

    input_data = pd.concat([input_data.reset_index(drop=True), geo_encoded_df], axis=1)
    
  
    input_data = input_data[FEATURE_NAMES]
    
    input_scaled = scaler.transform(input_data)

    prediction_prob = model.predict(input_scaled, verbose=0)[0][0]
    prediction = "Churn" if prediction_prob > 0.5 else "No Churn"

   
    risk_factors = {}
    
    for i, col_name in enumerate(FEATURE_NAMES):
        temp_input = input_scaled.copy()
        temp_input[0, i] = 0  
        
        new_prob = model.predict(temp_input, verbose=0)[0][0]
        contribution = prediction_prob - new_prob
        

        risk_factors[col_name] = max(0, float(contribution))

  
    geo_risk = (risk_factors.pop('Geography_France') + 
                risk_factors.pop('Geography_Germany') + 
                risk_factors.pop('Geography_Spain'))
    risk_factors['Geography'] = geo_risk

    return jsonify({
        'result': prediction, 
        'probability': float(prediction_prob),
        'risk_drivers': risk_factors 
    })

if __name__ == '__main__':
    app.run(debug=True)