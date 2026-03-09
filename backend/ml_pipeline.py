import pandas as pd
import json
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import xgboost as xgb

def run_performance_prediction():
    print("======================================================")
    print("🧠 TASK 2.1: Performance Prediction Model (Python)")
    print("======================================================")
    
    # Load feature dataset extracting from earlier
    df = pd.read_csv('../database/ml_training_dataset.csv')
    
    # Input features
    features = ['quiz_accuracy', 'avg_video_completion', 'revisit_rate', 'study_time_per_day', 'pause_frequency']
    X = df[features]
    
    # We simulate a target variable 'actual_score' for training
    # High quiz acc, high completion -> higher score
    np.random.seed(42)
    y = (df['quiz_accuracy'] * 0.4 + df['avg_video_completion'] * 30 - df['revisit_rate'] * 2 + np.clip(df['study_time_per_day']/2, 0, 20) + np.random.normal(0, 5, len(df))).clip(0, 100)
    
    # Initialize Models
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    xgb_model = xgb.XGBRegressor(n_estimators=100, random_state=42, objective='reg:squarederror')
    
    print("Training Random Forest, Gradient Boosting, and XGBoost models...")
    rf_model.fit(X, y)
    gb_model.fit(X, y)
    xgb_model.fit(X, y)
    
    # Predict for a few students using Random Forest as the primary 
    print("\nInference Results (Using Random Forest):")
    sample = df.head(5).copy()
    sample['predicted_score'] = rf_model.predict(sample[features])
    
    def get_category(score):
        if score >= 80: return "High"
        elif score >= 60: return "Medium"
        else: return "Low"
        
    sample['performance_category'] = sample['predicted_score'].apply(get_category)
    
    for _, row in sample.iterrows():
        print(f"Student ID         : {row['student_id']}")
        print(f"Predicted Score    : {row['predicted_score']:.1f}%")
        print(f"Performance        : {row['performance_category']}")
        print("-" * 35)

def run_weak_concept_detection():
    print("\n======================================================")
    print("🧠 Step 1 - Detect Weak Topics")
    print("======================================================")
    
    from sklearn.ensemble import RandomForestClassifier
    import pandas as pd
    
    # 1. Create Example Dataset
    data = {
        'student_id': [101, 101, 102, 102, 103],
        'topic': ['Recursion', 'Arrays', 'Graphs', 'Dynamic Programming', 'Recursion'],
        'quiz_accuracy': [35, 80, 45, 90, 48],
        'revisit_rate': [4, 1, 3, 0, 5],
        'time_spent': [120, 45, 150, 60, 200],  # minutes
        'attempts': [3, 2, 4, 1, 6]
    }
    df = pd.DataFrame(data)
    
    print("Input Data:")
    print(df[['student_id', 'topic', 'quiz_accuracy', 'attempts', 'revisit_rate']].to_string(index=False))
    print("-" * 50)
    
    # 2. Rule-Based Approach
    print("Applying Weakness Rule: IF quiz_accuracy < 50% AND attempts < 5 THEN topic = WEAK")
    # Create the rule
    df['is_weak_rule'] = (df['quiz_accuracy'] < 50) & (df['attempts'] < 5)
    
    for student_id, group in df.groupby('student_id'):
        weak_topics = group[group['is_weak_rule']]['topic'].tolist()
        print(f"Student {student_id} Weak Topics = {weak_topics}")
        
    print("-" * 50)
    
    # 3. ML Classification Approach (Alternative)
    print("ML Classification Approach (Random Forest Classifier):")
    # Features
    features = ['quiz_accuracy', 'revisit_rate', 'time_spent', 'attempts']
    X = df[features]
    
    # We create mock target labels for training (1 = Weak, 0 = Strong)
    y = ((df['quiz_accuracy'] < 55) & (df['time_spent'] > 100)).astype(int) 
    
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y)
    
    # Predict
    df['is_weak_ml'] = clf.predict(X)
    
    for student_id, group in df.groupby('student_id'):
        weak_topics_ml = group[group['is_weak_ml'] == 1]['topic'].tolist()
        if len(weak_topics_ml) > 0:
            print(f"Student {student_id} AI Detected Weak Topics = {weak_topics_ml}")

