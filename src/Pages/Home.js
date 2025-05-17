import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [newAgent, setNewAgent] = useState({ name: "", email: "", mobile: "", password: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "" });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({ title: "", description: "", assignedTo: "" });
  

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire("Unauthorized", "Please login first", "warning").then(() => {
        navigate("/login");
      });
      return;
    }

    fetchData(token);
  }, [navigate]);

  

  const handleCreateAgent = async () => {
    const token = localStorage.getItem("token");

    if (!newAgent.name || !newAgent.email || !newAgent.mobile || !newAgent.password) {
      return Swal.fire("Error", "All fields are required for Agent", "error");
    }
    setLoading(true);
    try {
      const res = await fetch("https://agents-task-be.onrender.com/create-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAgent),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire("Success", "Agent created", "success");
        setNewAgent({ name: "", email: "", mobile: "", password: "" });
        fetchData(token);
      } else {
        Swal.fire("Error", data?.error || "Failed to create agent", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    const token = localStorage.getItem("token");

    if (!newTask.title || !newTask.description || !newTask.assignedTo) {
      return Swal.fire("Error", "All fields are required for Task", "error");
    }
    setLoading(true);
    try {
      const res = await fetch("https://agents-task-be.onrender.com/create-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire("Success", "Task created", "success");
        setNewTask({ title: "", description: "", assignedTo: "" });
        setTasks((prevTasks) => [...prevTasks, data.task || data]);
      } else {
        Swal.fire("Error", data?.error || "Failed to create task", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (token) => {
  setLoading(true);
  try {
    // Get logged in user
    const userRes = await fetch("https://agents-task-be.onrender.com/user", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let userData = {};
    if (userRes.status !== 204) {
      userData = await userRes.json();
    }
    setUser(userData);

    // Get agents
    const agentRes = await fetch("https://agents-task-be.onrender.com/all-agents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let agentData = {};
    if (agentRes.status !== 204) {
      agentData = await agentRes.json();
    }
    setAgents(agentData.agents || []);

    // Get tasks
    const taskRes = await fetch("https://agents-task-be.onrender.com/all-tasks", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let taskData = {};
    if (taskRes.status !== 204) {
      taskData = await taskRes.json();
    }
    setTasks(taskData.tasks || []);
  } catch (err) {
    Swal.fire("Error", err.message, "error");
    if (err.message.toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleEditClick = (agent) => {
    setEditingAgent(agent._id);
    setEditName(agent.name);
    setEditEmail(agent.email);
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://agents-task-be.onrender.com/update-agent/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Success", "Agent updated", "success");
        setEditingAgent(null);
        fetchData(token);
      } else {
        Swal.fire("Error", data?.error || "Update failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    }
    setAgents((prevAgents) =>
    prevAgents.map(agent =>
      agent._id === id ? { ...agent, name: editName, email: editEmail } : agent
    )
  );
  setEditingAgent(null);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://agents-task-be.onrender.com/delete-agent/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        Swal.fire("Deleted", "Agent removed", "success");
        fetchData(token);
      } else {
        Swal.fire("Error", "Delete failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    }
  };

   const handleTaskEditClick = (task) => {
    setEditingTaskId(task._id);
    setEditTaskData({ title: task.title, description: task.description, assignedTo: task.assignedTo });
  };

  // New handler: Update task
  const handleTaskUpdate = async (id) => {
    const token = localStorage.getItem("token");

    if (!editTaskData.title || !editTaskData.description || !editTaskData.assignedTo) {
      return Swal.fire("Error", "All fields are required for Task", "error");
    }

    try {
      const res = await fetch(`https://agents-task-be.onrender.com/update-task/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editTaskData),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire("Success", "Task updated", "success");
        setEditingTaskId(null);
        fetchData(token);
      } else {
        Swal.fire("Error", data?.error || "Update failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    }
  };

  const handleTaskDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`https://agents-task-be.onrender.com/delete-task/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        Swal.fire("Deleted", "Task removed", "success");
        fetchData(token);
      } else {
        Swal.fire("Error", "Delete failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Welcome, {user.name || "Admin"}!</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </nav>

      {/* === Create Agent Form === */}
      <div className="bg-white p-4 mb-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Create Agent</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newAgent.name}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={newAgent.email}
            onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Mobile"
            value={newAgent.mobile}
            onChange={(e) => setNewAgent({ ...newAgent, mobile: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={newAgent.password}
            onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
            className="border p-2 rounded"
          />
        </div>
        {loading ? (
  <div className="flex justify-center items-center">
    <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
  </div>
) : (
        <button
          onClick={handleCreateAgent}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Create Agent
        </button>)}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading...</p>
        ) : (
          <>
            {/* Agents Section */}
            <h2 className="text-xl font-bold mb-4">Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent._id} className="bg-white p-4 rounded shadow">
                  {editingAgent === agent._id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border p-2 w-full mb-2"
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="border p-2 w-full mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(agent._id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingAgent(null)}
                          className="bg-gray-500 text-white px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Name:</strong> {agent.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {agent.email}
                      </p>
                      <p>
                        <strong>Mobile:</strong> {agent.mobile}
                      </p>

                      {/* ✅ Only show edit/delete if current user is Admin */}

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleEditClick(agent)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(agent._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>


                    </>
                  )}
                </div>
              ))}
            </div>
            {/* === Create Task Form === */}
            <div className="bg-white p-4 mb-6 mt-5 color-grey rounded shadow">
              <h2 className="text-lg font-semibold mb-4">Create Task</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="border p-2 rounded"
                />
               <select
  value={newTask.assignedTo}
  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
  className="border p-2 rounded"
>
  <option value="">Assign to Agent</option>
  {agents.map((agent) => (
    <option key={agent._id} value={agent._id}>
      {agent.name}
    </option>
  ))}
</select>
</div>
{loading ? (
  <div className="flex justify-center items-center">
    <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
  </div>
) : (
<button
  onClick={handleCreateTask}
  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  Create Task
</button> )}
</div>

{/* Tasks Section */}
<h2 className="text-xl font-bold mb-4">Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div key={task._id} className="bg-white p-4 rounded shadow">
            {editingTaskId === task._id ? (
              <>
                <input
                  type="text"
                  value={editTaskData.title}
                  onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                  className="border p-2 w-full mb-2 rounded"
                />
                <input
                  type="text"
                  value={editTaskData.description}
                  onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                  className="border p-2 w-full mb-2 rounded"
                />
                <select
                  value={editTaskData.assignedTo}
                  onChange={(e) => setEditTaskData({ ...editTaskData, assignedTo: e.target.value })}
                  className="border p-2 w-full mb-2 rounded"
                >
                  <option value="">Assign to Agent</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTaskUpdate(task._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTaskId(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  <strong>Title:</strong> {task.title}
                </p>
                <p>
                  <strong>Description:</strong> {task.description}
                </p>
                <p>
                  <strong>Assigned To:</strong>{" "}
                  {agents.find((agent) => agent._id === task.assignedTo)?.name || "Unassigned"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleTaskEditClick(task)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTaskDelete(task._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
</>
)}
</div>
</div>
);
};

export default Home;
