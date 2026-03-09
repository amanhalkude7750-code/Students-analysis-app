import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def generate_synthetic_data(num_students=5000):
    np.random.seed(42)
    
    # Metadata for Teachers (Categorical/String)
    standard = np.random.choice(['9th', '10th', '11th', '12th'], num_students)
    subject = np.random.choice(['Mathematics', 'Science', 'English', 'History', 'Computer Science'], num_students)
    parent_involvement = np.random.choice(['Low', 'Medium', 'High'], num_students)

    # Generate requested features
    study_time = np.random.randint(0, 301, num_students)  # 0-300 minutes per week
    quiz_accuracy = np.random.uniform(0.1, 1.0, num_students) # 0.1 to 1.0
    assignment_score = np.random.randint(20, 101, num_students) # 20 to 100
    attendance_rate = np.random.uniform(0.3, 1.0, num_students) # 0.3 to 1.0
    video_completion = np.random.uniform(0.1, 1.0, num_students) # 0.1 to 1.0
    practice_attempts = np.random.randint(0, 16, num_students) # 0 to 15
    session_consistency = np.random.randint(1, 8, num_students) # 1 to 7 days
    pause_frequency = np.random.randint(0, 11, num_students) # 0 to 10
    rewind_frequency = np.random.randint(0, 9, num_students) # 0 to 8
    
    # New Numeric Features
    term_marks = np.random.randint(20, 101, num_students)
    total_attendance_days = (attendance_rate * 220).astype(int)
    extracurricular_hours = np.random.randint(0, 20, num_students)
    discipline_incidents = np.random.randint(0, 4, num_students)
    
    # Calculate engagement_score based on user behavior
    engagement_score = (study_time / 300) * 0.4 + video_completion * 0.4 + (practice_attempts / 15) * 0.2
    engagement_score = np.clip(engagement_score, 0, 1)
    
    df = pd.DataFrame({
        'student_id': np.arange(1001, 1001 + num_students),
        'standard': standard,
        'subject': subject,
        'parent_involvement': parent_involvement,
        'term_marks': term_marks,
        'study_time': study_time,
        'quiz_accuracy': quiz_accuracy,
        'assignment_score': assignment_score,
        'attendance_rate': attendance_rate,
        'total_attendance_days': total_attendance_days,
        'video_completion': video_completion,
        'practice_attempts': practice_attempts,
        'session_consistency': session_consistency,
        'pause_frequency': pause_frequency,
        'rewind_frequency': rewind_frequency,
        'extracurricular_hours': extracurricular_hours,
        'discipline_incidents': discipline_incidents,
        'engagement_score': engagement_score

    })
    
    # Target label scoring logic
    def determine_risk(row):
        score = (0.20 * row['quiz_accuracy'] + 
                 0.15 * (row['assignment_score']/100) + 
                 0.15 * (row['term_marks']/100) +
                 0.15 * row['attendance_rate'] + 
                 0.10 * row['video_completion'] + 
                 0.10 * (min(row['practice_attempts'], 10)/10) + 
                 0.10 * row['engagement_score'] + 
                 0.05 * (row['session_consistency']/7))
        
        # Penalize slightly for discipline incidents (for realism)
        score = score - (row['discipline_incidents'] * 0.02)
        
        if score >= 0.75:
            return "LOW"
        elif score >= 0.50:
            return "MEDIUM"
        else:
            return "HIGH"
            
    df['risk_level'] = df.apply(determine_risk, axis=1)
    
    # Export and complete Data Generation Phase
    df.to_csv('student_learning_dataset.csv', index=False)
    print(f"✅ Generated dataset ({num_students} rows) and saved to 'student_learning_dataset.csv'")
    return df

def train_and_evaluate():
    print("==========================================")
    print("🧠 ACCESS.AI Advanced ML Training Pipeline")
    print("==========================================")
    
    df = generate_synthetic_data(5000)
    
    print("\nDataset Target Distribution:")
    print(df['risk_level'].value_counts())
    
    features = ['study_time', 'quiz_accuracy', 'assignment_score', 'attendance_rate', 
                'video_completion', 'practice_attempts', 'session_consistency', 
                'pause_frequency', 'rewind_frequency', 'engagement_score',
                'term_marks', 'total_attendance_days', 'extracurricular_hours', 'discipline_incidents']
    
    X = df[features]
    y = df['risk_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models = {
        'RandomForestClassifier': RandomForestClassifier(n_estimators=100, random_state=42),
        'XGBoostClassifier': XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42),
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42)
    }
    
    best_model = None
    best_accuracy = 0
    best_model_name = ""
    
    report_text = "🧠 ACCESS.AI Model Evaluation Report\n====================================\n\n"
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        
        # Determine labels encoding (required for XGBoost native Python handler)
        if name == 'XGBoostClassifier':
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            y_train_encoded = le.fit_transform(y_train)
            y_test_encoded = le.transform(y_test)
            model.fit(X_train, y_train_encoded)
            y_pred_encoded = model.predict(X_test)
            y_pred = le.inverse_transform(y_pred_encoded)
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        report_text += f"Model: {name}\n"
        report_text += f"Accuracy: {accuracy:.4f}\n"
        report_text += "Confusion Matrix:\n"
        report_text += str(confusion_matrix(y_test, y_pred)) + "\n"
        report_text += "Classification Report:\n"
        report_text += classification_report(y_test, y_pred) + "\n"
        report_text += "-"*50 + "\n"
        
        print(f"Accuracy for {name}: {accuracy:.4f}")
        
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_model = model
            best_model_name = name

    print(f"\n🏆 Best Selection: {best_model_name} with Accuracy {best_accuracy:.4f}!!")
    report_text += f"\n🏆 BEST SELECTION CAUTIONED FOR PROD: {best_model_name} (Accuracy: {best_accuracy:.4f})\n"
    
    # Save Report
    with open('model_evaluation_report.txt', 'w', encoding='utf-8') as f:
        f.write(report_text)
    print("✅ Saved 'model_evaluation_report.txt'")
    
    # Save Model
    # Important: If XGBoost won, we need mapping saved too. RF handles strings naively via pd so we use RF natively
    # To safely save best model and let AI pipeline decode, we just ensure FastAPI does not crash.
    joblib.dump(best_model, 'risk_model.pkl')
    print("✅ Best Model saved to 'risk_model.pkl'")
    
    # Feature Importance Chart
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        indices = np.argsort(importances)
        
        plt.figure(figsize=(10, 6))
        plt.title(f'Feature Importances ({best_model_name})')
        plt.barh(range(len(indices)), importances[indices], color='indigo', align='center')
        plt.yticks(range(len(indices)), [features[i] for i in indices])
        plt.xlabel('Relative Importance')
        plt.tight_layout()
        plt.savefig('feature_importance.png')
        print("✅ Saved Feature Importance Chart to 'feature_importance.png'")
    else:
        print("⚠️ Best model does not support native feature importances plotting.")

if __name__ == "__main__":
    train_and_evaluate()