def build_resource_library():
    print("\n======================================================")
    print("📚 Step 2 - Build a Learning Resource Library")
    print("======================================================")
    
    import pandas as pd
    
    # 1. Create Resource Database Structure
    resource_data = {
        'resource_id': [1, 2, 3, 4, 5, 6],
        'topic': ['Recursion', 'Recursion', 'Recursion', 'Graphs', 'Graphs', 'Arrays'],
        'difficulty': ['Beginner', 'Beginner', 'Beginner', 'Intermediate', 'Advanced', 'Beginner'],
        'type': ['Video', 'Practice', 'Simulation', 'Video', 'Practice', 'Notes'],
        'url': [
            'youtube.com/recursion_intro',
            'leetcode.com/tag/recursion',
            'recursion-tree.com/visualize',
            'youtube.com/graph_traversal',
            'leetcode.com/tag/graph',
            'docs.python.org/arrays'
        ]
    }
    
    resources_df = pd.DataFrame(resource_data)
    
    print("Loaded Resource Database:")
    print(resources_df.to_string(index=False))
    print("-" * 50)
    
    # Example Function: Fetch resources for a specific topic
    def fetch_resources(topic_name, difficulty_level="Beginner"):
        filtered_resources = resources_df[
            (resources_df['topic'] == topic_name) & 
            (resources_df['difficulty'] == difficulty_level)
        ]
        return filtered_resources
        
    print("Simulating Fetch for 'Recursion' (Beginner Level):")
    recursion_resources = fetch_resources('Recursion')
    
    for index, row in recursion_resources.iterrows():
        print(f"[{row['type']}] {row['url']}")

def run_content_based_recommendation():
    print("\n======================================================")
    print("🎯 Step 3 - Content-Based Recommendation")
    print("======================================================")
    
    import pandas as pd
    
    # Mock data to test the recommendation engine
    student_profile = {
        'student_id': 101,
        'weak_topic': 'Recursion',
        'level': 'Beginner'
    }
    
    # 1. Resource Database from Step 2 (with added past success rate metric)
    resource_data = {
        'resource_id': [1, 2, 3, 4, 5, 6],
        'topic': ['Recursion', 'Recursion', 'Recursion', 'Recursion', 'Graphs', 'Arrays'],
        'difficulty': ['Beginner', 'Beginner', 'Intermediate', 'Beginner', 'Advanced', 'Beginner'],
        'type': ['Video', 'Practice', 'Documentation', 'Simulation', 'Practice', 'Notes'],
        'student_success_rate': [0.85, 0.70, 0.45, 0.90, 0.60, 0.88],
        'url': [
            'youtube.com/recursion_intro',
            'leetcode.com/tag/recursion',
            'docs.python.org/recursion',
            'recursion-tree.com/visualize',
            'leetcode.com/tag/graph',
            'docs.python.org/arrays'
        ]
    }
    resources_df = pd.DataFrame(resource_data)
    
    print(f"Generating recommendations for Student #{student_profile['student_id']}")
    print(f"Target Weakness: {student_profile['weak_topic']} | Level: {student_profile['level']}")
    print("-" * 50)
    
    # 2. Recommendation Logic
    recommendations = []
    
    for index, row in resources_df.iterrows():
        # Feature Matching logic
        topic_match = 1.0 if row['topic'] == student_profile['weak_topic'] else 0.0
        difficulty_match = 1.0 if row['difficulty'] == student_profile['level'] else 0.0
        success_rate = row['student_success_rate']
        
        # Scoring Function Formula:
        # score = (topic_match * 0.5) + (difficulty_match * 0.3) + (student_success_rate * 0.2)
        score = (topic_match * 0.5) + (difficulty_match * 0.3) + (success_rate * 0.2)
        
        recommendations.append({
            'resource_id': row['resource_id'],
            'topic': row['topic'],
            'type': row['type'],
            'difficulty': row['difficulty'],
            'url': row['url'],
            'score': round(score, 3)
        })
        
    # 3. Sort and Output Top 3
    recs_df = pd.DataFrame(recommendations)
    # Sort by descending score
    recs_df = recs_df.sort_values(by='score', ascending=False)
    
    top_3 = recs_df.head(3)
    
    print("Top 3 Recommended Assets Based on Scoring Function:")
    print(top_3[['score', 'topic', 'difficulty', 'type', 'url']].to_string(index=False))

