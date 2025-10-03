import React, { useState, useEffect } from "react";
import "./App.css";
import { Search, Filter, Users, Globe, Clock, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_PORT = 8000; 

const formatLastActive = (timestamp) => {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

function Dashboard() {
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetch(`http://localhost:${API_PORT}/api/students`)
      .then((response) => response.json())
      .then((data) => {
        setAllStudents(data);
        setFilteredStudents(data);
        calculateSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const calculateSummary = (students) => {
    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(
        (s) =>
          (Date.now() - s.last_active_timestamp) / (1000 * 60 * 60 * 24) <= 30
      ).length, 
      essayStage: students.filter((s) => s.app_status === "Applying").length,
      highIntent: students.filter((s) => s.high_intent_score > 70).length,
    };
    setSummary(stats);
  };

  useEffect(() => {
    let results = allStudents;

    switch (activeFilter) {
      case "Not Contacted":
        results = results.filter(
          (s) =>
            (Date.now() - s.last_active_timestamp) / (1000 * 60 * 60 * 24) > 7
        );
        break;
      case "High Intent":
        results = results.filter((s) => s.high_intent_score > 70);
        break;
      case "Needs Essay Help":
        results = results.filter((s) => s.needs_essay_help === true);
        break;
      default: 
        break;
    }

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerCaseSearch) ||
          s.email.toLowerCase().includes(lowerCaseSearch)
      );
    }

    setFilteredStudents(results);
  }, [searchTerm, activeFilter, allStudents]);

  if (loading)
    return <div className="loading-state">Loading Admin Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Undergraduation CRM Dashboard</h1>
      </header>

      <div className="summary-stats">
        <div className="stat-card">
          <Users size={24} color="#3498db" />
          <p>Total Students</p>
          <strong>{summary.totalStudents}</strong>
        </div>
        <div className="stat-card">
          <Clock size={24} color="#27ae60" />
          <p>Active (30 days)</p>
          <strong>{summary.activeStudents}</strong>
        </div>
        <div className="stat-card">
          <BarChart size={24} color="#f39c12" />
          <p>In Essay Stage</p>
          <strong>{summary.essayStage}</strong>
        </div>
        <div className="stat-card">
          <Filter size={24} color="#8e44ad" />
          <p>High Intent</p>
          <strong>{summary.highIntent}</strong>
        </div>
      </div>

      <div className="quick-filters">
        <h2>Quick Filters</h2>
        {["All", "Not Contacted", "High Intent", "Needs Essay Help"].map(
          (filter) => (
            <button
              key={filter}
              className={`filter-button ${
                activeFilter === filter ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          )
        )}
      </div>

      <div className="directory-header">
        <h2>Student Directory ({filteredStudents.length} results)</h2>
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Country</th>
            <th>Application Status</th>
            <th>Last Active</th>
            <th>Intent Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id}>
              <td>
                <strong>{student.name}</strong>
              </td>
              <td>{student.email}</td>
              <td>
                <Globe
                  size={14}
                  style={{ verticalAlign: "middle", marginRight: "5px" }}
                />
                {student.country}
              </td>
              <td>
                <span
                  className={`status-badge status-${student.app_status.replace(
                    /\s/g,
                    ""
                  )}`}
                >
                  {student.app_status}
                </span>
              </td>
              <td>{formatLastActive(student.last_active_timestamp)}</td>
              <td>{student.high_intent_score}%</td>
              <td>
                <button
                  className="view-profile-btn"
                  onClick={() => navigate(`/student/${student.id}`)}
                >
                  View Profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
