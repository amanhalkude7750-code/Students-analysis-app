from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd

# Load the trained model
try:
    model = joblib.load('risk_model.pkl')
    print("✅ Best Pipeline Model loaded successfully from 'risk_model.pkl'.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

app = FastAPI(title="ACCESS.AI Predictive Analytics API",
              description="Real AI Prediction Endpoints for High Speed Hackathon Demo")

class StudentData(BaseModel):
    study_time: int
    quiz_accuracy: float
    assignment_score: int
    attendance_rate: float
    video_completion: float
    practice_attempts: int
    session_consistency: int
    pause_frequency: int
    rewind_frequency: int
    engagement_score: float
    term_marks: int
    total_attendance_days: int
    extracurricular_hours: int
    discipline_incidents: int

@app.post("/predict")
def predict_risk(data: StudentData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model missing. Run `python train_model.py` to regenerate best model.")
        
    # Input mapping directly to Pipeline Features expected natively by pd.DataFrame models generally
    features = pd.DataFrame([[
        data.study_time,
        data.quiz_accuracy,
        data.assignment_score,
        data.attendance_rate,
        data.video_completion,
        data.practice_attempts,
        data.session_consistency,
        data.pause_frequency,
        data.rewind_frequency,
        data.engagement_score,
        data.term_marks,
        data.total_attendance_days,
        data.extracurricular_hours,
        data.discipline_incidents
    ]], columns=['study_time', 'quiz_accuracy', 'assignment_score', 'attendance_rate', 'video_completion', 'practice_attempts', 'session_consistency', 'pause_frequency', 'rewind_frequency', 'engagement_score', 'term_marks', 'total_attendance_days', 'extracurricular_hours', 'discipline_incidents'])
    
    # Model inference prediction
    prediction = model.predict(features)[0]
    
    # Get model probabilities natively scaling max confidence
    probabilities = model.predict_proba(features)[0]
    confidence = float(np.max(probabilities))
    
    # Reverse string map if the model was XGBoost encoded otherwise string
    if isinstance(prediction, (int, np.integer)):
        classes = ['HIGH', 'LOW', 'MEDIUM'] # Map assumed based on default label ordering
        labeled_risk = classes[prediction]
    else:
        labeled_risk = prediction
    
    return {
        "risk_level": labeled_risk,
        "confidence": round(confidence, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