def run_knowledge_graph():
    print("\n======================================================")
    print("🕸️ Step 4 - Knowledge Graph (Advanced Feature)")
    print("======================================================")
    
    import networkx as nx
    
    # 1. Build the Concept Dependency Graph
    G = nx.DiGraph()
    
    # Add nodes (Topics)
    nodes = ['Variables', 'Arrays', 'Stack', 'Base Case', 'Recursive Calls', 'Recursion Tree', 'Recursion', 'Dynamic Programming']
    G.add_nodes_from(nodes)
    
    # Add edges (Prerequisites: A -> B means A is a prerequisite for B)
    edges = [
        ('Variables', 'Arrays'),
        ('Arrays', 'Stack'),
        ('Stack', 'Recursion'),
        ('Base Case', 'Recursion'),
        ('Recursive Calls', 'Recursion'),
        ('Recursion Tree', 'Recursion'),
        ('Recursion', 'Dynamic Programming')
    ]
    G.add_edges_from(edges)
    
    print("Knowledge Graph Built with NetworkX successfully.")
    print(f"Total Concepts in Graph: {G.number_of_nodes()}")
    print("-" * 50)
    
    # 2. Check Prerequisites for a struggling student
    student_weak_topic = 'Recursion'
    
    print(f"Student is struggling in: '{student_weak_topic}'")
    
    if student_weak_topic in G:
        prereqs = list(G.predecessors(student_weak_topic))
        
        if prereqs:
            print(f"System Recommendation: Before advancing with {student_weak_topic}, review these prerequisites first:")
            for prereq in prereqs:
                print(f" • {prereq}")
                
            # Trace back further root concepts
            ancestors = list(nx.ancestors(G, student_weak_topic))
            print(f"\n[Deep Context: The full prerequisite tree up to {student_weak_topic} includes: {ancestors}]")
        else:
            print(f"No prerequisites found for {student_weak_topic}. Review foundational material.")
    else:
        print(f"Topic {student_weak_topic} not found in Knowledge Graph.")

def run_reinforcement_learning():
    print("\n======================================================")
    print("🤖 Step 5 - Reinforcement Learning (Antigravity Feature)")
    print("======================================================")
    
    import numpy as np
    import pandas as pd
    
    # 1. Define Environment
    # States: [0: Recursion, 1: Graphs, 2: Arrays]
    # Actions (Resource Types): [0: Video, 1: Practice, 2: Visualization]
    
    states = ['Recursion', 'Graphs', 'Arrays']
    actions = ['Video', 'Practice', 'Visualization']
    
    # Initialize Q-Table (State x Action) with zeros
    # Q(s, a) represents the expected reward (score improvement) for taking action a in state s
    q_table = np.zeros((len(states), len(actions)))
    
    print(f"Initialized Empty Q-Table for {len(states)} States and {len(actions)} Actions.")
    
    # Hyperparameters
    alpha = 0.2      # Learning Rate
    
    # Simulated Interaction Data: (State, Action, Reward/Quiz Score Improvement)
    # The AI explores recommending different things for different weaknesses
    simulated_interactions = [
        (0, 0, 5),   # Recursion -> Video -> +5 points
        (0, 1, 10),  # Recursion -> Practice -> +10 points
        (0, 2, 25),  # Recursion -> Visualization -> +25 points (Aha moment!)
        (1, 0, 15),  # Graphs -> Video -> +15 points
        (1, 1, 20),  # Graphs -> Practice -> +20 points
        (2, 0, 5),   # Arrays -> Video -> +5 points
        (2, 1, 30),  # Arrays -> Practice -> +30 points
        (0, 2, 20),  # Recursion -> Visualization -> +20 points
    ]
    
    print("Training AI Agent (Q-Learning) over student interactions...\n")
    
    for state_idx, action_idx, reward in simulated_interactions:
        # Contextual Bandit Q-Learning Update
        # Formula: Q(s,a) = Q(s,a) + alpha * (Reward - Q(s,a))
        old_value = q_table[state_idx, action_idx]
        new_value = old_value + alpha * (reward - old_value)
        q_table[state_idx, action_idx] = new_value
        
    print("Learned Q-Table (Expected Quiz Score Improvement):")
    q_df = pd.DataFrame(q_table, columns=actions, index=states)
    print(q_df.round(2))
    print("-" * 50)
    
    # 3. AI Autonomous Policy Extraction
    target_state = 'Recursion'
    state_idx = states.index(target_state)
    best_action_idx = np.argmax(q_table[state_idx])
    best_action = actions[best_action_idx]
    
    print(f"Live Input Environment State: Student is Weak in '{target_state}'")
    print(f"🤖 RL Policy Decision: Recommend '{best_action}' Resource")
    print(f"Reasoning: Expected highest future reward output (+{q_table[state_idx, best_action_idx]:.2f} pts)")


