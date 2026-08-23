import React, { useState } from 'react';
import { Clock, Plus, Trash2, X } from 'lucide-react';

const RoutineRow = ({ task, time, onDelete }) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all animate-in fade-in zoom-in duration-300">
    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
      <Clock className="text-slate-400 w-5 h-5" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-800">{task}</p>
      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{time}</p>
    </div>
    <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
      <Trash2 size={18} />
    </button>
  </div>
);

const BehaviorTab = ({ data, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleDelete = (index) => {
    const newRoutines = data.routines.filter((_, i) => i !== index);
    onChange('routines', newRoutines);
  };

  const handleAdd = () => {
    if (newTask && newTime) {
      onChange('routines', [...data.routines, { task: newTask, time: newTime }]);
      setNewTask('');
      setNewTime('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-800">Historical Behavior Patterns</h4>
          <p className="text-sm text-slate-500 font-medium">Define historical routines to train the AI anomaly detection model.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-900 shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={16} />
          Add Routine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.routines?.map((routine, index) => (
          <RoutineRow 
            key={index} 
            task={routine.task} 
            time={routine.time} 
            onDelete={() => handleDelete(index)}
          />
        ))}
      </div>

      {/* Model Context Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-8 rounded-[2rem] mt-10 shadow-xl shadow-indigo-100 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
         <h5 className="font-bold text-white text-xl mb-3 relative z-10">AI Model Training Context</h5>
         <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6 relative z-10 max-w-lg">
            The historical patterns provided above establish a baseline for normal behavior. EchoCare AI monitors deviation thresholds in real-time to detect confusion or wandering.
         </p>
         <div className="flex items-center gap-6 relative z-10">
            <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
               <div className="h-full bg-white w-[78%] animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Training Ready</span>
            </div>
         </div>
      </div>

      {/* Beautiful Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800">Add Routine</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Activity Name</label>
                <input 
                  autoFocus
                  placeholder="e.g. Breakfast"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Scheduled Time</label>
                <input 
                  placeholder="e.g. 08:30 AM"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAdd}
                disabled={!newTask || !newTime}
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 transition-all active:scale-95 mt-4"
              >
                Save Pattern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehaviorTab;
