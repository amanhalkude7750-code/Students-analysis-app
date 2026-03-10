import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAA7IN8MwI-Xx_QRGlo4P4BzuphAyqq1lw",
    authDomain: "chakravuyu.firebaseapp.com",
    projectId: "chakravuyu",
    storageBucket: "chakravuyu.firebasestorage.app",
    messagingSenderId: "656993935010",
    appId: "1:656993935010:web:1ebf9efd88ad255f9f81fb",
    measurementId: "G-EPKLL65TH1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;
window.query = query;
window.where = where;
window.onSnapshot = onSnapshot;

// Quick seeder to initialize the mock database if the user attempts to load the login page
window.seedUsersIfEmpty = async () => {
    try {
        // Seed Users
        const usersRef = collection(db, "users");
        const userSnapshot = await getDocs(usersRef);
        if (userSnapshot.empty) {
            console.log("Seeding initial authentications...");
            await addDoc(usersRef, { id: "student_001", email: "student@university.edu", password: "password123", role: "student", name: "Alex Researcher" });
            await addDoc(usersRef, { id: "student_002", email: "student2@university.edu", password: "password123", role: "student", name: "Jane Smith" });
            await addDoc(usersRef, { id: "prof_001", email: "teacher@university.edu", password: "admin", role: "teacher", name: "Prof. Johnson" });
            await addDoc(usersRef, { id: "admin_001", email: "aman@university.edu", password: "aman", role: "teacher", name: "Aman Halkude" });
        }

        // Seed Courses
        const coursesRef = collection(db, "courses");
        const courseSnapshot = await getDocs(coursesRef);
        if (courseSnapshot.empty) {
            console.log("Seeding courses...");
            const mockCourses = [
                { title: "Dynamic Programming Masterclass", instructor: "Alan Turing", progress: 0, totalModules: 10, completedModules: 0, estCompletionTime: "5 hrs", thumbnail: "purple-icon", aiRecommended: true, aiReason: "Recommended based on weak topic: Dynamic Programming" },
                { title: "Introduction to Graph Theory", instructor: "Dr. Smith", progress: 0, totalModules: 8, completedModules: 0, estCompletionTime: "4 hrs", thumbnail: "teal-icon", aiRecommended: false, aiReason: "" },
                { title: "Advanced Data Structures", instructor: "Prof. Johnson", progress: 0, totalModules: 5, completedModules: 0, estCompletionTime: "3.5 hrs", thumbnail: "progress-icon", aiRecommended: true, aiReason: "High priority for next week's syllabus" }
            ];
            for (const c of mockCourses) await addDoc(coursesRef, c);
        }

        // Seed Dashboard
        const dashRef = collection(db, "dashboard");
        const dashSnapshot = await getDocs(dashRef);
        if (dashSnapshot.empty) {
            console.log("Seeding dashboard stats...");
            await addDoc(dashRef, {
                predictedScore: 75,
                riskLevel: "Medium Risk",
                courseCompletion: 0,
                dailyTime: 0,
                quizImp: "Awaiting first assessment",
                aiInsight: "Welcome! Your learning path is ready. Start with the Dynamic Programming module below to begin improving your projected score.",
                chartData: {
                    progressLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                    progressScores: [65, 70, 72, 85, 88],
                    heatmapDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    heatmapHours: [2, 4, 3, 5, 1.5, 2.5, 3.5]
                }
            });
        }
    } catch (e) {
        console.error("Firebase Seeding Error:", e);
    }
};
