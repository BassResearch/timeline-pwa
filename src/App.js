import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import supabase from './supabaseClient';
import { fetchNotes, insertNote, updateNote, deleteNoteDB } from './supabaseAPI';

export default function App() {
  const containerRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [creatingNote, setCreatingNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const activeNote = creatingNote || editingNote;

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await fetchNotes();
        setNotes(data);
      } catch (err) {
        console.error("Errore nel caricamento:", err);
      }
    };
    loadNotes();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight / 2;
    }
  }, []);

  const getYFromDate = (dateStr) => {
    if (!dateStr) return 5000;
    const inputDate = new Date(dateStr);
    const today = new Date();
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffInDays = Math.floor((today - inputDate) / (1000 * 60 * 60 * 24));
    const pixelsPerDay = 10;
    const centerY = 5000;
    return centerY - diffInDays * pixelsPerDay;
  };

  const handleCreateNote = (e) => {
    if (editingNote) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX + containerRef.current.scrollLeft - rect.left;
    const y = e.clientY + containerRef.current.scrollTop - rect.top;
    setCreatingNote({
      x,
      y,
      title: "",
      description: "",
      tags: "",
      date: "",
      image: null,
      id: Date.now(),
    });
  };

  const handleEditNote = (note) => {
    setEditingNote({ ...note });
  };

  const saveNote = async () => {
    if (editingNote) {
      const updatedNote = {
        ...editingNote,
        y: getYFromDate(editingNote.date),
      };
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? updatedNote : n))
      );
      await updateNote(updatedNote);
      setEditingNote(null);
    } else {
      const newNote = {
        ...creatingNote,
        y: getYFromDate(creatingNote.date || new Date().toISOString().split("T")[0]),
      };
      setNotes((prev) => [...prev, newNote]);
      await insertNote(newNote);
      setCreatingNote(null);
    }
  };

  const deleteNote = async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await deleteNoteDB(id);
  };

  const updateNotePosition = (id, x, y) => {
    const container = containerRef.current;
    const noteWidth = 250;
    const noteHeight = 150;
    const maxX = container.scrollWidth - noteWidth;
    const maxY = container.scrollHeight - noteHeight;
    const clampedX = Math.min(Math.max(0, x), maxX);
    const clampedY = Math.min(Math.max(0, y), maxY);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x: clampedX, y: clampedY } : n))
    );
  };

  const getImageURL = (note) => {
    if (!note.image) return null;
    if (typeof note.image === "string") return note.image;
    try {
      return URL.createObjectURL(note.image);
    } catch {
      return null;
    }
  };

  const renderTimelineLabels = () => {
    const labels = [];
    const today = new Date();
    for (let i = -365 * 5; i <= 0; i += 30) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const labelY = getYFromDate(date.toISOString().split("T")[0]);
      labels.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: labelY,
            transform: "translateX(-50%)",
            fontSize: 12,
            color: "#888",
            background: "white",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {date.toISOString().split("T")[0]}
        </div>
      );
    }
    return labels;
  };

  return (
    <div
      ref={containerRef}
      className="container"
      style={{ position: "relative", scrollSnapType: "y mandatory" }}
      onClick={handleCreateNote}
    >
      <div className="timeline-line-vertical" />
      {renderTimelineLabels()}

      {notes.map((note) => {
        const centerX = containerRef.current
          ? containerRef.current.clientWidth / 2 +
            containerRef.current.scrollLeft
          : 0;
        const noteWidth = 250;

        let lineLeft, lineWidth;
        if (note.x + noteWidth < centerX) {
          lineLeft = note.x + noteWidth;
          lineWidth = centerX - (note.x + noteWidth);
        } else if (note.x > centerX) {
          lineLeft = centerX;
          lineWidth = note.x - centerX;
        } else {
          lineLeft = centerX;
          lineWidth = 0;
        }

        const lineTop = note.y + 20;

        return (
          <React.Fragment key={note.id}>
            {lineWidth > 0 && (
              <div
                className="connector"
                style={{ left: lineLeft, top: lineTop, width: lineWidth }}
              />
            )}
            <motion.div
              drag
              dragConstraints={containerRef}
              dragElastic={0}
              dragMomentum={false}
              onDragEnd={(e, info) =>
                updateNotePosition(
                  note.id,
                  note.x + info.offset.x,
                  note.y + info.offset.y
                )
              }
              onDoubleClick={() => handleEditNote(note)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="note-wrapper"
              style={{ top: note.y, left: note.x, width: noteWidth }}
            >
              <div className="note-card" onClick={(e) => e.stopPropagation()}>
                <div className="font-bold text-lg mb-1">{note.title}</div>
                <div className="text-sm mb-2 whitespace-pre-wrap">
                  {note.description}
                </div>
                {getImageURL(note) && (
                  <img src={getImageURL(note)} alt="note" />
                )}
                <div className="text-xs text-gray-600 mb-2">
                  Tags: {note.tags}
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}

      {activeNote && (
        <div
          className="form-wrapper"
          style={{
            position: "absolute",
            top: activeNote.y,
            left: activeNote.x,
            width: 300,
            zIndex: 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white shadow-lg rounded p-4 space-y-2">
            <input
              className="border p-1 w-full"
              placeholder="Title"
              value={activeNote.title}
              onChange={(e) =>
                editingNote
                  ? setEditingNote({ ...editingNote, title: e.target.value })
                  : setCreatingNote({ ...creatingNote, title: e.target.value })
              }
            />
            <textarea
              className="border p-1 w-full resize-none"
              rows={3}
              placeholder="Description"
              value={activeNote.description}
              onChange={(e) =>
                editingNote
                  ? setEditingNote({
                      ...editingNote,
                      description: e.target.value,
                    })
                  : setCreatingNote({
                      ...creatingNote,
                      description: e.target.value,
                    })
              }
            />
            <input
              className="border p-1 w-full"
              placeholder="Tags"
              value={activeNote.tags}
              onChange={(e) =>
                editingNote
                  ? setEditingNote({ ...editingNote, tags: e.target.value })
                  : setCreatingNote({ ...creatingNote, tags: e.target.value })
              }
            />
            <DatePicker
              selected={activeNote.date ? new Date(activeNote.date) : null}
              onChange={(date) => {
                const iso = date.toISOString().split("T")[0];
                editingNote
                  ? setEditingNote({ ...editingNote, date: iso })
                  : setCreatingNote({ ...creatingNote, date: iso });
              }}
              maxDate={new Date()}
              className="border p-1 w-full"
              placeholderText="Seleziona la data"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                editingNote
                  ? setEditingNote({
                      ...editingNote,
                      image: e.target.files[0],
                    })
                  : setCreatingNote({
                      ...creatingNote,
                      image: e.target.files[0],
                    })
              }
            />
            <div className="flex justify-between pt-2">
              <button
                onClick={saveNote}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                {editingNote ? "Update" : "Save"}
              </button>
              <button
                onClick={() => {
                  setCreatingNote(null);
                  setEditingNote(null);
                }}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className="add-btn"
        onClick={(e) => {
          e.stopPropagation();
          const rect = containerRef.current.getBoundingClientRect();
          const x = rect.width / 2 + containerRef.current.scrollLeft;
          const y = rect.height / 2 + containerRef.current.scrollTop;
          setCreatingNote({
            x,
            y,
            title: "",
            description: "",
            tags: "",
            date: "",
            image: null,
            id: Date.now(),
          });
        }}
      >
        +
      </button>
    </div>
  );
}
