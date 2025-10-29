import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface StatusIndicatorProps {
  className?: string;
}

type ServiceStatus = 'online' | 'offline' | 'checking' | 'error';

interface ServiceInfo {
  name: string;
  status: ServiceStatus;
  lastChecked: Date | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ className = '' }) => {
  const [services, setServices] = useState<ServiceInfo[]>([
    { name: 'Backend API', status: 'checking', lastChecked: null },
    { name: 'WebSocket', status: 'checking', lastChecked: null },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  const checkBackendStatus = async () => {
    try {
      const startTime = Date.now();
      await apiService.healthCheck();
      const responseTime = Date.now() - startTime;
      
      setServices(prev => prev.map(service => 
        service.name === 'Backend API' 
          ? { ...service, status: 'online' as ServiceStatus, lastChecked: new Date() }
          : service
      ));
    } catch (error) {
      setServices(prev => prev.map(service => 
        service.name === 'Backend API' 
          ? { ...service, status: 'offline' as ServiceStatus, lastChecked: new Date() }
          : service
      ));
    }
  };

  const checkWebSocketStatus = () => {
    // For now, we'll assume WebSocket status matches backend status
    // In a real implementation, you might want to test WebSocket connectivity
    const backendService = services.find(s => s.name === 'Backend API');
    if (backendService) {
      setServices(prev => prev.map(service => 
        service.name === 'WebSocket' 
          ? { ...service, status: backendService.status, lastChecked: new Date() }
          : service
      ));
    }
  };

  useEffect(() => {
    // Initial check
    checkBackendStatus();
    checkWebSocketStatus();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(() => {
      checkBackendStatus();
      checkWebSocketStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Server className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'checking':
        return 'text-yellow-600';
      case 'error':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const overallStatus = services.every(s => s.status === 'online') ? 'online' : 
                       services.some(s => s.status === 'offline') ? 'offline' : 
                       services.some(s => s.status === 'checking') ? 'checking' : 'error';

  const formatLastChecked = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div 
          className="px-5 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-4">
            {getStatusIcon(overallStatus)}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                Service Status
              </div>
              <div className={`text-xs ${getStatusColor(overallStatus)}`}>
                {getStatusText(overallStatus)}
              </div>
            </div>
            <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {isExpanded ? '▼' : '▶'}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50">
            {services.map((service, index) => (
              <div key={index} className="px-5 py-2 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {getStatusIcon(service.status)}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                      <div className={`text-xs ${getStatusColor(service.status)}`}>
                        {getStatusText(service.status)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 ml-3">
                    {formatLastChecked(service.lastChecked)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Manual refresh button */}
            <div className="px-5 py-2">
              <button
                onClick={() => {
                  setServices(prev => prev.map(s => ({ ...s, status: 'checking' as ServiceStatus })));
                  checkBackendStatus();
                  checkWebSocketStatus();
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-1.5 px-3 rounded hover:bg-blue-50 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
