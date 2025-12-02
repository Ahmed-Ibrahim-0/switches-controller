// src/components/Note/Note.jsx
import "./Note.css";

export default function Note({ text, onView }) {
  return (
    <li className="note-item">
      <span>{text}</span>
      <button className="note-view-btn" onClick={onView}>
        View
      </button>
    </li>
  );
}
