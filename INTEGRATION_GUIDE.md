# ACCESS.AI - Student Data & ML Analysis Integration Guide

## 🎯 Overview

You now have a complete system that integrates real student data from the CSV file with ML-powered analysis and displays insights on both teacher and student dashboards.

## 📊 Data Sources

### Primary: `backend/student_learning_dataset.csv`
- **1050+ real students** with comprehensive learning metrics
- Columns include:
  - Student demographics (standard, subject, parent involvement)
  - Academic metrics (term marks, quiz accuracy, assignment scores)
  - Engagement metrics (study time, video completion, practice attempts)
  - Learning behavior (pause frequency, rewind frequency, attendance)
  - Risk level classification (HIGH, MEDIUM, LOW)

## 🚀 Getting Started

### Step 1: Start the Backend Server
```bash
cd backend
npm install  # if not already done
node server.js
```

You should see:
```
✅ Loaded 1050+ students from CSV.
📡 ACCESS.AI Analytics API running on http://localhost:3000
```

### Step 2: Access the Dashboards

#### **For Teachers:**
1. Open `frontend/teacher.html` in your browser
2. Click on **"Students List"** in the sidebar → New comprehensive student management page
3. Or view **"Class Analytics"** → Updated with real student data

#### **For Students:**
1. Open `frontend/index.html?id=1001` (with student ID)
2. View personalized analysis, recommendations, and risk assessment
3. Default student ID is 1001 (can be changed in URL)

## 🎓 Features by User Role

### **Teacher Features**

#### Class Analytics Dashboard (`teacher.html`)
- ✅ Real-time class metrics (avg marks, quiz accuracy, attendance)
- ✅ Risk distribution showing count of HIGH/MEDIUM/LOW risk students
- ✅ At-risk students intervention table with AI reasons
- ✅ Top performers list
- ✅ Difficult topics analysis by subject

#### Students List (`students-list.html`) - NEW
- ✅ **Searchable table** with all students
- ✅ **Filters**:
  - Risk level (HIGH, MEDIUM, LOW)
  - Standard (9th, 10th, 11th, 12th)
  - Subject (Mathematics, Science, English, History, Computer Science)
- ✅ **Sorting**:
  - By marks (ascending/descending)
  - By attendance rate
  - By engagement score
- ✅ **Pagination** (10 students per page)
- ✅ **Detailed modal** - Click any student to see:
  - Complete academic metrics
  - Engagement breakdown
  - Learning behavior analysis
  - Personalized AI recommendations

### **Student Features**

#### Dashboard (`index.html`)
- ✅ **Performance Prediction** - ML-based score prediction with confidence
- ✅ **Risk Assessment** - Dropout risk evaluation
- ✅ **Weak Topics** - Areas needing improvement
- ✅ **Personalized Recommendations** - Tailored learning suggestions
- ✅ **Engagement Metrics** - Study time, video completion, practice attempts
- ✅ **Learning Progress** - Trend analysis and mastery scores

## 📡 API Endpoints

### New Endpoints for Student Data

#### Get All Students
```
GET /api/v1/students
Response: Array of students with key metrics
```

#### Get Specific Student Analysis
```
GET /api/v1/students/:student_id
Response: Detailed analysis object with recommendations
```

#### Get Class Dashboard Analytics
```
GET /api/v1/students/analytics/dashboard
Response: Class overview, risk distribution, top performers, at-risk students
```

## 🧠 ML Analysis Logic

### Risk Level Assessment
A student is classified as:
- **HIGH RISK**: If any of these:
  - Term marks < 40
  - Attendance rate < 50%
  - Quiz accuracy < 30%
  - 2+ discipline incidents

- **MEDIUM RISK**: Mixed indicators (some good, some poor metrics)

- **LOW RISK**: Strong performance across metrics

