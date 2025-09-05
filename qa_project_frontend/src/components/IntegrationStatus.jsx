import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSlack, FaAws, FaRobot, FaGoogle, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { apiHelpers } from '../api';

export default function IntegrationStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await apiHelpers.integrations.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isActive) => {
    if (isActive) return <FaCheckCircle className="text-green-500" />;
    return <FaTimesCircle className="text-red-500" />;
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FaExclamationTriangle className="mx-auto text-2xl mb-2" />
          <p>Unable to load integration status</p>
        </div>
      </div>
    );
  }

  const integrations = [
    {
      name: 'Slack Integration',
      icon: FaSlack,
      status: status.slack?.status === 'active',
      description: 'Real-time notifications and daily summaries'
    },
    {
      name: 'AWS Services',
      icon: FaAws,
      status: status.aws?.status === 'active',
      description: 'S3 backup and CloudWatch metrics'
    },
    {
      name: 'AI Summarization',
      icon: FaRobot,
      status: status.ai?.status === 'active',
      description: 'OpenAI-powered content analysis'
    },
    {
      name: 'Google OAuth',
      icon: FaGoogle,
      status: true, // Assume configured if component is loaded
      description: 'Social login integration'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Integration Status
      </h3>
      
      <div className="space-y-3">
        {integrations.map((integration, index) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(integration.status)}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="text-xl text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {integration.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {integration.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(integration.status)}
                <span className={`text-sm font-medium ${
                  integration.status ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {integration.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Platform Features:</strong> AI Summarization, Slack Notifications, AWS Backup, Google OAuth
        </div>
      </div>
    </motion.div>
  );
}