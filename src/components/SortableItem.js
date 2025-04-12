// src/components/Tabs/SortableItem.js
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiX, FiEdit2, FiEye, FiMove } from 'react-icons/fi';

const SortableItem = ({ id, index, block, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [prompt, setPrompt] = useState(block.prompt);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveEdit = (field) => {
    onEdit(index, field, field === 'title' ? title : prompt);
    if (field === 'title') setEditingTitle(false);
    if (field === 'prompt') setEditingPrompt(false);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-background border border-border-primary rounded-lg p-4 shadow-md flex flex-col space-y-2 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 rounded hover:bg-border-secondary"
            title="Drag to move"
          >
            <FiMove className="w-5 h-5 text-text-secondary" />
          </div>

          {editingTitle ? (
            <input
              type="text"
              className="bg-background border border-border-secondary text-text-primary rounded p-2 text-sm w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => saveEdit('title')}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit('title')}
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-lg">{block.title}</h3>
          )}
        </div>

        <div className="flex space-x-2">
          <button onClick={() => setEditingTitle(true)} className="text-text-secondary hover:text-primary" title="Edit Title">
            <FiEdit2 />
          </button>
          <button onClick={onDelete} className="text-text-secondary hover:text-status-error" title="Delete Block">
            <FiX />
          </button>
        </div>
      </div>

      <div>
        {editingPrompt ? (
          <textarea
            className="bg-background border border-border-secondary text-text-primary rounded p-2 text-sm w-full"
            value={prompt}
            rows="3"
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={() => saveEdit('prompt')}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('prompt')}
            autoFocus
          />
        ) : (
          <p 
            className="text-text-secondary whitespace-pre-wrap cursor-pointer"
            onClick={() => setEditingPrompt(true)}
            title="Click to edit prompt"
          >
            {block.prompt}
          </p>
        )}
      </div>

      <div className="text-xs text-text-secondary mt-2">
        <strong>Relevant Files:</strong> {block.relevant_files?.join(', ') || 'None'}
      </div>
    </div>
  );
};

export { SortableItem };
