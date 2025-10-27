/**
 * Race Course Context
 * Manages extracted race course data across components
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { RaceCourseExtraction } from '@/lib/types/ai-knowledge';

interface RaceCourseContextValue {
  currentCourse: RaceCourseExtraction | null;
  isLoading: boolean;
  error: string | null;
  setCourse: (course: RaceCourseExtraction | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCourse: () => void;
}

const RaceCourseContext = createContext<RaceCourseContextValue | undefined>(undefined);

interface RaceCourseProviderProps {
  children: React.ReactNode;
}

export const RaceCourseProvider: React.FC<RaceCourseProviderProps> = ({ children }) => {
  const [currentCourse, setCurrentCourse] = useState<RaceCourseExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCourse = useCallback((course: RaceCourseExtraction | null) => {
    console.log('🏁 RaceCourseContext: Setting course:', course ? `${course.courseLayout.type} (${course.marks.length} marks)` : 'null');
    setCurrentCourse(course);
    setError(null); // Clear error when setting new course
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    console.log('⏳ RaceCourseContext: Setting loading:', loading);
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    console.log('❌ RaceCourseContext: Setting error:', errorMessage);
    setError(errorMessage);
    setIsLoading(false); // Clear loading when error occurs
  }, []);

  const clearCourse = useCallback(() => {
    console.log('🧹 RaceCourseContext: Clearing course data');
    setCurrentCourse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const contextValue: RaceCourseContextValue = {
    currentCourse,
    isLoading,
    error,
    setCourse,
    setLoading: setLoadingState,
    setError: setErrorState,
    clearCourse,
  };

  return (
    <RaceCourseContext.Provider value={contextValue}>
      {children}
    </RaceCourseContext.Provider>
  );
};

export const useRaceCourse = () => {
  const context = useContext(RaceCourseContext);
  if (context === undefined) {
    throw new Error('useRaceCourse must be used within a RaceCourseProvider');
  }
  return context;
};

export default RaceCourseContext;