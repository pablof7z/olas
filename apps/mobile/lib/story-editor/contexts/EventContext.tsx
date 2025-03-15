import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';

interface EventContextType {
    eventStartTime: Date | null;
    setEventStartTime: (date: Date | null) => void;
    displayOption: 'countdown' | 'date';
    setDisplayOption: (option: 'countdown' | 'date') => void;
    dateString: string;
}

const defaultContext: EventContextType = {
    eventStartTime: null,
    setEventStartTime: () => {},
    displayOption: 'countdown',
    setDisplayOption: () => {},
    dateString: '',
};

const EventContext = createContext<EventContextType>(defaultContext);

export const useEventContext = () => useContext(EventContext);

export const EventProvider = ({ children }: { children: ReactNode }) => {
    const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
    const [displayOption, setDisplayOption] = useState<'countdown' | 'date'>('countdown');
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        if (eventStartTime) {
            setDateString(format(eventStartTime, 'MMM d, yyyy h:mm a'));
        } else {
            setDateString('');
        }
    }, [eventStartTime]);

    return (
        <EventContext.Provider value={{
            eventStartTime,
            setEventStartTime,
            displayOption,
            setDisplayOption,
            dateString
        }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEventStartTime = () => {
    const context = useEventContext();
    return {
        eventStartTime: context.eventStartTime,
        setEventStartTime: context.setEventStartTime,
        displayOption: context.displayOption,
        setDisplayOption: context.setDisplayOption,
        dateString: context.dateString
    };
};

export const useEventCountdown = (targetDate: Date | null): string => {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (!targetDate) {
            setCountdown('Set a date');
            return;
        }

        const calculateCountdown = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown("Time's up!");
                return;
            }

            // Calculate remaining time
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Format the remaining time
            if (days > 0) {
                setCountdown(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setCountdown(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setCountdown(`${minutes}m ${seconds}s`);
            }
        };

        // Update immediately
        calculateCountdown();

        // Update every second
        const intervalId = setInterval(calculateCountdown, 1000);
        return () => clearInterval(intervalId);
    }, [targetDate]);

    return countdown;
}; 