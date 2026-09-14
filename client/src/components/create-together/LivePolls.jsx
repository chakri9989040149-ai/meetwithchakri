import React, { useState, useEffect } from 'react';
import { BarChart2, Plus, Check, X, Sparkles } from 'lucide-react';
import { getSocket } from '../../services/socket';

export default function LivePolls({ roomId, isHost = false, onClose }) {
  const [polls, setPolls] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [userVotedPolls, setUserVotedPolls] = useState({}); // pollId -> votedOptionIndex

  const socket = getSocket();

  useEffect(() => {
    const handleNewPoll = (poll) => {
      setPolls((prev) => [poll, ...prev]);
    };

    const handlePollUpdated = ({ pollId, votesCount, totalVotes }) => {
      setPolls((prev) =>
        prev.map((p) =>
          p.id === pollId ? { ...p, votesCount, totalVotes } : p
        )
      );
    };

    const handlePollsHistory = (historyPolls) => {
      setPolls(historyPolls);
    };

    socket.on('new-poll', handleNewPoll);
    socket.on('poll-updated', handlePollUpdated);
    socket.on('polls-history', handlePollsHistory);

    return () => {
      socket.off('new-poll', handleNewPoll);
      socket.off('poll-updated', handlePollUpdated);
      socket.off('polls-history', handlePollsHistory);
    };
  }, [socket]);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCreatePollSubmit = (e) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    socket.emit('create-poll', {
      roomId,
      question: question.trim(),
      options: validOptions
    });

    setQuestion('');
    setOptions(['', '']);
    setIsCreating(false);
  };

  const handleVote = (pollId, optionIndex) => {
    if (userVotedPolls[pollId] !== undefined) return;

    setUserVotedPolls((prev) => ({ ...prev, [pollId]: optionIndex }));
    socket.emit('vote-poll', {
      roomId,
      pollId,
      optionIndex
    });
  };

  return (
    <div className="w-full sm:w-80 md:w-96 h-full flex flex-col bg-white border-l border-slate-200/80 shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Polls</h3>
            <p className="text-[11px] text-slate-500">Ask questions and vote in real-time</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top action: Create Poll button */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create a Poll</span>
          </button>
        ) : (
          <form onSubmit={handleCreatePollSubmit} className="space-y-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">New Live Poll</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              placeholder="What would you like to ask?"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  required
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add another option</span>
              </button>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              Launch Poll
            </button>
          </form>
        )}
      </div>

      {/* Polls Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {polls.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
              <BarChart2 className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-medium text-slate-600">No active polls</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Create a poll above to gather quick opinions from all participants.
            </p>
          </div>
        ) : (
          polls.map((poll) => {
            const hasVoted = userVotedPolls[poll.id] !== undefined;
            const total = poll.totalVotes || 0;

            return (
              <div
                key={poll.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{poll.question}</h4>
                  <span className="text-[10px] text-slate-400">
                    By {poll.createdBy} &bull; {total} {total === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                <div className="space-y-2">
                  {poll.options.map((option, idx) => {
                    const count = poll.votesCount ? poll.votesCount[idx] : 0;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isSelected = userVotedPolls[poll.id] === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleVote(poll.id, idx)}
                        disabled={hasVoted}
                        className={`w-full relative overflow-hidden text-left p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50'
                            : 'border-slate-200 hover:border-brand-300 bg-slate-50/50'
                        }`}
                      >
                        {/* Background vote progress bar */}
                        {hasVoted && (
                          <div
                            className="absolute inset-y-0 left-0 bg-brand-200/40 transition-all duration-500 rounded-xl"
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="font-medium text-slate-800 flex items-center gap-1.5">
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                            <span>{option}</span>
                          </span>
                          {hasVoted && (
                            <span className="font-semibold text-[11px] text-slate-600">
                              {percent}% ({count})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
