import firebase_admin
from firebase_admin import credentials, firestore

CRED_PATH = 'servieAccountkey.json' 

try:
    firebase_admin.get_app() 
except ValueError:
    CRED = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(CRED)

db = firestore.client()

STUDENTS_REF = db.collection('Students')
INTERACTIONS_REF = db.collection('Interactions')
NOTES_REF = db.collection('Notes')