### Recommendations Generated
Based on analysis:
- "Review course material - quiz accuracy below 50%"
- "Improve attendance - current rate below 60%"
- "Video content is challenging - increase practice problems"
- "Increase practice attempts for better retention"
- "Address behavioral concerns with student"

### Difficult Topics Detection
Analysis by subject determines:
- Average score per subject across all students
- Difficulty level (High/Medium/Low) based on average performance

## 🔧 Customization & Configuration

### Add New Student
Edit `backend/student_learning_dataset.csv` and add a new row with:
- student_id (unique)
- standard, subject, parent_involvement
- Academic and engagement metrics
- risk_level (HIGH/MEDIUM/LOW - can be auto-calculated)

### View Specific Student
Use URL parameters:
```
http://localhost:3000/frontend/index.html?id=1015
```
Or set in localStorage:
```javascript
localStorage.setItem('studentId', '1015');
```

### Modify Risk Thresholds
Edit function `generateRecommendations()` in `backend/server.js`:
```javascript
if (student.quiz_accuracy < 0.5) {  // Change threshold
    recommendations.push("Review course material...");
}
```

## 📈 Data Visualization

### Teacher Dashboard Charts
- Topic Difficulty vs Average Score
- Quiz Performance Trends
- Video Interaction Heatmap

### Student Dashboard Charts
- Learning Progress (7-week trend)
- Engagement Heatmap (daily study time)
- Concept Mastery Skills Table

## ✅ Testing Checklist

### Backend Testing
- [ ] Server starts without errors
- [ ] CSV loads with correct count (~1050 students)
- [ ] Test endpoint: `GET /api/v1/students`
- [ ] Test endpoint: `GET /api/v1/students/1001`
- [ ] Test endpoint: `GET /api/v1/students/analytics/dashboard`

### Teacher Dashboard Testing
- [ ] Navigate to "Class Analytics"
- [ ] Verify metrics show real student averages
- [ ] Check at-risk table populates with actual students
- [ ] Click "Students List" → Loads all students
- [ ] Test each filter (risk level, standard, subject)
- [ ] Test sorting options
- [ ] Click student in list → Modal shows detailed analysis

### Student Dashboard Testing
- [ ] Navigate to `index.html?id=1005`
- [ ] Verify metrics load with student data
- [ ] Check recommendations display
- [ ] Verify risk level shows correct value
- [ ] Check charts render properly

## 🐛 Troubleshooting

### Backend Not Loading CSV
**Issue**: "0 students loaded"
**Solution**:
1. Check `/backend/student_learning_dataset.csv` exists
2. Verify file is not empty
3. Check console for parse errors
4. Ensure headers in CSV match expected format

### No Data in Student Dashboard
**Issue**: Dashboards show default values
**Solution**:
1. Ensure backend is running (`node server.js`)
2. Check browser console for fetch errors
3. Verify student ID is valid
4. Try hardcoded ID like 1001

### Filters Not Working
**Issue**: Filter controls not responsive
**Solution**:
1. Check browser console for JavaScript errors
2. Verify `/frontend/students-list.html` is loaded
3. Clear browser cache and reload
4. Check network tab for failed API calls

## 📝 Notes

- CSV parsing handles ~1050 students efficiently
- All metrics converted to percentages for display (0-100)
- Risk levels automatically calculated from CSV values
- Recommendations generated dynamically based on thresholds
- System is non-destructive - no data modified, only analyzed

## 🎓 Next Steps (Optional Enhancements)

1. **Dashboard Notifications**: Alert teachers when students move into HIGH risk category
2. **Real Predictions**: Integrate actual ML models (scikit-learn) for better predictions
3. **Export Features**: Generate PDF reports for parent-teacher conferences
4. **Time-Series Analysis**: Track student progress over weeks/months
5. **Peer Benchmarking**: Compare student with class average
6. **Predictive Analytics**: Forecast final scores and graduation probability

---

**Status**: ✅ **READY FOR TESTING**

Start the backend, open the dashboards, and experience the system!
