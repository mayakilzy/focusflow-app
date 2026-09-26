'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable, DropResult } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Clock, 
  Calendar, 
  Target, 
  Flame, 
  CheckCircle, 
  Sun, 
  Moon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit
} from 'lucide-react';

// Types
interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  category: 'Deep Work' | 'Meetings' | 'Learning' | 'Break' | 'Personal';
  day: Date;
  startTime?: string; // HH:mm format
  completed: boolean;
}

interface CategoryConfig {
  id: 'Deep Work' | 'Meetings' | 'Learning' | 'Break' | 'Personal';
  color: string;
  icon: JSX.Element;
}

const categoryConfig: CategoryConfig[] = [
  { id: 'Deep Work', color: 'bg-blue-500', icon: <Target className="w-4 h-4" /> },
  { id: 'Meetings', color: 'bg-purple-500', icon: <Calendar className="w-4 h-4" /> },
  { id: 'Learning', color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'Break', color: 'bg-yellow-500', icon: <Coffee className="w-4 h-4" /> },
  { id: 'Personal', color: 'bg-pink-500', icon: <User className="w-4 h-4" /> },
];

const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = 8 + i;
  return `${hour}:00`;
});

export default function FocusFlow() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    duration: 30,
    category: 'Deep Work' as Task['category'],
    day: new Date(),
    startTime: '9:00',
  });

  // Initialize from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('focusflow-tasks');
    const savedDarkMode = localStorage.getItem('focusflow-darkmode');
    
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          day: parseISO(task.day),
        }));
        setTasks(parsedTasks);
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
      }
    }
    
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
    localStorage.setItem('focusflow-darkmode', darkMode.toString());
  }, [tasks, darkMode]);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleDragEnd = (result: DropResult) => {
    const { active, over } = result;
    
    if (!over) return;
    
    const taskId = active.id.toString();
    const newTimeSlot = over.id.toString();
    
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          startTime: newTimeSlot,
        };
      }
      return task;
    }));
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      duration: newTask.duration,
      category: newTask.category,
      day: new Date(newTask.day),
      startTime: newTask.startTime,
      completed: false,
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      duration: 30,
      category: 'Deep Work',
      day: new Date(),
      startTime: '9:00',
    });
    setShowAddTask(false);
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => isSameDay(task.day, day));
  };

  const getTasksForTimeSlot = (day: Date, timeSlot: string) => {
    return tasks.filter(task => 
      isSameDay(task.day, day) && task.startTime === timeSlot
    );
  };

  const calculateDailyFocusScore = (day: Date) => {
    const dayTasks = getTasksForDay(day);
    if (dayTasks.length === 0) return 0;
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / dayTasks.length) * 100);
  };

  const calculateWeeklyStreak = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
    
    let streak = 0;
    for (const day of weekDays) {
      const focusScore = calculateDailyFocusScore(day);
      if (focusScore >= 80) {
        streak++;
      }
    }
    
    return streak;
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const getDurationText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const weekDays = getWeekDays();
  const weeklyStreak = calculateWeeklyStreak();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">FocusFlow</h1>
            <p className="text-gray-600 dark:text-gray-400">Plan your week, block your time, track your focus</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow">
              <div className="flex items-center gap-1">
                <Flame className="text-orange-500" />
                <span className="font-semibold">{weeklyStreak}</span>
                <span>day streak</span>
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <div className="flex items-center gap-1">
                <Target className="text-green-500" />
                <span className="font-semibold">
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </span>
                <span>tasks</span>
              </div>
            </div>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={goToPreviousWeek}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {format(currentWeek, 'MMM d', { locale: zhCN })} - 
            {format(addDays(currentWeek, 6), 'MMM d, yyyy', { locale: zhCN })}
          </h2>
          
          <button 
            onClick={goToNextWeek}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekly Planner */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
            <div className="p-4 font-semibold text-gray-500 dark:text-gray-400">Time</div>
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className="p-4 text-center border-l border-gray-200 dark:border-gray-700"
              >
                <div className="font-semibold">
                  {format(day, 'EEE', { locale: zhCN })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(day, 'MMM d', { locale: zhCN })}
                </div>
                <div className="mt-2 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-lg font-bold">
                      {calculateDailyFocusScore(day)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="grid grid-cols-8">
            {/* Time labels */}
            <div className="border-r border-gray-200 dark:border-gray-700">
              {timeSlots.map((time, index) => (
                <div 
                  key={index} 
                  className="p-4 text-right text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="col-span-7">
                {timeSlots.map((timeSlot, timeIndex) => (
                  <div key={timeSlot} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                    {weekDays.map((day, dayIndex) => {
                      const tasksInSlot = getTasksForTimeSlot(day, timeSlot);
                      const isCurrentDay = isSameDay(day, new Date());
                      
                      return (
                        <Droppable 
                          key={`${dayIndex}-${timeIndex}`} 
                          droppableId={`${dayIndex}-${timeIndex}`}
                        >
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-20 p-2 ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                              <SortableContext 
                                items={tasksInSlot.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {tasksInSlot.map((task, taskIndex) => (
                                  <SortableTaskItem 
                                    key={task.id}
                                    task={task}
                                    index={taskIndex}
                                    onToggle={() => toggleTaskCompletion(task.id)}
                                    onDelete={() => deleteTask(task.id)}
                                    categoryConfig={categoryConfig.find(c => c.id === task.category)}
                                  />
                                ))}
                              </SortableContext>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Add New Task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title</label>
                  <input 
                    type="text" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="What needs to be done?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <select 
                    value={newTask.duration}
                    onChange={(e) => setNewTask({...newTask, duration: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value as Task['category']})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {categoryConfig.map(category => (
                      <option key={category.id} value={category.id}>{category.id}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Day</label>
                    <input 
                      type="date" 
                      value={format(newTask.day, 'yyyy-MM-dd')}
                      onChange={(e) => setNewTask({...newTask, day: new Date(e.target.value)})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <select 
                      value={newTask.startTime}
                      onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={addTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Task Item Component
const SortableTaskItem = ({ 
  task, 
  index, 
  onToggle, 
  onDelete,
  categoryConfig
}: { 
  task: Task; 
  index: number; 
  onToggle: () => void; 
  onDelete: () => void;
  categoryConfig?: CategoryConfig;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!categoryConfig) return null;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`task-item mb-2 p-3 rounded-lg shadow cursor-move ${categoryConfig.color} text-white ${task.completed ? 'opacity-70' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <button 
            onClick={onToggle}
            className="mt-1"
          >
            {task.completed ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white" />
            )}
          </button>
          <div>
            <div className="font-medium">{task.title}</div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Clock className="w-3 h-3" />
              <span>{getDurationText(task.duration)}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Helper function for duration display
function getDurationText(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
