'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
}

export default function EisenhowerMatrix() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('eisenhower-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eisenhower-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const analyzeTask = (text: string): Task['quadrant'] => {
    const lower = text.toLowerCase();
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediate', 'deadline', 'today', 'now', 'critical', 'crisis'];
    const importantKeywords = ['important', 'strategic', 'goal', 'priority', 'crucial', 'essential', 'significant', 'key', 'vital', 'plan', 'growth'];

    const hasUrgent = urgentKeywords.some(keyword => lower.includes(keyword));
    const hasImportant = importantKeywords.some(keyword => lower.includes(keyword));

    if (hasUrgent && hasImportant) return 'urgent-important';
    if (!hasUrgent && hasImportant) return 'not-urgent-important';
    if (hasUrgent && !hasImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };

  const addTask = () => {
    if (!inputText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: inputText.trim(),
      quadrant: analyzeTask(inputText)
    };

    setTasks([...tasks, newTask]);
    setInputText('');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const moveTask = (id: string, newQuadrant: Task['quadrant']) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, quadrant: newQuadrant } : task
    ));
  };

  const getTasksByQuadrant = (quadrant: Task['quadrant']) => {
    return tasks.filter(task => task.quadrant === quadrant);
  };

  const QuadrantBox = ({
    quadrant,
    title,
    subtitle,
    bgColor,
    textColor
  }: {
    quadrant: Task['quadrant'];
    title: string;
    subtitle: string;
    bgColor: string;
    textColor: string;
  }) => {
    const quadrantTasks = getTasksByQuadrant(quadrant);

    return (
      <div className={`${bgColor} p-4 rounded-lg border-2 border-slate-300 flex flex-col h-64`}>
        <div className="mb-3">
          <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {quadrantTasks.map(task => (
            <div
              key={task.id}
              className="bg-white p-2 rounded shadow-sm flex justify-between items-start gap-2 group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task.id);
              }}
            >
              <span className="text-sm flex-1">{task.text}</span>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Eisenhower Matrix Task Tracker</h2>
        <p className="text-slate-600 mb-4">
          Add tasks below. The app automatically categorizes them based on urgency and importance keywords.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            placeholder="Enter a task (e.g., 'Urgent: Fix critical bug' or 'Important: Plan Q4 strategy')"
            className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={addTask}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          Tip: Use keywords like "urgent", "important", "deadline", "strategic", "goal" to help categorize tasks
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-4"
        onDragOver={(e) => e.preventDefault()}
      >
        <div
          onDrop={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('taskId');
            moveTask(taskId, 'urgent-important');
          }}
        >
          <QuadrantBox
            quadrant="urgent-important"
            title="DO FIRST"
            subtitle="Urgent & Important"
            bgColor="bg-red-50"
            textColor="text-red-700"
          />
        </div>

        <div
          onDrop={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('taskId');
            moveTask(taskId, 'not-urgent-important');
          }}
        >
          <QuadrantBox
            quadrant="not-urgent-important"
            title="SCHEDULE"
            subtitle="Not Urgent & Important"
            bgColor="bg-green-50"
            textColor="text-green-700"
          />
        </div>

        <div
          onDrop={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('taskId');
            moveTask(taskId, 'urgent-not-important');
          }}
        >
          <QuadrantBox
            quadrant="urgent-not-important"
            title="DELEGATE"
            subtitle="Urgent & Not Important"
            bgColor="bg-yellow-50"
            textColor="text-yellow-700"
          />
        </div>

        <div
          onDrop={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('taskId');
            moveTask(taskId, 'not-urgent-not-important');
          }}
        >
          <QuadrantBox
            quadrant="not-urgent-not-important"
            title="ELIMINATE"
            subtitle="Not Urgent & Not Important"
            bgColor="bg-slate-50"
            textColor="text-slate-700"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <p>📌 You can drag and drop tasks between quadrants to manually categorize them.</p>
      </div>
    </div>
  );
}