def run_learning_path_generator():
    print("\n======================================================")
    print("🛤️ Step 6 - Personalized Learning Path Generator")
    print("======================================================")
    
    # Simulating a dynamic sequence generator
    topic = "Recursion"
    print(f"Generating Modular Learning Path for: {topic}")
    print("-" * 50)
    
    sequence = [
        {"step": 1, "action": f"Watch {topic} basics video", "type": "Video"},
        {"step": 2, "action": f"Interactive {topic.lower()} tree simulator", "type": "Simulation"},
        {"step": 3, "action": f"Solve 5 beginner {topic.lower()} problems", "type": "Practice"},
        {"step": 4, "action": f"Take summary quiz on {topic}", "type": "Quiz"}
    ]
    
    for item in sequence:
        print(f"Step {item['step']} [{item['type']}]")
        print(f" ↳ {item['action']}\n")
    print("Curriculum Planned. AI Tutor session ready to start.")


def run_realtime_adaptive_recommendation():
    print("\n======================================================")
    print("⚡ Step 7 - Real-Time Adaptive Recommendation")
    print("======================================================")
    
    # Real-time event stream simulation
    import time
    
    event_stream = [
        {"timestamp": "10:01 AM", "event_type": "video_play", "topic": "Recursion"},
        {"timestamp": "10:04 AM", "event_type": "video_pause", "topic": "Recursion"},
        {"timestamp": "10:06 AM", "event_type": "rewind", "topic": "Recursion"},
        {"timestamp": "10:08 AM", "event_type": "rewind", "topic": "Recursion"},
        {"timestamp": "10:10 AM", "event_type": "rewind", "topic": "Recursion"},
        {"timestamp": "10:11 AM", "event_type": "rewind", "topic": "Recursion"}
    ]
    
    print("Monitoring Live Student Interaction Stream...")
    rewind_count = 0
    
    for event in event_stream:
        print(f"[{event['timestamp']}] Event Received: {event['event_type']} (Topic: {event['topic']})")
        
        if event['event_type'] == 'rewind':
            rewind_count += 1
            
        # Trigger adaptive recommendation rule
        if rewind_count >= 4:
            print("\n🚨 >> REAL-TIME ADAPTIVE TRIGGER << 🚨")
            print("System detected high friction (4+ rewinds) during video playback.")
            print("Action: Instantly pushing Visualization Tool to student dashboard.")
            print("Reasoning: Student is struggling to visualize the concept mathematically.\n")
            break # Break stream on intervention


if __name__ == "__main__":
    run_performance_prediction()
    run_weak_concept_detection()
    build_resource_library()
    run_content_based_recommendation()
    run_knowledge_graph()
    run_reinforcement_learning()
    run_learning_path_generator()
    run_realtime_adaptive_recommendation()
