import json
import random

def run_dropout_risk_prediction():
    print("======================================================")
    print("🧠 TASK 2.3: Dropout Risk Prediction")
    print("======================================================")
    
    # We will compute mock features for each student:
    # login_frequency, course_completion_pct, inactivity_days, video_dropoff_rate
    
    # Let's generate synthetic data for 3 students to demonstrate the model
    students = [
        {"student_id": "student_001", "login_frequency": 2, "course_completion_pct": 14, "inactivity_days": 12, "video_dropoff_rate": 65},
        {"student_id": "student_002", "login_frequency": 15, "course_completion_pct": 82, "inactivity_days": 1, "video_dropoff_rate": 10},
        {"student_id": "student_003", "login_frequency": 5, "course_completion_pct": 45, "inactivity_days": 6, "video_dropoff_rate": 40}
    ]
    
    # Logic: Risk Score Calculation
    # high inactivity (>7 days) is high risk. High dropoff (>50%) is high risk. 
    # Low course completion combined with low login freq is high risk.
    for student in students:
        risk_score = 0
        
        # Base risk from inactivity (0 to 40 points)
        risk_score += min(student["inactivity_days"] * 4, 40)
        
        # Risk from dropoff rate (0 to 30 points)
        risk_score += (student["video_dropoff_rate"] / 100) * 30
        
        # Risk from low login frequency (0 to 15 points)
        if student["login_frequency"] < 3:
            risk_score += 15
        elif student["login_frequency"] < 7:
            risk_score += 7
            
        # Risk from low completion (0 to 15 points)
        if student["course_completion_pct"] < 20:
            risk_score += 15
        elif student["course_completion_pct"] < 50:
            risk_score += 5
            
        probability = min(max(int(risk_score), 5), 98) # cap between 5% and 98%
        
        if probability >= 70:
            risk_level = "High"
        elif probability >= 40:
            risk_level = "Medium"
        else:
            risk_level = "Low"
            
        print(f"Student ID       : {student['student_id']}")
        print(f"Inactivity Days  : {student['inactivity_days']} | Drop-off Rate: {student['video_dropoff_rate']}%")
        print(f"Risk Level       : {risk_level}")
        print(f"Probability      : {probability}%\n")


def run_personalized_recommendation():
    print("======================================================")
    print("🧠 TASK 2.4: Personalized Learning Recommendation")
    print("======================================================")
    
    # Data structure simulating features for the rules engine
    student_stats = [
        {"student_id": "student_001", "quiz_accuracy": 35.0, "replay_frequency": 6, "weak_concept": "Recursion"},
        {"student_id": "student_002", "quiz_accuracy": 85.0, "replay_frequency": 1, "weak_concept": None},
        {"student_id": "student_003", "quiz_accuracy": 60.0, "replay_frequency": 5, "weak_concept": "Dynamic Programming"}
    ]
    
    for student in student_stats:
        recommendations = []
        
        print(f"Student ID: {student['student_id']}")
        print(f"[Metrics -> Quiz Accuracy: {student['quiz_accuracy']}%, Replays: {student['replay_frequency']}]")
        
        # Rule 1: quiz_accuracy < 50%
        if student["quiz_accuracy"] < 50:
            recommendations.append("• Watch Lecture 4 again")
            if student["weak_concept"]:
                recommendations.append(f"• Review {student['weak_concept']} concepts")
                
        # Rule 2: high replay frequency (e.g., > 3)
        if student["replay_frequency"] > 3:
            recommendations.append("• Solve 5 practice problems")
            
        # Rule 3: Good performance
        if student["quiz_accuracy"] >= 80:
            recommendations.append("• Advance to the next module")
            recommendations.append("• Try the optional challenge assignment")

        print("Recommended Actions:")
        for rec in recommendations:
            print(rec)
        print("-" * 40)

if __name__ == "__main__":
    run_dropout_risk_prediction()
    run_personalized_recommendation()
