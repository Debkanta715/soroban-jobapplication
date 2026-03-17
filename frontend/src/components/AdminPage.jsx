import React from "react";

export function AdminPage({ content, onSave, onReset, onBack }) {
  const [editorText, setEditorText] = React.useState(JSON.stringify(content, null, 2));
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    setEditorText(JSON.stringify(content, null, 2));
  }, [content]);

  const saveChanges = () => {
    try {
      const parsed = JSON.parse(editorText);
      onSave(parsed);
      setMessage("Saved successfully.");
    } catch (error) {
      setMessage(`Invalid JSON: ${error.message}`);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <button onClick={onBack}>Back To App</button>
        <button className="secondary" onClick={onReset}>Reset Default</button>
        <button onClick={saveChanges}>Save Content</button>
      </div>
      <p className="status">Admin path: /admin. Edit website content JSON here.</p>
      <textarea className="admin-editor" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
      <p className="auth-notice">{message}</p>
    </div>
  );
}
