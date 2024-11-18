import React, { useState, useEffect } from 'react';
import { Text, TextProps } from 'react-native';

interface RelativeTimeProps {
    timestamp: number; // Timestamp in seconds
    dateThreshold?: number; // Defaults to 24 hours
    timeThreshold?: number; // Defaults to 2 hours
}

const RelativeTime: React.FC<RelativeTimeProps & TextProps> = ({
    timestamp,
    dateThreshold = 24 * 60 * 60, // 24 hours in seconds
    timeThreshold = 2 * 60 * 60, // 2 hours in seconds
    ...props
}) => {
    const [relativeTime, setRelativeTime] = useState<string>('');

    useEffect(() => {
        const updateRelativeTime = () => {
            const now = Date.now() / 1000; // Current time in seconds
            const elapsed = now - timestamp;

            if (elapsed < 60) {
                setRelativeTime('just now');
            } else if (elapsed < 3600) {
                setRelativeTime(`${Math.floor(elapsed / 60)} min ago`);
            } else if (elapsed < timeThreshold) {
                setRelativeTime(`${Math.floor(elapsed / 3600)} hr ago`);
            } else if (elapsed < dateThreshold) {
                setRelativeTime(new Date(timestamp * 1000).toLocaleTimeString());
            } else {
                setRelativeTime(new Date(timestamp * 1000).toLocaleDateString());
            }
        };

        updateRelativeTime();
        const intervalId = setInterval(updateRelativeTime, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [timestamp, dateThreshold, timeThreshold]);

    return <Text {...props}>{relativeTime}</Text>;
};

export default RelativeTime;
