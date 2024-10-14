import { createContext, useContext } from 'react';

import { event } from '@/lib/event';

const EventContext = createContext(event);

export const EventProvider = ({ children }) => {
  return (
    <EventContext.Provider value={event}>{children}</EventContext.Provider>
  );
};

export const useCustomEvent = () => useContext(EventContext);
