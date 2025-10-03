import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Mail,
  Phone,
  BookOpen,
  Star,
  NotepadText,
  Lightbulb,
  MapPin,
  FileText,
  Users,
  Pencil,
  Trash2,
  PhoneCall, 
} from "lucide-react";
import "./App.css";

const API_PORT = 8000;

const calculateProgress = (progress, status) => {
  let score = 0;
  if (status === "Submitted") return 100;
  if (progress.colleges_selected_count > 0) score += 20;
  if (progress.essays_started_count > 0) score += 20;
  if (progress.resume_uploaded) score += 20;
  if (progress.activities_added_count > 0) score += 20;
  if (status === "Applying") score += 20;
  return Math.min(score, 99);
};

const formatTimestamp = (timestamp) => {
  if (typeof timestamp === "number") {
    return new Date(timestamp).toLocaleString();
  }
  return "Loading...";
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `API call failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

// --- Action Modal Component ---
const ActionModal = ({ isOpen, type, onClose, onSave }) => {
  const [details, setDetails] = useState("");
  const [subtype, setSubtype] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDetails("");
      setSubtype("");
    }
  }, [isOpen]);

  const modalConfig = {
    "Log Communication": {
      title: "Log Call/Meeting",
      subtypePlaceholder: "e.g., Follow-up Call, Team Meeting",
    },
    "Trigger Email": {
      title: "Mock Follow-up Email",
      subtypePlaceholder: "e.g., Sent Essay Guide, Application Reminder",
    },
    "Schedule Task": {
      title: "Schedule Reminder/Task",
      subtypePlaceholder: "e.g., Follow up on essays, Check resume",
    },
  };

  if (!isOpen) return null;
  const config = modalConfig[type];

  const handleSave = () => {
    if (!details.trim() || !subtype.trim())
      return alert("Please fill in both fields.");
    onSave(type, subtype, details);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{config.title}</h3>

        <label>Subtype/Action Name:</label>
        <input
          type="text"
          value={subtype}
          onChange={(e) => setSubtype(e.target.value)}
          placeholder={config.subtypePlaceholder}
          className="modal-input"
        />

        <label style={{ marginTop: "15px" }}>Details/Summary:</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Enter full details of the action/log..."
        />

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Log Action
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  // --- Data Fetching ---
  const handleRefetchInteractions = () => {
    fetchJson(`http://localhost:${API_PORT}/api/students/${id}/interactions`)
      .then(setInteractions)
      .catch((err) => console.error("Failed to refetch interactions:", err));
  };

  useEffect(() => {
    setLoading(true);
    const fetchProfile = fetchJson(
      `http://localhost:${API_PORT}/api/students/${id}`
    );

    const fetchInteractions = fetchJson(
      `http://localhost:${API_PORT}/api/students/${id}/interactions`
    );

    Promise.all([fetchProfile, fetchInteractions])
      .then(([profileData, interactionData]) => {
        setProfile(profileData);
        setInteractions(interactionData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch student data:", err);
        setLoading(false);
      });
  }, [id]);

  // --- Filter Interactions (Separation Logic) ---
  const { timelineEvents, communicationLog, internalNotes } = useMemo(() => {
    const events = [];
    const comms = [];
    const notes = [];

    interactions.forEach((item) => {
      if (item.type === "Activity" || item.type === "Document") {
        events.push(item);
      } else if (item.type === "Communication") {
        comms.push(item);
      } else if (item.type === "Note") {
        notes.push(item);
      }
    });

    const sorter = (a, b) => (b.timestamp || 0) - (a.timestamp || 0);

    return {
      timelineEvents: events.sort(sorter),
      communicationLog: comms.sort(sorter),
      internalNotes: notes.sort(sorter),
    };
  }, [interactions]);

  const handleLogAction = (actionType, subtype, details) => {
    let typeToSave = "";

    // Logic to determine the correct Firestore 'type'
    if (actionType === "Log Communication" || actionType === "Trigger Email") {
      typeToSave = "Communication";
    } else if (actionType === "Schedule Task") {
      typeToSave = "Note"; // Tasks/Reminders are saved as Internal Notes
    } else {
      typeToSave = "Note";
    }

    const payload = {
      type: typeToSave,
      subtype: subtype,
      details: details,
      timestamp: Date.now(),
      team_member: "Admin User (You)",
      student_id: id,
    };

    fetch(`http://localhost:${API_PORT}/api/students/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Action logging failed on server.");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        handleRefetchInteractions(); 
      })
      .catch((err) => console.error("Failed to log action:", err));
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const notePayload = {
      type: "Note",
      subtype: "Internal",
      details: newNote,
      timestamp: Date.now(),
      team_member: "Admin User (You)",
      student_id: id,
    };

    fetch(`http://localhost:${API_PORT}/api/students/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notePayload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Note add failed on server.");
        return res.json();
      })
      .then(() => {
        setNewNote("");
        handleRefetchInteractions();
      })
      .catch((err) => console.error("Failed to add note:", err));
  };

  const handleDeleteNote = (noteId) => {

    fetch(`http://localhost:${API_PORT}/api/notes/${noteId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Note deletion failed on server.");
        handleRefetchInteractions();
      })
      .catch((err) => console.error("Failed to delete note:", err));
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.details);
  };

  const handleSaveEdit = () => {
    if (!editingNoteText.trim()) return;

    const updatePayload = {
      details: editingNoteText,
      team_member: "Admin User (You) (Edited)",
      last_updated: Date.now(),
    };

    fetch(`http://localhost:${API_PORT}/api/notes/${editingNoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Note update failed on server.");
        return res.json();
      })
      .then(() => {
        setEditingNoteId(null);
        setEditingNoteText("");
        handleRefetchInteractions();
      })
      .catch((err) => console.error("Failed to save edit:", err));
  };

  if (loading)
    return <div className="loading-state">Loading Student Profile...</div>;
  if (!profile || profile.error)
    return (
      <div className="error-state">
        Error: Student data could not be loaded. Please check if the ID is
        valid: {id}
      </div>
    );

  const progressPercent = calculateProgress(
    profile.progress || {},
    profile.app_status
  );

  const aiSummary =
    profile.app_status === "Submitted"
      ? "This student is highly engaged, has excellent scores, and is tracking well. Focus on yield."
      : profile.high_intent_score < 40
      ? "Low engagement, low scores. Needs a basic follow-up call to re-engage with the platform and confirm goals."
      : "High intent score, but slow essay progress. Needs an intervention on the writing stage. Recommend using essay resources communication tool.";

  return (
    <div className="profile-container">
      <ActionModal
        isOpen={isModalOpen}
        type={modalType}
        onClose={() => setIsModalOpen(false)}
        onSave={handleLogAction}
      />

      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <header className="profile-header">
        <h2>
          {profile.name}
          <span
            className={`status-badge status-${profile.app_status.replace(
              /\s/g,
              ""
            )}`}
          >
            {profile.app_status}
          </span>
        </h2>
        <div className="profile-contact">
          <span>
            <Mail size={16} /> {profile.email}
          </span>
          <span>
            <Phone size={16} /> {profile.phone || "N/A"}
          </span>
        </div>
      </header>

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="card basic-info-card">
            <h3>Basic Info</h3>
            <p>
              <MapPin size={16} /> <strong>Country:</strong> {profile.country}
            </p>
            <p>
              <Users size={16} /> <strong>Grade:</strong> {profile.grade_level}
            </p>
          </div>

          <div className="card scores-card">
            <h3>Academic Scores</h3>
            <p>
              <strong>GPA:</strong> {profile.gpa || "N/A"} (Max 4.0)
            </p>
            <p>
              <strong>SAT:</strong> E:{profile.sat_e || "N/A"} / M:
              {profile.sat_m || "N/A"} (Max 800)
            </p>
            <p>
              <strong>ACT:</strong> {profile.act || "N/A"} (Max 36)
            </p>
          </div>

          <h3 style={{ marginTop: "20px" }}>Application Progress</h3>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progressPercent}%` }}
              title={`${progressPercent}% Complete`}
            >
              {progressPercent}%
            </div>
          </div>
          <p style={{ fontSize: "0.9em", marginTop: "5px", color: "#555" }}>
            Current Stage: **{profile.app_status}**. Last active:{" "}
            {formatTimestamp(profile.last_active_timestamp)}
          </p>

          <div className="communication-tools">
            <h3>Actions</h3>
            <button
              className="tool-btn action-log"
              onClick={() => handleOpenModal("Log Communication")}
            >
              <Clock size={16} /> Log Call/Meeting
            </button>
            <button
              className="tool-btn action-email-mock"
              onClick={() => handleOpenModal("Trigger Email")}
            >
              <Mail size={16} /> Trigger Follow-up Email (Mock)
            </button>
            <button
              className="tool-btn action-reminder"
              onClick={() => handleOpenModal("Schedule Task")}
            >
              <NotepadText size={16} /> Schedule Reminder/Task
            </button>
          </div>

          <div className="ai-summary-card">
            <Lightbulb size={20} color="#3498db" />
            <h4>AI Summary & Recommendation</h4>
            <p>{aiSummary}</p>
          </div>
        </div>

        <div className="profile-main">
          {/* 1. COMMUNICATION LOG */}
          <div className="communication-log-section card">
            <h3>
              Communication Log (Emails/SMS - {communicationLog.length} Events)
            </h3>
            <div className="timeline">
              {communicationLog.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`timeline-item timeline-Communication`}
                >
                  <div className="timeline-icon">
                    {item.subtype.toLowerCase().includes("call") ||
                    item.subtype.toLowerCase().includes("meeting") ? (
                      <PhoneCall size={16} />
                    ) : (
                      <Mail size={16} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-title">
                      {item.subtype}{" "}
                      {item.team_member ? `by ${item.team_member}` : "(System)"}
                    </span>
                    <p>{item.details}</p>
                    <span className="timeline-date">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              {communicationLog.length === 0 && (
                <p className="text-gray-500">No communications logged.</p>
              )}
            </div>
          </div>

          {/* 2. INTERACTION TIMELINE */}
          <div
            className="interaction-timeline-section card"
            style={{ marginTop: "30px" }}
          >
            <h3>
              Interaction Timeline (Activities - {timelineEvents.length} Events)
            </h3>
            <div className="timeline">
              {timelineEvents.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`timeline-item timeline-${item.type}`}
                >
                  <div className="timeline-icon">
                    {item.type === "Activity" && <Clock size={16} />}
                    {item.type === "Document" && <FileText size={16} />}
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-title">{item.subtype} </span>
                    <p>{item.details}</p>
                    <span className="timeline-date">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <p className="text-gray-500">No system activities tracked.</p>
              )}
            </div>
          </div>

          {/* 3. INTERNAL NOTES */}
          <div className="internal-notes-section" style={{ marginTop: "30px" }}>
            {/* Add New Note Section */}
            <div className="notes-section card">
              <h3>Add Internal Note</h3>
              <textarea
                placeholder="Enter new internal note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button onClick={handleAddNote} className="add-note-btn">
                Add Note
              </button>
            </div>

            {/* Display Existing Notes with CRUD */}
            <div className="notes-display-list">
              <h3>Team Notes ({internalNotes.length} Notes)</h3>
              {internalNotes.length === 0 && (
                <p className="text-gray-500">No Internal notes yet.</p>
              )}

              {internalNotes.map((item, index) => (
                <div key={item.id || index} className={`card note-item`}>
                  <div className="note-header">
                    <NotepadText size={16} />
                    <span className="note-author">
                      {item.subtype} by{" "}
                      <strong>{item.team_member || "Unknown"}</strong>
                    </span>
                    <span className="note-actions">
                      {editingNoteId !== item.id && (
                        <button
                          className="action-icon-btn edit-btn"
                          onClick={() => handleEditNote(item)}
                          title="Edit Note"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteNote(item.id)}
                        title="Delete Note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>

                  <div className="note-content">
                    {/* Display Note Content or Editor */}
                    {editingNoteId === item.id ? (
                      <div className="edit-container">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                        />
                        <div className="edit-controls">
                          <button
                            onClick={handleSaveEdit}
                            className="save-edit-btn"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="cancel-edit-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p>{item.details}</p>
                    )}
                  </div>

                  <span className="note-date">
                    {formatTimestamp(item.timestamp)}
                    {item.last_updated && (
                      <span className="edited-tag">(Edited)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
