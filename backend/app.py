from flask import Flask, jsonify, request
from flask_cors import CORS
from google.cloud import firestore
from firebase_config import STUDENTS_REF, INTERACTIONS_REF

app = Flask(__name__)
CORS(app) 

API_PORT = 8000 

@app.route('/', methods=['GET'])
def home():
    """Base route for health check."""
    try:
        doc = STUDENTS_REF.limit(1).get() 
        if doc:
             return jsonify({"message": "Undergraduation Dashboard API Running", "status": "Firebase Connection OK"}), 200
        else:
             return jsonify({"message": "API Running, but Firestore collection is Empty"}), 200
    except Exception as e:
        print(f"--- FIREBASE CONNECTION FAILED: {e} ---")
        return jsonify({"error": "Failed to connect to Firebase/Firestore"}), 500

# ===============================================
# STUDENT DIRECTORY VIEW
# ===============================================
@app.route('/api/students', methods=['GET'])
def get_all_students():
    """API to fetch all student data for the directory view."""
    try:
        students_list = []
        docs = STUDENTS_REF.stream() 
        
        for doc in docs:
            student_data = doc.to_dict()
            student_data['id'] = doc.id
            student_data.pop('progress', {}) 
            students_list.append(student_data)
        
        return jsonify(students_list), 200

    except Exception as e:
        print(f"An error occurred: {e}") 
        return jsonify({"error": f"Could not retrieve students: {str(e)}"}), 500

# ===============================================
# INDIVIDUAL STUDENT PROFILE (GET)
# ===============================================
@app.route('/api/students/<student_id>', methods=['GET'])
def get_student_profile(student_id):
    """Fetches a single student's profile data by ID."""
    try:
        doc = STUDENTS_REF.document(student_id).get()
        if not doc.exists:
            return jsonify({"error": "Student not found"}), 404
        
        student_data = doc.to_dict()
        student_data['id'] = doc.id
        
        return jsonify(student_data), 200

    except Exception as e:
        print(f"An error occurred fetching profile: {e}") 
        return jsonify({"error": f"Could not retrieve profile: {str(e)}"}), 500

# ===============================================
# INTERACTION TIMELINE (GET)
# ===============================================
@app.route('/api/students/<student_id>/interactions', methods=['GET'])
def get_student_interactions(student_id):
    """Fetches all interaction/note history for a student's timeline."""
    try:
        interactions_list = []
        docs = INTERACTIONS_REF.where('student_id', '==', student_id).stream()
        
        for doc in docs:
            interaction_data = doc.to_dict()
            interaction_data['id'] = doc.id
            interactions_list.append(interaction_data)
        
        interactions_list.sort(key=lambda x: x.get('timestamp', 0), reverse=True)

        return jsonify(interactions_list), 200
        
    except Exception as e:
        print(f"An error occurred fetching interactions: {e}") 
        return jsonify({"error": f"Could not retrieve interactions: {str(e)}"}), 500

# ===============================================
# ADD NEW INTERACTION (POST: Log Communication/Note)
# ===============================================
@app.route('/api/students/<student_id>/interactions', methods=['POST'])
def add_new_interaction(student_id):
    """Logs a new Interaction (Communication, Activity, or Note) to the timeline."""
    try:
        data = request.get_json()
        
        if not data or 'details' not in data:
            return jsonify({"error": "Missing required 'details' field."}), 400

        interaction_doc = {
            'student_id': student_id,
            'type': data.get('type', 'Note'), 
            'subtype': data.get('subtype', 'Internal'),
            'details': data['details'],
            'team_member': data.get('team_member', 'API User'),
            'timestamp': data.get('timestamp', firestore.SERVER_TIMESTAMP),
        }

        _, doc_ref = INTERACTIONS_REF.add(interaction_doc)
        
        return jsonify({
            "id": doc_ref.id,
            "message": "Interaction logged successfully",
            **interaction_doc
        }), 201

    except Exception as e:
        print(f"An error occurred logging interaction: {e}") 
        return jsonify({"error": f"Could not log interaction: {str(e)}"}), 500

# ===============================================
# EDIT INTERNAL NOTE (PUT)
# ===============================================
@app.route('/api/notes/<note_id>', methods=['PUT'])
def update_internal_note(note_id):
    """Allows the internal team to edit an existing note by note_id."""
    try:
        data = request.get_json()
        if not data or 'details' not in data:
            return jsonify({"error": "Missing required 'details' field for update."}), 400

        doc_ref = INTERACTIONS_REF.document(note_id)
        
        doc_ref.update({
            'details': data['details'],
            'last_updated': firestore.SERVER_TIMESTAMP,
            'team_member': data.get('team_member', 'API User'), 
        })
        
        return jsonify({
            "id": note_id,
            "message": "Note updated successfully"
        }), 200

    except Exception as e:
        print(f"An error occurred updating note: {e}") 
        return jsonify({"error": f"Could not update note: {str(e)}"}), 500

# ===============================================
# DELETE INTERNAL NOTE (DELETE)
# ===============================================
@app.route('/api/notes/<note_id>', methods=['DELETE'])
def delete_internal_note(note_id):
    """Allows the internal team to delete an existing note by note_id."""
    try:
        INTERACTIONS_REF.document(note_id).delete()
        
        return jsonify({
            "id": note_id,
            "message": "Note deleted successfully"
        }), 200

    except Exception as e:
        print(f"An error occurred deleting note: {e}") 
        return jsonify({"error": f"Could not delete note: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=False, port=API_PORT)