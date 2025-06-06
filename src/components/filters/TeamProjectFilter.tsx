import React, { useState } from 'react';
import { Project, Team } from '../../types';
import { useFilters } from '../../context/FilterContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TeamProjectFilterProps {
  teams: Team[];
  projects: Project[];
  onClose: () => void;
}

const TeamProjectFilter: React.FC<TeamProjectFilterProps> = ({ 
  teams, 
  projects, 
  onClose 
}) => {
  const { filters, setTeams, setProjects } = useFilters();
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>(
    // Initially expand all teams
    teams.reduce((acc, team) => ({ ...acc, [team.id]: true }), {})
  );
  
  const handleTeamToggle = (teamId: string) => {
    if (filters.teams.includes(teamId)) {
      setTeams(filters.teams.filter(id => id !== teamId));
      
      // Also unselect all projects for this team
      const teamProjects = projects.filter(project => project.teamId === teamId);
      const teamProjectIds = teamProjects.map(project => project.id);
      setProjects(filters.projects.filter(id => !teamProjectIds.includes(id)));
    } else {
      setTeams([...filters.teams, teamId]);
    }
  };
  
  const handleProjectToggle = (projectId: string, teamId: string) => {
    if (filters.projects.includes(projectId)) {
      setProjects(filters.projects.filter(id => id !== projectId));
    } else {
      setProjects([...filters.projects, projectId]);
      
      // Make sure the team is also selected if any of its projects are selected
      if (!filters.teams.includes(teamId)) {
        setTeams([...filters.teams, teamId]);
      }
    }
  };
  
  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };
  
  const handleSelectAll = () => {
    setTeams(teams.map(team => team.id));
    setProjects(projects.map(project => project.id));
  };
  
  const handleClearAll = () => {
    setTeams([]);
    setProjects([]);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">Teams & Projects</h3>
        <div className="space-x-2 text-xs">
          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Select All
          </button>
          <span className="text-gray-500">|</span>
          <button
            onClick={handleClearAll}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {teams.map(team => {
          const teamProjects = projects.filter(project => project.teamId === team.id);
          const isExpanded = expandedTeams[team.id];
          
          return (
            <div key={team.id} className="mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`team-${team.id}`}
                    checked={filters.teams.includes(team.id)}
                    onChange={() => handleTeamToggle(team.id)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4
                      dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor={`team-${team.id}`}
                    className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {team.name}
                  </label>
                </div>
                
                <button
                  onClick={() => toggleTeamExpand(team.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {isExpanded && teamProjects.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {teamProjects.map(project => (
                    <div key={project.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`project-${project.id}`}
                        checked={filters.projects.includes(project.id)}
                        onChange={() => handleProjectToggle(project.id, team.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4
                          dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor={`project-${project.id}`}
                        className="ml-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        {project.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md
            hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TeamProjectFilter;