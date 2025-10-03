import firebase_admin
from firebase_admin import credentials, firestore
from firebase_config import STUDENTS_REF, INTERACTIONS_REF, db 
import random
from datetime import datetime, timedelta

def generate_timestamp(days_ago):
    return datetime.now() - timedelta(days=days_ago, hours=random.randint(1, 24))

def generate_progress(status, colleges_count):
    if status == "Submitted":
        return {"resume_uploaded": True, "activities_added_count": random.randint(5, 15)}
    elif status == "Applying":
        return {"resume_uploaded": True, "activities_added_count": random.randint(3, 8)}
    elif status == "Shortlisting":
        return {"resume_uploaded": False, "activities_added_count": random.randint(1, 3)}
    else: 
        return {"resume_uploaded": False, "activities_added_count": 0}

MOCK_STUDENTS = [
    {
        "name": "Anya Sharma",
        "email": "anya.sharma@gmail.com", 
        "phone": "123-456-7890",
        "grade_level": "Junior",
        "country": "India",
        "gpa": 3.9,
        "sat_e": 750,
        "sat_m": 780,
        "app_status": "Applying",
        "last_active_timestamp": generate_timestamp(1),
        "colleges_selected_count": 15,
        "ai_questions_asked": 85,
        "high_intent_score": 92,
        "needs_essay_help": False,
    },
    {
        "name": "Ben Carter",
        "email": "ben.carter@gmail.com", 
        "phone": "234-567-8901",
        "grade_level": "Sophomore",
        "country": "USA",
        "gpa": 3.2,
        "sat_e": None,
        "sat_m": None,
        "app_status": "Exploring",
        "last_active_timestamp": generate_timestamp(10),
        "colleges_selected_count": 2,
        "ai_questions_asked": 3,
        "high_intent_score": 30,
        "needs_essay_help": False,
    },
    {
        "name": "Chloe Wong",
        "email": "chloe.wong@gmail.com", 
        "phone": "345-678-9012",
        "grade_level": "Senior",
        "country": "Canada",
        "gpa": 3.5,
        "sat_e": 650,
        "sat_m": 680,
        "app_status": "Shortlisting",
        "last_active_timestamp": generate_timestamp(8), 
        "colleges_selected_count": 8,
        "ai_questions_asked": 40,
        "high_intent_score": 65,
        "needs_essay_help": True,
    },
    {
        "name": "David Lee",
        "email": "david.lee@gmail.com", 
        "phone": "456-789-0123",
        "grade_level": "Senior",
        "country": "UK",
        "gpa": 4.0,
        "sat_e": 800,
        "sat_m": 800,
        "app_status": "Submitted",
        "last_active_timestamp": generate_timestamp(2),
        "colleges_selected_count": 20,
        "ai_questions_asked": 100,
        "high_intent_score": 100,
        "needs_essay_help": False,
    }
]


def seed_data():
    """Seeds the main Students collection."""
    print("Starting student data seeding...")
    
    for doc in STUDENTS_REF.stream():
        doc.reference.delete()
    print("Cleared existing 'Students' data.")

    student_id_map = {}
    for student_data in MOCK_STUDENTS:
        student_data['progress'] = generate_progress(
            student_data['app_status'], 
            student_data['colleges_selected_count']
        )
        student_data['last_active_timestamp'] = student_data['last_active_timestamp'].timestamp() * 1000 

        _, doc_ref = STUDENTS_REF.add(student_data)
        student_id_map[student_data['email']] = doc_ref.id

    print(f"Successfully added {len(MOCK_STUDENTS)} mock students to Firestore.")
    
    return student_id_map


def seed_interactions(student_id_map):
    """Seeds the Interactions collection with mixed types (Activity, Comm, Note)."""
    print("Starting interaction data seeding...")

    for doc in INTERACTIONS_REF.stream():
        doc.reference.delete()
    print("Cleared existing 'Interactions' data.")

    interactions_data = [
        {'student_id_email': 'anya.sharma@gmail.com', 'type': 'Activity', 'subtype': 'Login', 'details': 'User logged in.', 'timestamp': generate_timestamp(0.5), 'team_member': None},
        {'student_id_email': 'anya.sharma@gmail.com', 'type': 'Activity', 'subtype': 'AI Question', 'details': 'Asked 5 questions about university scholarships.', 'timestamp': generate_timestamp(0.8), 'team_member': None},
        {'student_id_email': 'anya.sharma@gmail.com', 'type': 'Document', 'subtype': 'Essay Draft', 'details': 'Saved first draft of UCAS personal statement.', 'timestamp': generate_timestamp(1.2), 'team_member': None},

        {'student_id_email': 'ben.carter@gmail.com', 'type': 'Activity', 'subtype': 'College Select', 'details': 'Added "UT Austin" to My Colleges.', 'timestamp': generate_timestamp(15), 'team_member': None},
        {'student_id_email': 'ben.carter@gmail.com', 'type': 'Communication', 'subtype': 'Email Sent', 'details': 'Welcome Email sent: Guide to Sophomore Success.', 'timestamp': generate_timestamp(10), 'team_member': 'System'},
        {'student_id_email': 'ben.carter@gmail.com', 'type': 'Communication', 'subtype': 'SMS Follow-up', 'details': 'Sent SMS link to GPA Calculator tool.', 'timestamp': generate_timestamp(5), 'team_member': 'Alex M.'},

        {'student_id_email': 'chloe.wong@gmail.com', 'type': 'Communication', 'subtype': 'Called', 'details': 'Team member called to discuss essay topics. Left voicemail.', 'timestamp': generate_timestamp(8), 'team_member': 'Sarah J.'},
        {'student_id_email': 'chloe.wong@gmail.com', 'type': 'Note', 'subtype': 'Internal', 'details': 'Need to send Chloe information about Canadian university deadlines. Follow up next week.', 'timestamp': generate_timestamp(7), 'team_member': 'Sarah J.'},

        {'student_id_email': 'david.lee@gmail.com', 'type': 'Activity', 'subtype': 'Resume Upload', 'details': 'Final version of resume uploaded for review.', 'timestamp': generate_timestamp(2), 'team_member': None},
        {'student_id_email': 'david.lee@gmail.com', 'type': 'Note', 'subtype': 'Internal', 'details': 'High potential student. Move to post-submission mentoring queue.', 'timestamp': generate_timestamp(1), 'team_member': 'Team Lead'},
    ]

    for data in interactions_data:
        student_firestore_id = student_id_map.get(data['student_id_email'])
        
        if student_firestore_id:
            data['student_id'] = student_firestore_id
            data.pop('student_id_email')
            data['timestamp'] = data['timestamp'].timestamp() * 1000 
            INTERACTIONS_REF.add(data)
    
    print(f"Successfully added {len(interactions_data)} mock interactions.")

if __name__ == '__main__':
    student_id_map = seed_data()
    if student_id_map:
        seed_interactions(student_id_map)